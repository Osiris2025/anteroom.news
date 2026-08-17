import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, and, or, isNull, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const FALLBACK_MODEL = "deepseek/deepseek-v4-flash-0731";

// Priority order: worst magazines first (matches live coverage 2026-08-11)
const PRIORITY = [
  "poli-split", "climate-watch", "vital-sign", "oss-report",
  "tech-pulse", "weekly-weird-news", "starfall-weekly", "weird-and-wild", "startup-signal",
];

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

/**
 * GET /api/admin/batch-commentary
 * Returns commentary coverage stats (per magazine + totals) so the admin UI
 * can show what's missing before starting a batch run.
 */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  try {
    const rows: any[] = await db
      .select({
        id: article.id,
        magazineId: article.magazineId,
        commentary: article.commentary,
        aiThoughts: article.aiThoughts,
      })
      .from(article);

    const magNames = await db.select({ id: magazine.id, name: magazine.name }).from(magazine);
    const nameById = new Map(magNames.map((m) => [m.id, m.name]));

    const perMag = new Map<string, { name: string; total: number; missing: number }>();
    for (const r of rows) {
      const mid = r.magazineId || "unassigned";
      const m = perMag.get(mid) || { name: nameById.get(mid) || mid, total: 0, missing: 0 };
      m.total += 1;
      if (!r.commentary || !r.aiThoughts) m.missing += 1;
      perMag.set(mid, m);
    }

    const perMagazine = Array.from(perMag.entries())
      .map(([id, v]) => ({ id, name: v.name, total: v.total, missing: v.missing }))
      .sort((a, b) => b.missing - a.missing);

    const total = rows.length;
    const missing = perMagazine.reduce((s, m) => s + m.missing, 0);

    return Response.json({ total, missing, perMagazine });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load coverage stats" }, { status: 500 });
  }
}

/**
 * POST /api/admin/batch-commentary  { limit?: number, delayMs?: number }
 * Generates commentary for the `limit` oldest articles still missing it
 * (priority-ordered by magazine). Returns per-run progress so the UI can
 * loop until `remaining === 0`. Runs entirely server-side using the
 * OPENROUTER_API_KEY in the frontend container — no SSH / cookie needed.
 */
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY is not set in the frontend container" }, { status: 500 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const limit = Math.min(Math.max(parseInt(body.limit || "10", 10) || 10, 1), 50);
  const delayMs = Math.min(Math.max(parseInt(body.delayMs || "1500", 10) || 1500, 0), 10000);

  try {
    // Articles missing commentary or aiThoughts, joined with their magazine (agent identity).
    const rows: any[] = await db
      .select()
      .from(article)
      .leftJoin(magazine, eq(article.magazineId, magazine.id))
      .where(and(
        or(
          isNull(article.commentary), eq(article.commentary, ""),
          isNull(article.aiThoughts), eq(article.aiThoughts, "")
        ),
        eq(article.status, "live")
      ))
      .orderBy(asc(article.publishedAt));

    // Order by magazine priority, then by publishedAt asc (oldest first)
    const missing = rows.filter((r) => !r.article.commentary || !r.article.aiThoughts);
    missing.sort((a, b) => {
      const pa = PRIORITY.indexOf(a.article.magazineId || "");
      const pb = PRIORITY.indexOf(b.article.magazineId || "");
      if (pa !== pb) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      return (a.article.publishedAt || 0) > (b.article.publishedAt || 0) ? 1 : -1;
    });

    const todo = missing.slice(0, limit);
    const succeeded: any[] = [];
    const failed: any[] = [];

    for (const row of todo) {
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

      try {
        const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
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
          signal: AbortSignal.timeout(90_000),
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          failed.push({ id: a.id, title: a.title, error: `OpenRouter ${resp.status}: ${text.slice(0, 120)}` });
          continue;
        }

        const data: any = await resp.json().catch(() => null);
        const commentary = data?.choices?.[0]?.message?.content?.trim();
        if (!commentary) {
          failed.push({ id: a.id, title: a.title, error: "OpenRouter returned no content" });
          continue;
        }

        const aiThoughts = JSON.stringify({
          agent: agentName,
          model: agentModel,
          generatedAt: new Date().toISOString(),
        });

        await db
          .update(article)
          .set({ commentary, aiThoughts })
          .where(eq(article.id, a.id));

        succeeded.push({ id: a.id, title: a.title, agent: agentName });
      } catch (e: any) {
        failed.push({ id: a.id, title: a.title, error: e?.message || "Request failed" });
      }

      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    const remaining = missing.length - todo.length;

    return Response.json({
      processed: todo.length,
      succeeded: succeeded.length,
      failed: failed.length,
      remaining,
      succeededList: succeeded,
      failedList: failed,
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Batch failed" }, { status: 500 });
  }
}
