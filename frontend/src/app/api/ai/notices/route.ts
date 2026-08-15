import { NextRequest } from "next/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { article } from "@/drizzle/schema";
import { FRONTIER_MODELS, matchModels } from "@/lib/ai_frontier";

// GET /api/ai/notices — for the Neural Hardware "AI Frontier" rail.
// Returns the freshest LIVE article per tracked model, plus per-model article
// counts. Pins/featured still float to the top of the result ordering.
export async function GET(_req: NextRequest) {
  try {
    // Pull recent LIVE articles from Neural Hardware (the everything-AI magazine).
    const rows: any[] = await db
      .select()
      .from(article)
      .where(and(eq(article.magazineId, "neural-hardware"), eq(article.status, "live")))
      .orderBy(desc(article.publishedAt))
      .limit(400);

    // Group by matched model.
    const byModel: Record<string, { latest: any; count: number }> = {};
    const all = [];
    for (const r of rows) {
      const item = {
        id: r.id, title: r.title, headline: r.headline, summary: r.summary,
        sourceUrl: r.sourceUrl, imageUrl: r.imageUrl, publishedAt: r.publishedAt,
        featured: r.featured === true, pinned: !!r.pinned && r.pinned.active,
      };
      all.push(item);
      const matched = matchModels({ title: r.title, sourceUrl: r.sourceUrl });
      for (const slug of matched) {
        if (!byModel[slug]) byModel[slug] = { latest: item, count: 0 };
        byModel[slug].count += 1;
        if (byModel[slug].count === 1) byModel[slug].latest = item;
      }
    }

    // Build the notices array in registry order, with the freshest article each.
    const notices = FRONTIER_MODELS.filter((m) => byModel[m.slug]).map((m) => ({
      slug: m.slug,
      name: m.name,
      vendor: m.vendor,
      color: m.color,
      desc: m.desc,
      count: byModel[m.slug].count,
      latest: byModel[m.slug].latest,
    }));

    // Total live count for the rail header.
    const [countRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(article)
      .where(eq(article.magazineId, "neural-hardware"));
    const totalLive = countRow?.n || 0;

    return Response.json({ notices, totalLive });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}