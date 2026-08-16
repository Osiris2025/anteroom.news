import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { source, deletionLog, magazineMoveLog } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

// GET /api/admin/stats — source health: deletions by reason, moves, tuning.
export async function GET(_req: NextRequest) {
  let session = null;
  try { session = await auth.api.getSession({ headers: await headers() }); } catch {}
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  // 1) Deletions grouped by source (matched via source_name; fall back to host).
  const delBySource = await db.select({
    sourceName: deletionLog.sourceName,
    cnt: sql`count(*)::int`,
  }).from(deletionLog).groupBy(deletionLog.sourceName).orderBy(desc(sql`count(*)`));

  // 2) Deletions grouped by reason (the "why it was deleted" breakdown).
  const delByReason = await db.select({
    reason: deletionLog.reason,
    cnt: sql`count(*)::int`,
  }).from(deletionLog).groupBy(deletionLog.reason).orderBy(desc(sql`cnt`));

  // 3) Moves grouped by source (articles that needed re-homing).
  const movesBySource = await db.select({
    sourceName: magazineMoveLog.sourceName,
    cnt: sql`count(*)::int`,
  }).from(magazineMoveLog).groupBy(magazineMoveLog.sourceName).orderBy(desc(sql`cnt`));

  // 4) Source registry with live tune/status signal.
  const sources = await db.select({
    id: source.id, name: source.name, url: source.url, magazineId: source.magazineId,
    status: source.status, tune: source.tune, limit: source.limit,
    deleteCount: source.deleteCount, moveCount: source.moveCount, lastDeleteAt: source.lastDeleteAt,
  }).from(source);

  return Response.json({
    delBySource: delBySource.filter((r) => r.sourceName),
    delByReason,
    movesBySource: movesBySource.filter((r) => r.sourceName),
    sources,
  });
}