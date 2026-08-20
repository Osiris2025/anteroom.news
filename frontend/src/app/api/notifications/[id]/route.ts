import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { notification } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// PATCH /api/notifications/[id] — mark a single notification as read.
// The user must own the notification.
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const [existing] = await db
    .select({ id: notification.id, read: notification.read })
    .from(notification)
    .where(and(eq(notification.id, id), eq(notification.userId, uid)));

  if (!existing) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  if (existing.read) {
    return NextResponse.json({ message: "Already read" });
  }

  await db
    .update(notification)
    .set({ read: true })
    .where(eq(notification.id, id));

  return NextResponse.json({ success: true });
}
