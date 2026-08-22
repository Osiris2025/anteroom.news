import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { and, eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { bookmark, article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/bookmarks — list the current user's bookmarks (newest first).
// Returns the full article + magazine data for each bookmark.
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in required" }, { status: 401 });

  const rows: any[] = await db
    .select({
      id: bookmark.id,
      articleId: bookmark.articleId,
      createdAt: bookmark.createdAt,
      articleTitle: article.title,
      articleHeadline: article.headline,
      articleSummary: article.summary,
      articleImageUrl: article.imageUrl,
      articleSourceUrl: article.sourceUrl,
      articleSourceName: article.sourceName,
      articlePublishedAt: article.publishedAt,
      magazineId: article.magazineId,
      magazineName: magazine.name,
    })
    .from(bookmark)
    .innerJoin(article, eq(bookmark.articleId, article.id))
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(bookmark.userId, uid))
    .orderBy(desc(bookmark.createdAt));

  return Response.json({ bookmarks: rows });
}

// POST /api/bookmarks — bookmark (or un-bookmark) an article.
// body: { articleId: string }
// If already bookmarked, removes it. If not, adds it.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in required" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const articleId = (body.articleId || "").trim();
  if (!articleId) return Response.json({ error: "articleId required" }, { status: 400 });

  // Verify article exists
  const [art] = await db.select({ id: article.id }).from(article).where(eq(article.id, articleId));
  if (!art) return Response.json({ error: "Article not found" }, { status: 404 });

  // Check if already bookmarked
  const [existing] = await db
    .select({ id: bookmark.id })
    .from(bookmark)
    .where(and(
      eq(bookmark.userId, uid),
      eq(bookmark.articleId, articleId)
    ));

  if (existing) {
    // Remove bookmark (toggle off)
    await db.delete(bookmark).where(eq(bookmark.id, existing.id));
    return Response.json({ bookmarked: false });
  }

  // Add bookmark
  const bmId = randomUUID();
  await db.insert(bookmark).values({ id: bmId, userId: uid, articleId });
  return Response.json({ bookmarked: true, id: bmId }, { status: 201 });
}
