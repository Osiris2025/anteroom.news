import { NextRequest } from "next/server";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
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
  const offset = parseInt(sp.get("offset") || "0", 10);
  const limit = Math.min(parseInt(sp.get("limit") || "150", 10), 200);
  const subcat = sp.get("subcat") || "";
  // releases=1 → only software-release-version entries (subcategory 'Releases').
  // Default (no param) → the full live stream, INCLUDING releases as regular items
  // (ordered by publishedAt alongside everything else).
  const releasesOnly = sp.get("releases") === "1";

  try {
    const conds: any[] = [eq(article.status, "live")];
    if (magId && magId !== "all") conds.push(eq(article.magazineId, magId));
    const q = (sp.get("q") || "").trim();
    // Full-text search via tsvector when ?q= is provided (plainto_tsquery sanitizes input)
    if (q) {
      conds.push(sql`search_vector @@ plainto_tsquery('english', ${q})`);
    }

    if (releasesOnly) {
      conds.push(eq(article.subcategory, "Releases"));
    } else if (subcat && subcat !== "all") {
      // Browse a specific subcategory (agents, models, cyber…)
      conds.push(eq(article.subcategory, subcat));
    } else {
      // Main stream = every live article for the magazine, INCLUDING software
      // release-version items. Releases are ordinary news here, ordered by
      // publishedAt (release date) along with everything else — no dedicated
      // section, no special filtering.
    }

    // Total count for pagination
    const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(article).where(and(...conds));
    const total = countResult[0]?.count || 0;

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
      .orderBy(q ? sql`ts_rank(search_vector, plainto_tsquery('english', ${q})) DESC` : desc(article.publishedAt))
      .limit(limit)
      .offset(offset);
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
        sourceName: r.article.sourceName || null,
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
    // NOTE: removed the old "source-priority boost" that pushed github.com
    // (Hermes releases) / openai.com / anthropic.com to the top of Neural
    // Hardware — that made version-bump entries dominate the front page.
    // Release entries are now moved to the dedicated Releases section instead.
    const ordered = [...pinned, ...rest];

    return Response.json({ articles: ordered, total });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load articles" }, { status: 500 });
  }
}