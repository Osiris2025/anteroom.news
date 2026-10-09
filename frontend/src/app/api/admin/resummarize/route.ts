import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
// Same default the engine summarizer, Link Dropper and commentary routes use.
const FALLBACK_MODEL = "deepseek/deepseek-v4-flash-0731";
const MAX_PAGE_TEXT = 8_000;

/** Guard: admins (incl. superadmin) only. */
async function guard(): Promise<{ denied: Response } | { denied: null; userId: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as any)?.role || "";
    if (!session?.user?.id || !ADMIN_ROLES.includes(role)) {
      return { denied: Response.json({ error: "Forbidden — admin only" }, { status: 403 }) };
    }
    return { denied: null, userId: session.user.id };
  } catch {
    return { denied: Response.json({ error: "Forbidden — admin only" }, { status: 403 }) };
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return " "; } })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return " "; } });
}

const stripTags = (h: string) => decodeEntities(h.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/**
 * Re-fetch the publisher page and pull readable text out of it. Prefers the
 * story's <p> paragraphs (inside <article> when present) so the model sees the
 * actual article rather than nav/footer boilerplate; falls back to the whole
 * stripped page like the Link Dropper does. Returns "" when the site blocks us.
 */
async function fetchArticleText(url: string): Promise<{ text: string; description: string | null; status: string }> {
  let resp: Response;
  try {
    resp = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Anteroom/1.0; +https://anteroom.news)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (e: any) {
    return { text: "", description: null, status: `fetch failed (${e?.name === "TimeoutError" ? "timed out" : "network error"})` };
  }
  if (!resp.ok) return { text: "", description: null, status: `site returned HTTP ${resp.status}` };
  const html = await resp.text().catch(() => "");
  if (!html) return { text: "", description: null, status: "empty page" };

  const metaDesc = (() => {
    const a = html.match(/<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?description["'][^>]+content=["']([^"']+)["']/i);
    if (a) return decodeEntities(a[1]).trim();
    const b = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:|twitter:)?description["']/i);
    return b ? decodeEntities(b[1]).trim() : null;
  })();

  const clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)[^>]*>[\s\S]*?<\/\1>/gi, " ");

  const parasOf = (h: string) => Array.from(h.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => stripTags(m[1]))
    .filter((p) => p.length >= 40)
    .join("\n\n");
  // Best of: each <article> block, or every paragraph on the page.
  const candidates = [
    ...Array.from(clean.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)).map((m) => parasOf(m[1])),
    parasOf(clean),
  ];
  const articleBest = candidates.slice(0, -1).sort((x, y) => y.length - x.length)[0] || "";
  // Prefer the article block unless it's clearly a teaser compared to the page.
  let text = articleBest.length >= 800 || articleBest.length >= candidates[candidates.length - 1].length * 0.5
    ? articleBest : candidates[candidates.length - 1];
  if (text.length < 400) text = stripTags(clean); // paragraph extraction found too little
  return { text: text.slice(0, MAX_PAGE_TEXT), description: metaDesc, status: "ok" };
}

function parseAiThoughts(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : { raw };
  } catch {
    return { raw };
  }
}

/** Pull the summary out of the model reply (tolerant of missing tags / quotes). */
function extractSummary(reply: string): string {
  const m = reply.match(/<summary>\s*([\s\S]*?)\s*(?:<\/summary>|$)/i);
  let s = (m ? m[1] : reply).replace(/<[^>]+>/g, "").trim();
  s = s.replace(/^\s*(?:\*\*)?summary(?:\*\*)?\s*:\s*/i, "").trim();
  if (/^["“][\s\S]*["”]$/.test(s)) s = s.slice(1, -1).trim();
  return s.slice(0, 2000);
}

