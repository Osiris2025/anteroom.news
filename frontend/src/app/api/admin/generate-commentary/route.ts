import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const FALLBACK_MODEL = "deepseek/deepseek-v4-flash-0731";

// Guard: admins (incl. superadmin) only.
async function guard(): Promise<Response | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as any)?.role || "";
    if (!ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  return null;
}

// POST /api/admin/generate-commentary { article_id }
// Loads the article + its magazine's named agent, calls the LLM via OpenRouter,
// stores the result in article.commentary (and ai_thoughts), returns the commentary.
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY is not set in the frontend container" }, { status: 500 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const articleId = body.article_id || body.articleId;
  if (!articleId) return Response.json({ error: "article_id is required" }, { status: 400 });

  // Load article + magazine (agent identity)
  const rows: any[] = await db
    .select()
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.id, articleId));

  const row = rows[0];
  if (!row || !row.article) return Response.json({ error: "Article not found" }, { status: 404 });
  const a = row.article;
  const mag = row.magazine;

  const agentName = mag?.agentName || a.magazineId || "the desk";
  const agentModel = mag?.agentModel || FALLBACK_MODEL;
  const magName = mag?.name || "AI News Nexus";
  const magTone = mag?.tone || "neutral";
  const magTagline = mag?.tagline || "";
  const magDesc = mag?.description || "";

  const system = [
    `You are ${agentName}, the featured AI commentator for "${magName}".`,
    magTagline ? `Tagline: ${magTagline}` : "",
    magDesc ? `About ${magName}: ${magDesc}` : "",
    `Write in a ${magTone} editorial voice that is distinctive, sharp, and on-brand for ${magName}.`,
    `Give readers: (1) your take on why this story matters, (2) what it connects to or signals, and (3) a memorable closer.`,
    `Do NOT invent facts beyond what is provided. You may reference the source URL. Keep it 3-5 punchy paragraphs (around 120-200 words total).`,
    `Optionally end with a short JSON "ai_thoughts" block: {"key_insight":"...","confidence":0}`,
  ].filter(Boolean).join("\n");

  const user = [
    `Article title: ${a.title}`,
    a.summary ? `Summary: ${a.summary}` : "",
    a.sourceUrl ? `Source URL: ${a.sourceUrl}` : "",
    `\nWrite your commentary now, as ${agentName}.`,
  ].filter(Boolean).join("\n");

  // Call OpenRouter with global fetch (Node 22)
  let resp: Response;
  try {
    resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://nexus.osiris2025.com",
        "X-Title": "AI News Nexus",
      },
      body: JSON.stringify({
        model: agentModel,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      // generous timeout; OpenRouter can be slow for first token
      signal: AbortSignal.timeout(90_000),
    });
  } catch (e: any) {
    return Response.json({ error: `OpenRouter request failed: ${e?.message || e}` }, { status: 502 });
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    return Response.json({ error: `OpenRouter ${resp.status}: ${text.slice(0, 300)}` }, { status: resp.status });
  }

  let data: any;
  try { data = await resp.json(); } catch { return Response.json({ error: "Invalid response from OpenRouter" }, { status: 502 }); }

  const commentary = data?.choices?.[0]?.message?.content?.trim();
  if (!commentary) return Response.json({ error: "OpenRouter returned no content" }, { status: 502 });

  // Store into article.commentary + ai_thoughts
  const aiThoughts = JSON.stringify({
    agent: agentName,
    model: agentModel,
    generatedAt: new Date().toISOString(),
  });

  const [updated] = await db
    .update(article)
    .set({ commentary, aiThoughts })
    .where(eq(article.id, articleId))
    .returning();

  return Response.json({ commentary, ai_thoughts: aiThoughts, agent: agentName, article: updated });
}