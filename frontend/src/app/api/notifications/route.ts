import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { notification } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/notifications — list the current user's notifications.
// Unread first, then by created_at desc. Supports limit/offset pagination.
// Query params: ?limit=20&offset=0
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const url = new URL(_req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notification)
    .where(eq(notification.userId, uid));

  const total = Number(totalResult?.count ?? 0);

  const [unreadResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notification)
    .where(and(eq(notification.userId, uid), eq(notification.read, false)));

  const unreadCount = Number(unreadResult?.count ?? 0);

  const rows = await db
    .select()
    .from(notification)
    .where(eq(notification.userId, uid))
    .orderBy(notification.read, desc(notification.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ notifications: rows, total, unreadCount });
}

// POST /api/notifications — create a notification (admin/superadmin only, for testing).
// Body: { userId, type, title, body?, referenceType?, referenceId? }
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const role = session?.user?.role || "user";
  if (role !== "admin" && role !== "superadmin") {
    return NextResponse.json({ error: "Only admins can create notifications" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const targetUserId = (body.userId as string || "").trim();
  const type = (body.type as string || "").trim();
  const title = (body.title as string || "").trim();
  const referenceType = (body.referenceType as string || "").trim() || null;
  const referenceId = (body.referenceId as string || "").trim() || null;
  const bodyText = (body.body as string || "").trim() || null;

  if (!targetUserId || !type || !title) {
    return NextResponse.json({ error: "userId, type, and title are required" }, { status: 400 });
  }

  const id = randomUUID();
  await db.insert(notification).values({
    id,
    userId: targetUserId,
    type,
    title,
    body: bodyText,
    referenceType,
    referenceId,
    read: false,
  });

  const [created] = await db
    .select()
    .from(notification)
    .where(eq(notification.id, id));

  return NextResponse.json({ notification: created }, { status: 201 });
}
