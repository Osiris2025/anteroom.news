import { headers } from "next/headers";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine, pipelineSetting } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];
const TRUTHY = ["1", "true", "yes", "on"];

async function getRole(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return (session?.user as any)?.role || "";
  } catch {
    return "";
  }
}

export async function GET() {
  const role = await getRole();
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - 24 * 3600 * 1000);

  // (a) last-50 auto-published (status=live, published in last 24h)
  const publishedRows = await db
    .select({
      id: article.id,
      title: article.title,
      magazineId: article.magazineId,
      magazineName: magazine.name,
      sourceName: article.sourceName,
      sourceUrl: article.sourceUrl,
      publishedAt: article.publishedAt,
    })
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(sql`${article.status} = 'live' AND ${article.publishedAt} >= ${cutoff}`)
    .orderBy(desc(article.publishedAt))
    .limit(50);

  // (b) queue (status=approved)
  const queueRows = await db
    .select({
      id: article.id,
      title: article.title,
      magazineId: article.magazineId,
      magazineName: magazine.name,
      sourceName: article.sourceName,
      sourceUrl: article.sourceUrl,
      submittedAt: article.submittedAt,
      createdAt: article.createdAt,
    })
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.status, "approved"))
    .orderBy(desc(article.createdAt))
    .limit(50);

  const queuedCountRes = await db
    .select({ count: sql<string>`count(*)` })
    .from(article)
    .where(eq(article.status, "approved"));
  const queuedTotal = Number(queuedCountRes[0]?.count ?? 0);

  const liveCountRes = await db
    .select({ count: sql<string>`count(*)` })
    .from(article)
    .where(sql`${article.status} = 'live' AND ${article.publishedAt} >= ${cutoff}`);
  const live24hTotal = Number(liveCountRes[0]?.count ?? 0);

  const settingsRows = await db
    .select({ key: pipelineSetting.key, value: pipelineSetting.value })
    .from(pipelineSetting);
  let killSwitchOn = false;
  for (const r of settingsRows) {
    if (r.key === "auto_publish_enabled") {
      killSwitchOn = TRUTHY.includes((r.value ?? "0").trim().toLowerCase());
    }
  }

  // (c) plain-text summary
  const summary = `${live24hTotal} auto-published, ${queuedTotal} queued, kill-switch ${killSwitchOn ? "on" : "off"}`;

  return Response.json({
    autoPublished: publishedRows.map((r) => ({
      id: r.id,
      title: r.title,
      magazine: r.magazineName ?? r.magazineId,
      source: r.sourceName,
      url: r.sourceUrl,
      publishedAt: r.publishedAt,
    })),
    queue: queueRows.map((r) => ({
      id: r.id,
      title: r.title,
      magazine: r.magazineName ?? r.magazineId,
      source: r.sourceName,
      url: r.sourceUrl,
      submittedAt: r.submittedAt ?? r.createdAt,
    })),
    summary,
    counts: { autoPublishedLast24h: live24hTotal, queued: queuedTotal, killSwitchOn },
  });
}
