import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { comment } from "@/drizzle/schema";

// POST /api/articles/[id]/comments/[commentId]/upvote — increment upvotes.
// Public (open voting, no auth required for a lightweight like). Returns new count.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { commentId } = await params;
  const rows: any[] = await db
    .update(comment)
    .set({ upvotes: sql`${comment.upvotes} + 1` })
    .where(eq(comment.id, commentId))
    .returning({ id: comment.id, upvotes: comment.upvotes });
  if (!rows.length) return Response.json({ error: "Comment not found" }, { status: 404 });
  return Response.json({ upvotes: rows[0].upvotes });
}