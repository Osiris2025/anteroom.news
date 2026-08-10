import { NextRequest } from "next/server";
import { eq, desc, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine, pin } from "@/drizzle/schema";

// GET /api/articles?magazine=tech-pulse  — public, returns LIVE articles.
// Pinned articles (active pins: FLASH / IMPORTANT) surface FIRST (ordered by
// pinned_at desc), then the remaining live articles by publishedAt desc.
// The response carries `pinned`, `pinKind`, `featured`, `imageUrl` + `headline`
// so magazine pages can render an editorial leader hero, quick-read pipeline,
// and full grid. Does NOT include draft/rejected content.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const magId = sp.get("magazine") || "all";

  try {
    const conds: any[] = [eq(article.status, "live")];
    if (magId && magId !== "all") conds.push(eq(article.magazineId, magId));

    // Active pins first (any kind, not yet expired), newest pinned first.
    const pins: any[] = await db
      .select()
      .from(pin)
      .where(and(eq(pin.active, true), isNull(pin.unpinnedAt)))
      .orderBy(desc(pin.pinnedAt));

    // Article rows: magazine-filtered, live, newest first.
    const query = db
      .select()
      .from(article)
      .leftJoin(magazine, eq(article.magazineId, magazine.id))
      .where(and(...conds))
      .orderBy(desc(article.publishedAt))
      .limit(150);
    const rows: any[] = await query;

    // Ensure pins are active on a live article before allowing them to surface.
    const pinByArticle = new Map<string, any>();
    for (const p of pins) {
      const stillLive = rows.some((r) => r.article.id === p.articleId);
      if (stillLive && !pinByArticle.has(p.articleId)) pinByArticle.set(p.articleId, p);
    }

    const articles = rows.map((r) => {
      const pinRow = pinByArticle.get(r.article.id);
      return {
        id: r.article.id,
        title: r.article.title,
        headline: r.article.headline,
        sourceUrl: r.article.sourceUrl,
        imageUrl: r.article.imageUrl,
        summary: r.article.summary,
        commentary: r.article.commentary,
        status: r.article.status,
        aiThoughts: r.article.aiThoughts,
        subcategory: r.article.subcategory,
        featured: r.article.featured === true,
        pinned: !!pinRow,
        pinKind: pinRow ? pinRow.kind : null,
        publishedAt: r.article.publishedAt,
        createdAt: r.article.createdAt,
        magazine: r.magazine ? { id: r.magazine.id, name: r.magazine.name } : null,
      };
    });

    // Pinned first (in pin order), then newest published first.
    const pinnedIds = Array.from(pinByArticle.keys());
    const pinned = pinnedIds
      .map((id) => articles.find((a) => a.id === id))
      .filter(Boolean);
    const rest = articles.filter((a) => !pinByArticle.has(a.id));
    const ordered = [...pinned, ...rest];

    return Response.json({ articles: ordered });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load articles" }, { status: 500 });
  }
}