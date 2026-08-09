import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, asc, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { comment, article, user } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/articles/[id]/comments — public; returns all comments for an article,
// newest-first, each joined with its author (for avatar initial + name). Flat list
// with parent_id so the client can build the nested reply tree.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [art] = await db.select({ id: article.id }).from(article).where(eq(article.id, id));
  if (!art) return Response.json({ error: "Article not found" }, { status: 404 });

  const rows: any[] = await db
    .select({
      id: comment.id,
      body: comment.body,
      parentId: comment.parentId,
      upvotes: comment.upvotes,
      deleted: comment.deleted,
      createdAt: comment.createdAt,
      userName: user.name,
      userEmail: user.email,
      userId: user.id,
    })
    .from(comment)
    .leftJoin(user, eq(comment.userId, user.id))
    .where(eq(comment.articleId, id))
    .orderBy(asc(comment.createdAt));

  return Response.json({ comments: rows });
}

// POST /api/articles/[id]/comments — add a comment. Requires a signed-in user.
// body: { body, parentId? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in to comment" }, { status: 401 });

  const { id } = await params;
  let body: any = {};
  try { body = await req.json(); } catch {}
  const text = (body.body || "").trim();
  if (!text) return Response.json({ error: "Comment cannot be empty" }, { status: 400 });
  if (text.length > 2000) return Response.json({ error: "Comment too long (max 2000 chars)" }, { status: 400 });

  const [art] = await db.select({ id: article.id }).from(article).where(eq(article.id, id));
  if (!art) return Response.json({ error: "Article not found" }, { status: 404 });

  const parentId = body.parentId || null;
  if (parentId) {
    const [parent] = await db.select({ id: comment.id }).from(comment).where(eq(comment.id, parentId));
    if (!parent) return Response.json({ error: "Parent comment not found" }, { status: 404 });
  }

  const cid = randomUUID();
  const [created] = await db
    .insert(comment)
    .values({ id: cid, articleId: id, userId: uid, parentId, body: text })
    .returning();

  return Response.json({ comment: created }, { status: 201 });
}

// PATCH /api/articles/[id]/comments/[commentId] optional upvote — handled in a sibling route.
// (upvotes/downvotes are a nice-to-have; implemented in comments/[commentId]/route.ts)