import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, and, or, isNull, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import {
  buildCommentarySystem, buildCommentaryUser, generateCommentary, COMMENTARY_FALLBACK_MODEL,
} from "@/lib/commentary";

const ADMIN_ROLES = ["superadmin", "admin"];

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

      try {
        const result = await generateCommentary({
          apiKey, model: agentModel, system, user,
          mode: hadCommentary ? "replace" : "new",
          existing: a.commentary,
        });

        const aiThoughts = JSON.stringify({
          agent: agentName,
          model: agentModel,
          generatedAt: new Date().toISOString(),
          styleCheck: result.text ? (result.passed ? "passed" : "cleaned") : "kept-existing",
          attempts: result.attempts,
        });

        if (!result.text) {
          if (hadCommentary) {
            // Keep the old commentary; record aiThoughts so this row isn't retried forever.
            await db.update(article).set({ aiThoughts }).where(eq(article.id, a.id));
            succeeded.push({ id: a.id, title: a.title, agent: agentName, kept: true });
          } else {
            failed.push({ id: a.id, title: a.title, error: "AI returned no usable commentary" });
          }
        } else {
          await db
            .update(article)
            .set({ commentary: result.text, aiThoughts })
            .where(eq(article.id, a.id));
          succeeded.push({ id: a.id, title: a.title, agent: agentName });
        }
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
