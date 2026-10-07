import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { duplicateResponse, insertErrorResponse } from "@/lib/articleDuplicate";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "deepseek/deepseek-v4-flash-0731";

// Magazine catalogue used for AI auto-detection and DB seeding
const MAGAZINE_CATALOGUE: { id: string; name: string; description: string }[] = [
  { id: "weekly-weird-news", name: "Weekly Weird News", description: "Satirical tabloid covering cryptids, UFOs, and the unexplainable" },
  { id: "weird-and-wild", name: "Weird & Wild", description: "Speculative science and unusual natural phenomena" },
  { id: "tech-pulse", name: "Tech Pulse", description: "Technology news and digital culture" },
  { id: "poli-split", name: "Poli Split", description: "Political news and analysis" },
  { id: "climate-watch", name: "Climate Watch", description: "Climate science and environmental news" },
  { id: "startup-signal", name: "Startup Signal", description: "Startup and venture capital news" },
  { id: "oss-report", name: "OSS Report", description: "Open source software news and ecosystem updates" },
];

// Fetch + extract OpenGraph / meta tags from a URL
async function extractMeta(url: string): Promise<{
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}> {
  let resp: Response;
  try {
    resp = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AINewsNexus/1.0; +https://nexus.osiris2025.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    return { title: null, description: null, imageUrl: null };
  }
  if (!resp.ok) return { title: null, description: null, imageUrl: null };

  const html = await resp.text().catch(() => "");
  if (!html) return { title: null, description: null, imageUrl: null };

  const og = (prop: string): string | null => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["'](?:og:|twitter:)${prop}["'][^>]+content=["']([^"']+)["']`,
      "i"
    );
    const m = html.match(re);
    if (m) return m[1].trim();
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:|twitter:)${prop}["']`,
      "i"
    );
    const m2 = html.match(re2);
    return m2 ? m2[1].trim() : null;
  };

  const title =
    og("title") ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    null;

  const description = og("description");
  const imageUrl = og("image");
  return { title, description, imageUrl };
}

// Call OpenRouter with an analysis prompt for magazine detection + suitability
async function analyzeWithAI(
  title: string,
  description: string | null,
  apiKey: string
): Promise<{
  magazineId: string | null;
  suitabilityOk: boolean;
  warnings: { level: string; message: string }[];
}> {
  const catalogue = MAGAZINE_CATALOGUE.map(
    (m) => `- "${m.id}" (${m.name}): ${m.description}`
  ).join("\n");

  const system = [
    `You are a news intake classifier for Anteroom.`,
    `Your job: read an article title and description, then:`,
    `1. Pick the MOST appropriate magazine from the catalogue below.`,
    `2. Flag any suitability concerns (profanity, hate speech, spam, paywall-only, clickbait-only, violent/extremist content that shouldn't be published).`,
    `3. If the article doesn't fit any magazine well, respond with magazineId: null.`,
    ``,
    `Magazine catalogue:`,
    catalogue,
    ``,
    `Respond with JSON only (no markdown fences, no commentary):`,
    `{"magazineId":"...","suitabilityOk":true/false,"warnings":[{"level":"info|warn|block","message":"..."}]}`,
    `- suitabilityOk=false + level:"block" if the content is clearly unsuitable for publication.`,
    `- Use level:"warn" for minor concerns (strong language, potential bias).`,
    `- Use level:"info" for neutral observations.`,
    `- Set warnings to [] if everything looks clean.`,
  ].join("\n");

  const user = `Title: ${title}\nDescription: ${description || "(none)"}\n\nClassify this article.`;

  try {
    const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://nexus.osiris2025.com",
        "X-Title": "Anteroom",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error(`OpenRouter classify error ${resp.status}: ${text.slice(0, 200)}`);
      return { magazineId: null, suitabilityOk: true, warnings: [{ level: "info", message: "AI classification unavailable; article queued for manual review." }] };
    }

    const data: any = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { magazineId: null, suitabilityOk: true, warnings: [] };
    }

    const parsed = JSON.parse(content);
    return {
      magazineId: parsed.magazineId || null,
      suitabilityOk: parsed.suitabilityOk !== false,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch (e: any) {
    console.error(`OpenRouter classify exception: ${e?.message || e}`);
    return { magazineId: null, suitabilityOk: true, warnings: [{ level: "info", message: "AI classification unavailable; article queued for manual review." }] };
  }
}

