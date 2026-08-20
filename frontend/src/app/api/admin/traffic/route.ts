import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { pageView } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

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

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  // Total views
  const [{ count: totalViews }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pageView);

  // Views today
  const [{ count: todayViews }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pageView)
    .where(sql`created_at >= now() - interval '24 hours'`);

  // Views this week
  const [{ count: weekViews }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pageView)
    .where(sql`created_at >= now() - interval '7 days'`);

  // Top pages
  const topPages: any[] = await db
    .select({ path: pageView.path, views: sql<number>`count(*)::int` })
    .from(pageView)
    .groupBy(pageView.path)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  // Top referrers
  const topReferrers: any[] = await db
    .select({
      referrer: sql<string>`coalesce(nullif(page_view.referrer, ''), '(direct)')`,
      views: sql<number>`count(*)::int`,
    })
    .from(pageView)
    .groupBy(sql`coalesce(nullif(page_view.referrer, ''), '(direct)')`)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  // UTM source breakdown
  const utmSources: any[] = await db
    .select({
      source: sql<string>`coalesce(nullif(page_view.utm_source, ''), '(none)')`,
      views: sql<number>`count(*)::int`,
    })
    .from(pageView)
    .groupBy(sql`coalesce(nullif(page_view.utm_source, ''), '(none)')`)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  // Daily views (last 14 days)
  const dailyViews: any[] = await db
    .select({
      date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`,
      views: sql<number>`count(*)::int`,
    })
    .from(pageView)
    .where(sql`created_at >= now() - interval '14 days'`)
    .groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`);

  // UTM campaign breakdown
  const utmCampaigns: any[] = await db
    .select({
      campaign: sql<string>`coalesce(nullif(page_view.utm_campaign, ''), '(none)')`,
      views: sql<number>`count(*)::int`,
    })
    .from(pageView)
    .groupBy(sql`coalesce(nullif(page_view.utm_campaign, ''), '(none)')`)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  return Response.json({
    totalViews,
    todayViews,
    weekViews,
    topPages,
    topReferrers,
    utmSources,
    utmCampaigns,
    dailyViews,
  });
}