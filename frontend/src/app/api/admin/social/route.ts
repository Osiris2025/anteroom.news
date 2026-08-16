import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { socialAccount } from "@/drizzle/schema";
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

// GET /api/admin/social — list stored social accounts (secrets masked).
export async function GET() {
  const g = await guard();
  if (g) return g;
  const rows = await db
    .select({
      id: socialAccount.id,
      platform: socialAccount.platform,
      handle: socialAccount.handle,
      displayName: socialAccount.displayName,
      enabled: socialAccount.enabled,
      utmSource: socialAccount.utmSource,
      hasSecret: sql`(account_json <> '{}')`,
      createdAt: socialAccount.createdAt,
    })
    .from(socialAccount)
    .orderBy(asc(socialAccount.platform));
  return Response.json({ accounts: rows });
}

// POST /api/admin/social — create or update a social account.
export async function POST(req: NextRequest) {
  const g = await guard();
  if (g) return g;
  const body = await req.json().catch(() => ({}));
  const id = body.id || randomUUID();
  const platform = (body.platform || "").toString().toLowerCase().trim();
  if (!["x", "bluesky", "linkedin", "threads", "instagram", "mastodon"].includes(platform)) {
    return Response.json({ error: "Unsupported platform" }, { status: 400 });
  }
  const handle = (body.handle || "").toString().trim();
  const existing = await db
    .select({ id: socialAccount.id })
    .from(socialAccount)
    .where(sql`${socialAccount.platform} = ${platform} AND ${socialAccount.handle} = ${handle}`)
    .limit(1);
  if (existing.length && existing[0].id !== id) {
    return Response.json({ error: "An account for that platform+handle already exists" }, { status: 409 });
  }
  const values = {
    platform,
    handle: handle || null,
    displayName: (body.displayName || "").toString().trim() || null,
    enabled: !!body.enabled,
    utmSource: (body.utmSource || "").toString().trim() || null,
    accountJson: body.accountJson && body.accountJson !== "{}" ? body.accountJson : "{}",
  };
  const has = await db.select({ id: socialAccount.id }).from(socialAccount).where(eq(socialAccount.id, id)).limit(1);
  if (has.length) {
    await db.update(socialAccount).set({ ...values, updatedAt: new Date() }).where(eq(socialAccount.id, id));
  } else {
    await db.insert(socialAccount).values({ id, ...values });
  }
  return Response.json({ ok: true, id });
}

// DELETE /api/admin/social?id=... — remove a stored account.
export async function DELETE(req: NextRequest) {
  const g = await guard();
  if (g) return g;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  await db.delete(socialAccount).where(eq(socialAccount.id, id));
  return Response.json({ ok: true });
}