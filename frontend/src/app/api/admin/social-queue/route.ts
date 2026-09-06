import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
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

type PostRow = {
  id: string;
  article_id: string;
  title: string | null;
  magazine: string | null;
  platform: string;
  status: string;
  scheduled_at: string | null;
  post_url: string | null;
  posted_at: string | null;
  metrics: Record<string, unknown> | null;
  error: string | null;
};

const SELECT_SQL = sql`
  SELECT sp.id, sp.article_id, a.title, m.name AS magazine, sp.platform, sp.status,
         sp.scheduled_at, sp.post_url, sp.posted_at, sp.metrics, sp.error
  FROM social_post sp
  LEFT JOIN article a ON a.id = sp.article_id
  LEFT JOIN magazine m ON m.id = a.magazine_id
`;

function mapRow(r: any) {
  return {
    id: r.id,
    articleId: r.article_id,
    title: r.title,
    magazine: r.magazine,
    platform: r.platform,
    status: r.status,
    scheduledAt: r.scheduled_at,
    postUrl: r.post_url,
    postedAt: r.posted_at,
    metrics: r.metrics ?? null,
    error: r.error,
  };
}

// GET /api/admin/social-queue — queued/posted/failed social posts + summary.
export async function GET() {
  const g = await guard();
  if (g) return g;
  const result = await db.execute(sql`
    ${SELECT_SQL}
    ORDER BY sp.scheduled_at DESC NULLS LAST
    LIMIT 500
  `);
  const rows = result as unknown as PostRow[];
  const queued = rows.filter((r) => r.status === "queued").map(mapRow);
  const posted = rows.filter((r) => r.status === "posted").map(mapRow);
  const failed = rows.filter((r) => r.status === "failed").map(mapRow);
  return Response.json({
    queued,
    posted,
    failed,
    summary: { queued: queued.length, posted: posted.length, failed: failed.length },
  });
}

// POST /api/admin/social-queue — actions:
//   { action: "refresh-metrics" }  → re-fetch engagement for posted posts
//   { action: "retry", id }        → reset a failed post back to queued
export async function POST(req: NextRequest) {
  const g = await guard();
  if (g) return g;
  const body = await req.json().catch(() => ({} as any));
  const action = (body.action || "").toString();

  if (action === "refresh-metrics") {
    // Runs the same logic as `nexus-social fetch-metrics` (publisher/metrics.py):
    // fetch like/repost/reply counts via atproto for posted Bluesky posts.
    // The publisher package isn't importable from Next, so query the Bluesky
    // API directly over HTTPS with the stored app password.
    const baseUrl = (process.env.BLUESKY_API_BASE || "https://bsky.social").replace(/\/$/, "");
    const handle = process.env.BLUESKY_HANDLE || "";
    const password = process.env.BLUESKY_APP_PASSWORD || "";
    if (!handle || !password) {
      return Response.json({ error: "Bluesky credentials not configured" }, { status: 400 });
    }
    try {
      const loginRes = await fetch(`${baseUrl}/xrpc/com.atproto.server.createSession`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: handle, password }),
      });
      if (!loginRes.ok) {
        return Response.json({ error: `Bluesky login failed (${loginRes.status})` }, { status: 502 });
      }
      const session = await loginRes.json();
      const accessJwt = session.accessJwt as string;

      const postedRes = await db.execute(sql`
        SELECT id, post_id FROM social_post
        WHERE status = 'posted' AND platform = 'bluesky' AND post_id IS NOT NULL
        ORDER BY posted_at DESC NULLS LAST
        LIMIT 100
      `);
      const postedRows = postedRes as unknown as { id: string; post_id: string }[];
      let updated = 0;
      let failed = 0;
      const fetchedAt = new Date().toISOString();

      for (const row of postedRows) {
        try {
          const params = new URLSearchParams({ uri: row.post_id });
          const threadRes = await fetch(`${baseUrl}/xrpc/app.bsky.feed.getPostThread?${params}`, {
            headers: { Authorization: `Bearer ${accessJwt}` },
          });
          if (!threadRes.ok) { failed++; continue; }
          const thread = await threadRes.json();
          const post = thread?.thread?.post;
          if (!post) { failed++; continue; }
          const metrics = {
            likes: post.likeCount ?? 0,
            reposts: post.repostCount ?? 0,
            replies: post.replyCount ?? 0,
            quotes: post.quoteCount ?? 0,
            fetched_at: fetchedAt,
          };
          await db.execute(sql`
            UPDATE social_post SET metrics = ${JSON.stringify(metrics)}::jsonb
            WHERE id = ${row.id}
          `);
          updated++;
        } catch {
          failed++;
        }
      }
      return Response.json({ ok: true, checked: postedRows.length, updated, failed });
    } catch (e: any) {
      return Response.json({ error: e?.message || "metrics fetch failed" }, { status: 500 });
    }
  }

  if (action === "post-now") {
    const id = (body.id || "").toString();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    // Hot item: pull a queued post's slot to now — the hourly publisher run sends it within 15 min.
    await db.execute(sql`
      UPDATE social_post
      SET scheduled_at = now()
      WHERE id = ${id} AND status = 'queued'
    `);
    return Response.json({ ok: true });
  }

  if (action === "retry") {
    const id = (body.id || "").toString();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    // Reset a failed post to queued so publish_due picks it up on its next run.
    await db.execute(sql`
      UPDATE social_post
      SET status = 'queued', error = NULL, scheduled_at = now()
      WHERE id = ${id} AND status = 'failed'
    `);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE /api/admin/social-queue?id=... — unqueue a post (remove the row).
export async function DELETE(req: NextRequest) {
  const g = await guard();
  if (g) return g;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  await db.execute(sql`DELETE FROM social_post WHERE id = ${id}`);
  return Response.json({ ok: true });
}
