import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { userFollow } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// DELETE /api/follows/[id] — unfollow a magazine by follow record id.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in required" }, { status: 401 });

  // Verify ownership
  const [existing] = await db
    .select({ id: userFollow.id })
    .from(userFollow)
    .where(and(eq(userFollow.id, id), eq(userFollow.userId, uid)));
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await db.delete(userFollow).where(eq(userFollow.id, id));
  return Response.json({ message: "Unfollowed" });
}
