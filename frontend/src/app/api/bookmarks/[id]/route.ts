import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmark } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// DELETE /api/bookmarks/[id] — remove a specific bookmark.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await params;

  // Check the bookmark belongs to the current user
  const [bm] = await db
    .select({ id: bookmark.id, userId: bookmark.userId })
    .from(bookmark)
    .where(eq(bookmark.id, id));

  if (!bm) return Response.json({ error: "Bookmark not found" }, { status: 404 });
  if (bm.userId !== uid) return Response.json({ error: "Not your bookmark" }, { status: 403 });

  await db.delete(bookmark).where(eq(bookmark.id, id));
  return Response.json({ deleted: true });
}
