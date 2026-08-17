import { NextRequest } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";

// GET /api/articles?magazine=tech-pulse&limit=500  — public, returns LIVE articles (date order)
// limit param: default 500 (up from 150 to fix the cap that silently truncates about 86 old articles).
// Per-magazine queries also use the limit, returning FULL sets for any magazine.
// This is what feeds the public magazine pages from the intake pipeline.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const magId = sp.get("magazine") || "all";
  const limitStr = sp.get("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : 500;
  const capped = Math.min(Math.max(limit, 1), 1000); // cap at 1000 max to be safe

  try {
    const query = db.select().from(article).leftJoin(magazine, eq(article.magazineId, magazine.id));
    const conds: any[] = [eq(article.status, "live")];
    if (magId && magId !== "all") conds.push(eq(article.magazineId, magId));
    const qb = query.where(and(...conds)).orderBy(desc(article.publishedAt)).limit(capped);
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
