import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, deletionLog, source, magazine as magazineTable } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

async function getRole(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return (session?.user as any)?.role || "";
  } catch {
    return "";
  }
}

// Which source statuses each bulk action operates on.
const FROM: Record<string, string[]> = {
  approve: ["draft"],
  publish: ["approved"],
  // Bulk delete is DRAFTS-ONLY by construction: the eligible-status machinery
  // makes any other status unmatchable, whatever the UI sends.
  "delete-drafts": ["draft"],
};
const TO: Record<string, string> = { approve: "approved", publish: "live" };

function buildConds(action: string, magazine: string, status: string, q: string) {
  const conds: any[] = [];
  if (magazine && magazine !== "all") conds.push(eq(article.magazineId, magazine));
  // Bulk only ever moves the eligible source status(es) for the action; if the user
  // filtered to one status it must be one of those, otherwise nothing matches.
  const eligible = FROM[action];
  if (status && status !== "all") {
    conds.push(eligible.includes(status) ? eq(article.status, status) : sql`false`);
  } else {
    conds.push(inArray(article.status, eligible));
  }
  if (q) conds.push(sql`search_vector @@ plainto_tsquery('english', ${q})`);
  return and(...conds);
}

// GET  /api/admin/queue/bulk?magazine=&status=&q=   → counts of what each action WOULD touch
// POST /api/admin/queue/bulk {action, magazine, status, q} → performs it, returns {updated}
export async function GET(req: NextRequest) {
  if (!ADMIN_ROLES.includes(await getRole())) return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const magazine = sp.get("magazine") || "all";
  const status = sp.get("status") || "all";
  const q = (sp.get("q") || "").trim();
  try {
    const out: Record<string, number> = {};
    for (const action of Object.keys(FROM)) {
      const r = await db.select({ n: sql<number>`count(*)::int` }).from(article).where(buildConds(action, magazine, status, q));
      out[action] = r[0]?.n || 0;
    }
    // Optional: per-magazine + per-source breakdown for one action's scope.
    const breakdownAction = sp.get("breakdown") || "";
    if (breakdownAction) {
      const action: string = breakdownAction;
      if (!Object.prototype.hasOwnProperty.call(FROM, action)) return Response.json({ error: "unknown action" }, { status: 400 });
      const scope = buildConds(action, magazine, status, q);
      const byMag = await db
        .select({
          magazine: sql`coalesce(${magazineTable.name}, 'Unassigned')`,
          n: sql<number>`count(*)::int`,
        })
        .from(article)
        .leftJoin(magazineTable, eq(article.magazineId, magazineTable.id))
        .where(scope)
        .groupBy(sql`coalesce(${magazineTable.name}, 'Unassigned')`)
        .orderBy(desc(sql`count(*)`));
      const bySource = await db
        .select({
          src: sql`coalesce(${article.sourceName}, '(no source)')`,
          n: sql<number>`count(*)::int`,
        })
        .from(article)
        .where(scope)
        .groupBy(sql`coalesce(${article.sourceName}, '(no source)')`)
        .orderBy(desc(sql`count(*)`))
        .limit(20);
      return Response.json({ byMagazine: byMag, bySource });
    }
    return Response.json(out);
  } catch (e: any) {
    return Response.json({ error: e?.message || "count failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!ADMIN_ROLES.includes(await getRole())) return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (!FROM[action]) return Response.json({ error: "action must be approve|publish|delete-drafts" }, { status: 400 });
    const magazine = String(body.magazine || "all");
    const status = String(body.status || "all");
    const q = String(body.q || "").trim();

    // ---- DELETE-DRAFTS: drafts only, ever. ----
    if (action === "delete-drafts") {
      // Extra hard guard on top of FROM: a specific status filter must be 'draft'.
      if (status && status !== "all" && status !== "draft") {
        return Response.json({ error: "Delete All works on DRAFTS only — filter is '" + status + "'" }, { status: 400 });
      }
      // Optional typed-count confirmation (belt and braces on top of UI confirm).
      const expected = Number(body.confirmCount);
      const scope = buildConds(action, magazine, status, q);
      if (Number.isFinite(expected) && expected > 0) {
        const c = await db.select({ n: sql<number>`count(*)::int` }).from(article).where(scope);
        if ((c[0]?.n || 0) !== expected) {
          return Response.json({ error: `Count mismatch: scope has ${c[0]?.n || 0} drafts, not ${expected}. Nothing deleted.` }, { status: 409 });
        }
      }
      // Select the doomed rows first so we can log + strike sources.
      const doomed = await db.select({
        id: article.id, title: article.title, sourceUrl: article.sourceUrl,
        sourceName: article.sourceName, magazineId: article.magazineId,
      }).from(article).where(scope);
      if (doomed.length) {
        await db.insert(deletionLog).values(doomed.map((r) => ({
          id: crypto.randomUUID(), articleId: r.id, title: r.title,
          sourceUrl: r.sourceUrl, sourceName: r.sourceName,
          magazineId: r.magazineId, reason: "bulk-delete-drafts",
        })));
        // Per-source strike counts (same semantics as single delete).
        const bySource = new Map<string, number>();
        for (const r of doomed) {
          if (!r.sourceName || !r.magazineId) continue;
          const key = r.sourceName + "\u0000" + r.magazineId;
          bySource.set(key, (bySource.get(key) || 0) + 1);
        }
        for (const [key, n] of bySource) {
          const [srcName, magId] = key.split("\u0000");
          await db.update(source).set({
            deleteCount: sql`${source.deleteCount} + ${n}`,
            lastDeleteAt: new Date(),
          }).where(and(eq(source.name, srcName), eq(source.magazineId, magId)));
        }
      }
      const rows = await db.delete(article).where(scope).returning({ id: article.id });
      return Response.json({ updated: rows.length, action, scope: { magazine, status, q } });
    }
    // ---- status-mutating actions below ----
    const upd: any = { status: TO[action] };
    if (action === "publish") upd.publishedAt = new Date();
    const rows = await db.update(article).set(upd).where(buildConds(action, magazine, status, q)).returning({ id: article.id });
    return Response.json({ updated: rows.length, action, scope: { magazine, status, q } });
  } catch (e: any) {
    return Response.json({ error: e?.message || "bulk update failed" }, { status: 500 });
  }
}
