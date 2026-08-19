import { NextRequest } from "next/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";

// GET /api/articles?magazine=tech-pulse&limit=500&q=search+terms
// Public, returns LIVE articles (date order or search relevance).
// ?q= uses Postgres tsvector full-text search on title/summary/commentary.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const magId = sp.get("magazine") || "all";
  const limitStr = sp.get("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : 500;
  const capped = Math.min(Math.max(limit, 1), 1000);
  const q = (sp.get("q") || "").trim();

  try {
    const query = db.select().from(article).leftJoin(magazine, eq(article.magazineId, magazine.id));
    const conds: any[] = [eq(article.status, "live")];
    if (magId && magId !== "all") conds.push(eq(article.magazineId, magId));

    // Full-text search via tsvector when ?q= is provided
    const useSearch = q.length > 0;
    if (useSearch) {
      // Sanitize: plainto_tsquery handles punctuation, prevents injection
      conds.push(sql`search_vector @@ plainto_tsquery('english', ${q})`);
    }

    const qb = query.where(and(...conds));
    // When searching, order by relevance; otherwise by date
    if (useSearch) {
      qb.orderBy(sql`ts_rank(search_vector, plainto_tsquery('english', ${q})) DESC`);
    } else {
      qb.orderBy(desc(article.publishedAt));
    }
    qb.limit(capped);

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
