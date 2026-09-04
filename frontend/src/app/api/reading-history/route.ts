import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { readingHistory, article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/reading-history - list the current user's reading history (newest first).
// Returns the full article + magazine data for each entry.
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in required" }, { status: 401 });

  const rows: any[] = await db
    .select({
      id: readingHistory.id,
      articleId: readingHistory.articleId,
      readAt: readingHistory.readAt,
      readCount: readingHistory.readCount,
      articleTitle: article.title,
      articleHeadline: article.headline,
      articleSummary: article.summary,
      articleImageUrl: article.imageUrl,
      articleSourceUrl: article.sourceUrl,
      articleSourceName: article.sourceName,
      articlePublishedAt: article.publishedAt,
      magazineId: article.magazineId,
      magazineName: magazine.name,
      subcategory: article.subcategory,
    })
    .from(readingHistory)
    .innerJoin(article, eq(readingHistory.articleId, article.id))
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(readingHistory.userId, uid))
    .orderBy(desc(readingHistory.readAt));

  return Response.json({ history: rows });
}

// POST /api/reading-history - record (or bump) a read for an article.
// body: { articleId: string }
// If already in history, bumps readAt and increments readCount. If not, inserts.
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

  // Check if already in history
  const [existing] = await db
    .select({ id: readingHistory.id, readCount: readingHistory.readCount })
    .from(readingHistory)
    .where(and(
      eq(readingHistory.userId, uid),
      eq(readingHistory.articleId, articleId)
    ));

  if (existing) {
    // Bump readAt and increment readCount
    await db
      .update(readingHistory)
      .set({
        readAt: new Date(),
        readCount: (existing.readCount || 0) + 1,
      })
      .where(eq(readingHistory.id, existing.id));
    return Response.json({ tracked: true, readCount: (existing.readCount || 0) + 1 });
  }

  // Insert new entry
  const rhId = randomUUID();
  await db.insert(readingHistory).values({ id: rhId, userId: uid, articleId, readCount: 1 });
  return Response.json({ tracked: true, id: rhId, readCount: 1 }, { status: 201 });
}