// POST /api/collect — any signed-in user can drop a link
// Body: { url }
// Returns: { ok, article?, magazine?: {id, name}, warnings?, suitabilityOk? }
export async function POST(req: NextRequest) {
  // Guard: must be signed in (any user, not just admin)
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {}
  if (!session?.user) {
    return Response.json({ error: "You must be signed in to collect links" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const rawUrl = (body.url || "").trim();
  if (!rawUrl) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return Response.json({ error: "Only http/https URLs are supported" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Duplicate check (before any fetch/AI work)
  const dup = await duplicateResponse(rawUrl);
  if (dup) return dup;

  // Fetch + extract meta
  const meta = await extractMeta(rawUrl);
  if (!meta.title) {
    return Response.json(
      { error: "Could not extract a title from that URL — it may be a paywall or non-article page" },
      { status: 422 }
    );
  }

  // AI auto-detect magazine + check suitability
  const aiResult = await analyzeWithAI(meta.title, meta.description, apiKey);

  // If suitability is blocked, still create the draft but flagged for admin review
  if (!aiResult.suitabilityOk && aiResult.warnings.some((w) => w.level === "block")) {
    // Create article as flagged draft with warnings
    const id = `collect-${crypto.randomBytes(6).toString("hex")}`;
    let created: any;
    try {
    [created] = await db
      .insert(article)
      .values({
        id,
        ingress: "collector",
        sourceUrl: rawUrl,
        imageUrl: meta.imageUrl,
        title: meta.title,
        summary: meta.description || null,
        status: "draft",
        magazineId: aiResult.magazineId,
        flagged: true,
        suitabilityOk: false,
        warnings: JSON.stringify(aiResult.warnings),
        submittedBy: session.user.id,
        submittedAt: new Date(),
      })
      .returning();
    } catch (e: any) {
      return insertErrorResponse(e, rawUrl, "Collect (flagged)");
    }

    return Response.json({
      ok: true,
      article: created,
      warnings: aiResult.warnings,
      suitabilityOk: false,
      magazine: aiResult.magazineId ? MAGAZINE_CATALOGUE.find((m) => m.id === aiResult.magazineId) || null : null,
      message: "Article saved as flagged draft — suitability concerns detected.",
    });
  }

  // Normal case: create draft
  const id = `collect-${crypto.randomBytes(6).toString("hex")}`;
  try {
    const [created] = await db
      .insert(article)
      .values({
        id,
        ingress: "collector",
        sourceUrl: rawUrl,
        imageUrl: meta.imageUrl,
        title: meta.title,
        summary: meta.description || null,
        status: "draft",
        magazineId: aiResult.magazineId,
        flagged: !aiResult.suitabilityOk,
        suitabilityOk: aiResult.suitabilityOk,
        warnings: aiResult.warnings.length > 0 ? JSON.stringify(aiResult.warnings) : null,
        submittedBy: session.user.id,
        submittedAt: new Date(),
      })
      .returning();

    const magInfo = aiResult.magazineId
      ? MAGAZINE_CATALOGUE.find((m) => m.id === aiResult.magazineId) || null
      : null;

    return Response.json({
      ok: true,
      article: created,
      magazine: magInfo,
      warnings: aiResult.warnings,
      suitabilityOk: aiResult.suitabilityOk,
      message: magInfo
        ? `✅ "${created.title}" saved as draft in ${magInfo.name}`
        : `✅ "${created.title}" saved as draft — magazine needs manual assignment.`,
    });
  } catch (e: any) {
    return insertErrorResponse(e, rawUrl, "Collect");
  }
}