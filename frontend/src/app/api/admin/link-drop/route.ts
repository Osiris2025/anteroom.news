import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const ADMIN_ROLES = ["superadmin", "admin"];
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const FALLBACK_MODEL = "deepseek/deepseek-v4-flash-0731";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Guard: admins only. Returns { denied } (403) or { userId }. */
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

/** If an article with this source URL already exists, build a friendly 409 response. */
async function duplicateResponse(sourceUrl: string): Promise<Response | null> {
  const rows = await db
    .select({
      id: article.id,
      title: article.title,
      headline: article.headline,
      status: article.status,
      magazineName: magazine.name,
    })
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.sourceUrl, sourceUrl))
    .limit(1);
  const existing = rows[0];
  if (!existing) return null;
  const title = existing.headline || existing.title || "Untitled";
  const where = existing.magazineName ? ` in ${existing.magazineName}` : "";
  const articleUrl = `/articles/${existing.id}`;
  return Response.json(
    {
      error: `Already on the site: ${title} (${existing.status}${where})`,
      duplicate: {
        id: existing.id,
        title,
        status: existing.status,
        magazineName: existing.magazineName,
        url: articleUrl,
      },
    },
    { status: 409 }
  );
}

/** Fetch + extract OpenGraph / meta tags from a URL. */
async function extractMeta(url: string): Promise<{
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  textContent: string;
}> {
  let resp: Response;
  try {
    resp = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AINewsNexus/1.0; +https://nexus.osiris2025.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    return { title: null, description: null, imageUrl: null, textContent: "" };
  }
  if (!resp.ok) return { title: null, description: null, imageUrl: null, textContent: "" };

  const html = await resp.text().catch(() => "");
  if (!html) return { title: null, description: null, imageUrl: null, textContent: "" };

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
    og("title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
  const description = og("description");
  const imageUrl = og("image");

  // Strip HTML for LLM context — remove scripts, styles, tags
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8_000); // keep first ~8K chars as LLM context

  return { title, description, imageUrl, textContent };
}

/** Call OpenRouter with the given messages. Returns content or throws. */
async function callLLM(
  apiKey: string,
  system: string,
  user: string,
  model = FALLBACK_MODEL,
  timeoutMs = 60_000
): Promise<string> {
  const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://nexus.osiris2025.com",
      "X-Title": "Anteroom",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenRouter ${resp.status}: ${text.slice(0, 300)}`);
  }

  const data: any = await resp.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenRouter returned no content");
  return content;
}

// ---------------------------------------------------------------------------
// POST /api/admin/link-drop — paste a URL → AI interrogates → drops as draft
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const g = await guard();
  if (g.denied) return g.denied;
  const userId = g.userId;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });
  }

  // --- Parse body ---
  let body: any = {};
  try { body = await req.json(); } catch {}
  const rawUrl = (body.url || "").trim();
  if (!rawUrl) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return Response.json({ error: "Only http/https URLs supported" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }
  const explicitMagazineId = body.magazineId || null;

  // --- Duplicate check (before any fetch/AI work) ---
  try {
    const dup = await duplicateResponse(rawUrl);
    if (dup) return dup;
  } catch (e) {
    console.error("Link-drop duplicate check failed:", e);
  }

  // --- Fetch + extract ---
  const meta = await extractMeta(rawUrl);
  if (!meta.title) {
    return Response.json(
      { error: "Could not extract a title from that URL — may be a paywall or non-article page" },
      { status: 422 }
    );
  }

  // --- Load magazines for auto-detect ---
  const magazines: any[] = await db.select().from(magazine);
  const magList = magazines.map((m: any) => `  - ${m.id}: "${m.name}" — ${m.tagline || ""}`).join("\n");
  const magNamesForLLM = magazines.map((m: any) => `"${m.name}" (${m.id})`).join(", ");

  // --- AI interrogation: auto-detect magazine + write summary + write commentary ---
  let detectedMagazineId: string | null = explicitMagazineId;
  let aiSummary: string | null = null;
  let aiCommentary: string | null = null;
  let aiThoughts: any = {};

  const system = [
    "You are an AI news curator for Anteroom. You evaluate article URLs and produce structured output.",
    "Your job: (1) Assign the article to the most relevant magazine, (2) write a concise summary, (3) write a short editorial commentary/thoughts.",
    "",
    `Available magazines:\n${magList}`,
    "",
    "Respond with valid JSON ONLY in this exact format (no markdown, no explanation):",
    JSON.stringify({
      magazine_id: "the best-matching magazine id from the list above, or null if unclear",
      summary: "2-3 sentence summary of the article (max 250 chars)",
      commentary: "2-3 paragraph editorial commentary in a sharp, engaging voice (120-200 words)",
      suitability_warnings: "any concerns about suitability for publication, or 'none'",
    }),
  ].join("\n");

  const user = [
    `Article URL: ${rawUrl}`,
    `Title: ${meta.title}`,
    meta.description ? `Description: ${meta.description}` : "",
    meta.textContent ? `Page text (first 8K chars):\n${meta.textContent}` : "",
    "\nAnalyze this article and return JSON.",
  ].filter(Boolean).join("\n");

  try {
    const llmResult = await callLLM(apiKey, system, user);
    const parsed = JSON.parse(llmResult.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim());

    // Use explicit magazine if given, otherwise detected
    if (!explicitMagazineId && parsed.magazine_id) {
      const valid = magazines.find((m) => m.id === parsed.magazine_id);
      if (valid) detectedMagazineId = valid.id;
    }
    aiSummary = parsed.summary || meta.description || null;
    aiCommentary = parsed.commentary || null;
    aiThoughts = {
      agent: "Link Dropper AI",
      model: FALLBACK_MODEL,
      generatedAt: new Date().toISOString(),
      suitabilityWarnings: parsed.suitability_warnings || null,
    };
  } catch (e: any) {
    // LLM call failed — fall back to meta-only
    console.warn("Link-dropper LLM failed, falling back to meta extraction:", e.message);
    aiSummary = meta.description || null;
  }

  // --- Insert draft ---
  const id = `link-${crypto.randomBytes(6).toString("hex")}`;

  try {
    const [created] = await db
      .insert(article)
      .values({
        id,
        ingress: "admin-link",
        sourceUrl: rawUrl,
        imageUrl: meta.imageUrl,
        title: meta.title,
        summary: aiSummary,
        commentary: aiCommentary,
        aiThoughts: JSON.stringify(aiThoughts),
        status: "draft",
        magazineId: detectedMagazineId,
        submittedBy: userId,
        submittedAt: new Date(),
      })
      .returning();

    return Response.json({
      article: created,
      ai_commentary: aiCommentary,
      detected_magazine_id: detectedMagazineId,
    });
  } catch (e: any) {
    console.error("Link-drop insert failed:", e);
    const code = e?.code || e?.cause?.code;
    if (code === "23505") {
      const dup = await duplicateResponse(rawUrl).catch(() => null);
      if (dup) return dup;
      return Response.json({ error: "Already on the site: this link has been added before." }, { status: 409 });
    }
    return Response.json({ error: "Could not save the article. Please try again." }, { status: 500 });
  }
}