// POST /api/admin/resummarize { articleId }            → regenerate the summary with AI
// POST /api/admin/resummarize { articleId, undo: true } → put the previous summary back
//
// The summary we replace is kept in article.ai_thoughts.previousSummary so it can
// be undone (undo swaps them, so a second undo re-applies the new one). The
// search index (search_vector) is refreshed automatically by the DB trigger
// trg_article_search_vector whenever summary changes.
export async function POST(req: NextRequest) {
  const g = await guard();
  if (g.denied) return g.denied;

  let body: any = {};
  try { body = await req.json(); } catch {}
  const articleId = body.articleId || body.article_id;
  if (!articleId || typeof articleId !== "string") {
    return Response.json({ error: "articleId is required" }, { status: 400 });
  }

  const rows: any[] = await db
    .select()
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.id, articleId));
  const row = rows[0];
  if (!row?.article) return Response.json({ error: "Article not found" }, { status: 404 });
  const a = row.article;
  const mag = row.magazine;
  const thoughts = parseAiThoughts(a.aiThoughts);

  // ---- Undo: swap current summary with the saved previous one ----
  if (body.undo) {
    if (!("previousSummary" in thoughts)) {
      return Response.json({ error: "Nothing to undo for this article" }, { status: 409 });
    }
    const restored: string | null = thoughts.previousSummary || null;
    const next = { ...thoughts, previousSummary: a.summary || "", summaryRestoredAt: new Date().toISOString() };
    await db.update(article).set({ summary: restored, aiThoughts: JSON.stringify(next) }).where(eq(article.id, articleId));
    return Response.json({ summary: restored, previousSummary: a.summary || null, undone: true });
  }

  // ---- Regenerate ----
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY is not set in the frontend container" }, { status: 500 });

  let pageText = "";
  let pageDesc: string | null = null;
  let fetchStatus = "no source URL";
  if (a.sourceUrl && /^https?:\/\//i.test(a.sourceUrl)) {
    const got = await fetchArticleText(a.sourceUrl);
    pageText = got.text;
    pageDesc = got.description;
    fetchStatus = got.status;
  }
  const usedSource = pageText.length >= 200 ? "page" : "existing";
  if (usedSource === "existing" && !a.summary && !pageDesc) {
    return Response.json(
      { error: `Couldn't read the source page (${fetchStatus}) and there's no existing text to work from` },
      { status: 422 }
    );
  }

  const brand = mag?.name || "Anteroom";
  const tone = mag?.tone || "neutral";
  const model = mag?.agentModel || FALLBACK_MODEL;

  // Same brief as the engine summarizer (engine/src/engine/agents/summarizer.py),
  // asking for the summary section only.
  const system = [
    `You are an AI content editor for "${brand}".`,
    mag?.tagline ? `Tagline: ${mag.tagline}` : "",
    mag?.description ? `About ${brand}: ${mag.description}` : "",
    "",
    `Write a concise 2-3 sentence summary (100-150 words at most) of the news article in the ${tone} tone of ${brand}.`,
    "Say plainly what happened and why it matters. Do NOT fabricate facts: use only what the provided text supports.",
    "No headline, no preamble, no bullet points, no links. Output ONLY the summary wrapped in <summary></summary> tags.",
  ].filter((l) => l !== null).join("\n").replace(/\n{3,}/g, "\n\n");

  const user = [
    `Source article URL: ${a.sourceUrl || "N/A"}`,
    `Title: ${a.title}`,
    pageDesc ? `Publisher description: ${pageDesc}` : "",
    usedSource === "page"
      ? `Article text (first ${MAX_PAGE_TEXT / 1000}K chars):\n${pageText}`
      : `The source page could not be read. Current summary (rewrite and improve it, without adding facts):\n${(a.summary || "").slice(0, 2000)}`,
    "\nWrite the <summary> now.",
  ].filter(Boolean).join("\n");

  let reply = "";
  try {
    const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://anteroom.news",
        "X-Title": "Anteroom",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      return Response.json({ error: `OpenRouter ${resp.status}: ${t.slice(0, 300)}` }, { status: 502 });
    }
    const data: any = await resp.json();
    reply = data?.choices?.[0]?.message?.content?.trim() || "";
  } catch (e: any) {
    return Response.json({ error: `OpenRouter request failed: ${e?.message || e}` }, { status: 502 });
  }

  const summary = extractSummary(reply);
  if (summary.length < 20) return Response.json({ error: "The AI returned an empty summary — try again" }, { status: 502 });

  const next = {
    ...thoughts,
    previousSummary: a.summary || "",
    summaryRegeneratedAt: new Date().toISOString(),
    summaryModel: model,
    summarySource: usedSource,
    summaryRegeneratedBy: g.userId,
  };
  await db.update(article).set({ summary, aiThoughts: JSON.stringify(next) }).where(eq(article.id, articleId));

  return Response.json({
    summary,
    previousSummary: a.summary || null,
    usedSource,           // "page" = re-read the publisher; "existing" = site blocked us, rewrote the old summary
    fetchStatus,
    model,
  });
}
