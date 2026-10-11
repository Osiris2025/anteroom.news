import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import {
  buildCommentarySystem, buildCommentaryUser, generateCommentary, COMMENTARY_FALLBACK_MODEL,
} from "@/lib/commentary";

const ADMIN_ROLES = ["superadmin", "admin"];

// Strip a trailing AI "thoughts" JSON block off the end of a commentary so the
// raw JSON never displays to readers. Handles both a ```json ... ``` fenced
// block and a bare trailing {...} object. Returns the clean text (JSON removed).
function stripTrailingJson(text: string): string {
  let t = text;
  // 1) Fenced JSON block at the very end: ```json { ... } ```
  const fenced = /```(?:json)?[\s\r\n]*(\{[\s\S]*?\})[\s\r\n]*```\s*$/i;
  let m = t.match(fenced);
  if (m) {
    t = t.slice(0, t.length - m[0].length).replace(/\s+$/, "");
    return t;
  }
  // 2) Bare trailing JSON object (starts on its own line with `{`), keeping
  //    prose that isn't part of the JSON. Try to capture a balanced object.
  const lines = t.split("\n");
  for (let i = lines.length - 1; i > 0; i--) {
    const s = lines[i].trim();
    if (s.startsWith("}")) {
      // walk up to the matching `{`
      let depth = 0; let start = -1;
      for (let j = i; j >= 0; j--) {
        const L = lines[j];
        depth += (L.match(/\{/g) || []).length;
        depth -= (L.match(/\}/g) || []).length;
        if (depth >= 0 && L.includes("{")) { start = j; break; }
      }
      if (start >= 0) {
        const block = lines.slice(start, i + 1).join("\n");
        // only treat as JSON if it looks like one (starts with braces, has keys)
        if (/^\s*\{[\s\S]*\"[^"]+\"\s*:/.test(block)) {
          return lines.slice(0, start).join("\n").replace(/\s+$/, "");
        }
      }
    }
  }
  return text;
}


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
  const agentModel = mag?.agentModel || COMMENTARY_FALLBACK_MODEL;

  const system = buildCommentarySystem({
    agentName,
    magazineName: mag?.name || "Anteroom",
    tone: mag?.tone || "neutral",
    tagline: mag?.tagline || "",
    description: mag?.description || "",
  });
  const user = buildCommentaryUser({ title: a.title, summary: a.summary });

  const hadCommentary = !!(a.commentary && a.commentary.trim());
  let result;
  try {
    result = await generateCommentary({
      apiKey, model: agentModel, system, user,
      mode: hadCommentary ? "replace" : "new",
      existing: a.commentary,
    });
  } catch (e: any) {
    return Response.json({ error: `OpenRouter request failed: ${e?.message || e}` }, { status: 502 });
  }

  // Both attempts broke the style rules and there is existing commentary:
  // keep the old text rather than replace it with something worse.
  if (!result.text) {
    return Response.json({
      kept: true,
      commentary: a.commentary,
      ai_thoughts: a.aiThoughts,
      agent: agentName,
      article: a,
      warning: hadCommentary
        ? `The new commentary didn't meet the style rules after ${result.attempts} tries (${result.problems.join("; ")}), so the existing commentary was kept (it was no worse than the new attempt).`
        : "The AI didn't return usable commentary. Try again.",
    }, { status: hadCommentary ? 200 : 502 });
  }

  // Drop any trailing ai_thoughts JSON block so raw JSON never shows to readers.
  const cleanText = stripTrailingJson(result.text).trim();

  const aiThoughts = JSON.stringify({
    agent: agentName,
    model: agentModel,
    generatedAt: new Date().toISOString(),
    styleCheck: result.passed ? "passed" : "cleaned",
    attempts: result.attempts,
  });

  const [updated] = await db
    .update(article)
    .set({ commentary: cleanText, aiThoughts })
    .where(eq(article.id, articleId))
    .returning();

  return Response.json({ commentary: cleanText, ai_thoughts: aiThoughts, agent: agentName, article: updated });
}
