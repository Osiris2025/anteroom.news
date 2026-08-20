import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { notification } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// POST /api/notifications/read-all — mark all of the current user's unread notifications as read.
export async function POST(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const result = await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.userId, uid), eq(notification.read, false)));

  return NextResponse.json({ success: true });
}
