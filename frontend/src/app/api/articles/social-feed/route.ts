import { NextRequest } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";

// GET /api/articles/social-feed?limit=N  — public, returns LIVE articles
// with socialRepeat=true (flagged for social media syndication), newest first.
// This is the data source for the C8 social feed page.
export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit") || "50";
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);

  try {
    const rows: any[] = await db
      .select()
      .from(article)
      .leftJoin(magazine, eq(article.magazineId, magazine.id))
      .where(
        and(
          eq(article.status, "live"),
          eq(article.socialRepeat, true),
        ),
      )
      .orderBy(desc(article.publishedAt), desc(article.socialPostedAt))
      .limit(limit);

    const articles = rows.map((r) => ({
      id: r.article.id,
      title: r.article.title,
      headline: r.article.headline,
      sourceUrl: r.article.sourceUrl,
      imageUrl: r.article.imageUrl,
      summary: r.article.summary,
      commentary: r.article.commentary,
      subcategory: r.article.subcategory,
      publishedAt: r.article.publishedAt,
      socialPostedAt: r.article.socialPostedAt,
      magazine: r.magazine
        ? { id: r.magazine.id, name: r.magazine.name }
        : null,
    }));

    return Response.json({ articles, count: articles.length });
  } catch (e: any) {
    return Response.json(
      { error: e?.message || "Failed to load social feed" },
      { status: 500 },
    );
  }
}