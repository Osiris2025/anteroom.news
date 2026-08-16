import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { source, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

// GET /api/admin/sources — list all sources joined with magazine name
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  const rows = await db.select({
    id: source.id,
    magazineId: source.magazineId,
    magazineName: magazine.name,
    type: source.type,
    url: source.url,
    name: source.name,
    sort: source.sort,
    limit: source.limit,
    createdAt: source.createdAt,
  }).from(source).leftJoin(magazine, eq(magazine.id, source.magazineId)).orderBy(asc(magazine.name), asc(source.id));
  return Response.json({ sources: rows });
}

// POST /api/admin/sources — create a source for a magazine
// body: { magazineId, url, name?, type?, subreddit?, sort?, limit? }
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}

  const magazineId = (body.magazineId || "").trim();
  const url = (body.url || "").trim();
  if (!magazineId) return Response.json({ error: "magazineId required" }, { status: 400 });
  if (!url) return Response.json({ error: "url required" }, { status: 400 });

  // Validate magazine exists
  const mag = await db.select({ id: magazine.id }).from(magazine).where(eq(magazine.id, magazineId));
  if (!mag.length) {
    return Response.json({ error: "Magazine not found" }, { status: 400 });
  }

  const type = (body.type || "rss").trim() === "reddit" ? "reddit" : "rss";
  // For reddit sources, allow subreddit shorthand (stored in url if url absent)
  let finalUrl = url;
  if (type === "reddit" && (body.subreddit || "") && url === "") {
    finalUrl = body.subreddit.trim();
  }

  try {
    const [created] = await db.insert(source).values({
      id: randomUUID(),
      magazineId,
      type,
      url: finalUrl,
      name: body.name ? body.name.trim() : null,
      sort: body.sort || "hot",
      limit: body.limit ? Number(body.limit) : 25,
    }).returning();
    return Response.json({ source: created });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to create source" }, { status: 500 });
  }
}

// PATCH /api/admin/sources/[id] — tune a source (status, tune, limit)
// We authenticate inline here (this file keeps a single route; id via query param).

// DELETE /api/admin/sources?url=<url> — remove a source feed entirely
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const url = req.nextUrl.searchParams.get("url") || "";
  if (!url) return Response.json({ error: "url required" }, { status: 400 });
  await db.delete(source).where(eq(source.url, url));
  return Response.json({ ok: true, url });
}