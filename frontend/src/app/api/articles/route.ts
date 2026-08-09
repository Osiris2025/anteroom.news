import { NextRequest } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";

// GET /api/articles?magazine=tech-pulse  — public, returns LIVE articles (date order)
// This is what feeds the public magazine pages from the intake pipeline.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const magId = sp.get("magazine") || "all";

  try {
    const query = db.select().from(article).leftJoin(magazine, eq(article.magazineId, magazine.id));
    const conds: any[] = [eq(article.status, "live")];
    if (magId && magId !== "all") conds.push(eq(article.magazineId, magId));
    const qb = query.where(and(...conds)).orderBy(desc(article.publishedAt)).limit(100);
    const rows: any[] = await qb;

    const articles = rows.map((r) => ({
      id: r.article.id,
      title: r.article.title,
      headline: r.article.headline,
      sourceUrl: r.article.sourceUrl,
      summary: r.article.summary,
      commentary: r.article.commentary,
      aiThoughts: r.article.aiThoughts,
      subcategory: r.article.subcategory,
      publishedAt: r.article.publishedAt,
      createdAt: r.article.createdAt,
      magazine: r.magazine ? { id: r.magazine.id, name: r.magazine.name } : null,
    }));

    return Response.json({ articles });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load articles" }, { status: 500 });
  }
}