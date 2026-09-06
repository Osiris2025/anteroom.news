// Campaigns API — /api/admin/social-campaigns
// CRUD for social_campaign + items. DB is truth; the publisher drains active
// campaigns' due items into social_post on its hourly run.
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

async function guard(): Promise<Response | null> {
  let session = null;
  try { session = await auth.api.getSession({ headers: await headers() }); } catch { /* ignore */ }
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

type CampaignRow = {
  id: string;
  name: string;
  kind: string;
  description: string | null;
  status: string;
  start_at: string;
  end_at: string;
  posts_per_day: number;
  window_start_min: number;
  window_end_min: number;
  target_platforms: string[];
};

function mapCampaign(r: CampaignRow) {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    description: r.description,
    status: r.status,
    startAt: r.start_at,
    endAt: r.end_at,
    postsPerDay: r.posts_per_day,
    windowStartMin: r.window_start_min,
    windowEndMin: r.window_end_min,
    targetPlatforms: r.target_platforms ?? [],
    runLengthDays: Math.max(1, Math.ceil(
      (new Date(r.end_at).getTime() - new Date(r.start_at).getTime()) / 86400000)),
  };
}

// GET — list campaigns with item counts
export async function GET(req: NextRequest) {
  const g = await guard();
  if (g) return g;
  const itemsFor = req.nextUrl.searchParams.get("items");
  if (itemsFor) {
    const itemRows = await db.execute(sql`
      SELECT id, title, body, image_url, link_url, position, status, scheduled_at
      FROM social_campaign_item WHERE campaign_id = ${itemsFor} ORDER BY position
    `);
    return Response.json({ items: itemRows });
  }
  const result = await db.execute(sql`
    SELECT c.*,
           count(i.id) FILTER (WHERE i.status = 'queued') AS items_queued,
           count(i.id) FILTER (WHERE i.status = 'scheduled') AS items_scheduled,
           count(i.id) FILTER (WHERE i.status = 'posted') AS items_posted,
           count(i.id) AS items_total
    FROM social_campaign c
    LEFT JOIN social_campaign_item i ON i.campaign_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  const rows = result as unknown as (CampaignRow & { items_queued: string; items_scheduled: string; items_posted: string; items_total: string })[];
  return Response.json({
    campaigns: rows.map((r) => ({
      ...mapCampaign(r),
      itemsQueued: Number(r.items_queued),
      itemsScheduled: Number(r.items_scheduled),
      itemsPosted: Number(r.items_posted),
      itemsTotal: Number(r.items_total),
    })),
  });
}

// POST — create or update a campaign, or manage items:
//   { name, kind, description, startAt, endAt, postsPerDay, windowStart/EndMin, targetPlatforms } → upsert campaign
//   { action: "add-item", campaignId, title, body, imageUrl, linkUrl }
//   { action: "update-item", itemId, ...fields }
//   { action: "delete-item", itemId }
//   { action: "set-status", campaignId, status }   // draft | active | completed | archived
//   { action: "set-item-time", itemId, scheduledAt }  // manual slot override
export async function POST(req: NextRequest) {
  const g = await guard();
  if (g) return g;
  const body = await req.json().catch(() => ({} as any));
  const action = (body.action || "").toString();

  if (action === "add-item" || action === "update-item" || action === "delete-item" || action === "set-item-time") {
    return itemAction(body, action);
  }

  if (action === "set-status") {
    const id = (body.campaignId || "").toString();
    const status = (body.status || "").toString();
    if (!id || !["draft", "active", "completed", "archived"].includes(status)) {
      return Response.json({ error: "campaignId and valid status required" }, { status: 400 });
    }
    await db.execute(sql`
      UPDATE social_campaign SET status = ${status}, updated_at = now() WHERE id = ${id}
    `);
    return Response.json({ ok: true });
  }

  // default: create/update campaign
  const id = (body.id || randomUUID()).toString();
  const name = (body.name || "").toString().trim();
  if (!name) return Response.json({ error: "name required" }, { status: 400 });
  const kind = ["holiday", "vendor", "promo", "custom"].includes(body.kind) ? body.kind : "custom";
  const startAt = body.startAt ? new Date(body.startAt) : new Date();
  const endAt = body.endAt ? new Date(body.endAt) : new Date(Date.now() + 7 * 86400000);
  if (endAt <= startAt) return Response.json({ error: "endAt must be after startAt" }, { status: 400 });
  const postsPerDay = Math.max(1, Math.min(24, Number(body.postsPerDay) || 2));
  const windowStartMin = Math.max(0, Math.min(1439, Number(body.windowStartMin) || 480));
  const windowEndMin = Math.max(windowStartMin + 60, Math.min(1440, Number(body.windowEndMin) || 1320));
  const platforms: string[] = Array.isArray(body.targetPlatforms)
    ? body.targetPlatforms.map((p: string) => p.toLowerCase().trim()).filter(Boolean)
    : [];
  if (!platforms.length) return Response.json({ error: "at least one target platform required" }, { status: 400 });

  const values = {
    name,
    kind,
    description: (body.description || "").toString() || null,
    start_at: startAt,
    end_at: endAt,
    posts_per_day: postsPerDay,
    window_start_min: windowStartMin,
    window_end_min: windowEndMin,
    target_platforms: platforms,
    updated_at: new Date(),
  };

  const has = await db.execute(sql`SELECT id FROM social_campaign WHERE id = ${id}`);
  if ((has as unknown as any[]).length) {
    await db.execute(sql`
      UPDATE social_campaign SET
        name = ${values.name}, kind = ${values.kind}, description = ${values.description},
        start_at = ${values.start_at}, end_at = ${values.end_at},
        posts_per_day = ${values.posts_per_day},
        window_start_min = ${values.window_start_min}, window_end_min = ${values.window_end_min},
        target_platforms = ${values.target_platforms}, updated_at = now()
      WHERE id = ${id}
    `);
  } else {
    await db.execute(sql`
      INSERT INTO social_campaign
        (id, name, kind, description, start_at, end_at, posts_per_day,
         window_start_min, window_end_min, target_platforms)
      VALUES (${id}, ${values.name}, ${values.kind}, ${values.description},
              ${values.start_at}, ${values.end_at}, ${values.posts_per_day},
              ${values.window_start_min}, ${values.window_end_min},
              ${values.target_platforms})
    `);
  }
  return Response.json({ ok: true, id });
}

async function itemAction(body: any, action: string) {
  if (action === "add-item") {
    const campaignId = (body.campaignId || "").toString();
    const title = (body.title || "").toString().trim();
    if (!campaignId || !title) return Response.json({ error: "campaignId and title required" }, { status: 400 });
    const posRes = await db.execute(sql`
      SELECT COALESCE(max(position), 0) + 1 AS next FROM social_campaign_item WHERE campaign_id = ${campaignId}
    `);
    const nextPos = Number((posRes as unknown as { next: number }[])[0]?.next || 1);
    await db.execute(sql`
      INSERT INTO social_campaign_item
        (campaign_id, title, body, image_url, link_url, position, scheduled_at)
      VALUES (${campaignId}, ${title}, ${(body.body || "").toString() || null},
              ${(body.imageUrl || "").toString() || null}, ${(body.linkUrl || "").toString() || null},
              ${nextPos},
              ${body.scheduledAt ? new Date(body.scheduledAt) : null})
    `);
    return Response.json({ ok: true });
  }
  if (action === "update-item") {
    const itemId = (body.itemId || "").toString();
    if (!itemId) return Response.json({ error: "itemId required" }, { status: 400 });
    await db.execute(sql`
      UPDATE social_campaign_item SET
        title = COALESCE(${(body.title || "").toString() || null}, title),
        body = COALESCE(${(body.body || "").toString() || null}, body),
        image_url = COALESCE(${(body.imageUrl || "").toString() || null}, image_url),
        link_url = COALESCE(${(body.linkUrl || "").toString() || null}, link_url)
      WHERE id = ${itemId}
    `);
    return Response.json({ ok: true });
  }
  if (action === "set-item-time") {
    const itemId = (body.itemId || "").toString();
    if (!itemId || !body.scheduledAt) return Response.json({ error: "itemId and scheduledAt required" }, { status: 400 });
    await db.execute(sql`
      UPDATE social_campaign_item SET scheduled_at = ${new Date(body.scheduledAt)}
      WHERE id = ${itemId} AND status IN ('queued', 'scheduled')
    `);
    return Response.json({ ok: true });
  }
  // delete-item
  const itemId = (body.itemId || "").toString();
  if (!itemId) return Response.json({ error: "itemId required" }, { status: 400 });
  await db.execute(sql`DELETE FROM social_campaign_item WHERE id = ${itemId} AND status <> 'posted'`);
  return Response.json({ ok: true });
}

// GET single campaign items: /api/admin/social-campaigns?id=<campaignId> via DELETE? No —
// DELETE removes a campaign entirely; items come via ?items=<id> on GET.
export async function DELETE(req: NextRequest) {
  const g = await guard();
  if (g) return g;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  await db.execute(sql`DELETE FROM social_campaign WHERE id = ${id}`);
  return Response.json({ ok: true });
}

