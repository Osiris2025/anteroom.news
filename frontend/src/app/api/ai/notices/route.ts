import { NextRequest } from "next/server";
import { eq, desc, sql, or, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { article } from "@/drizzle/schema";
import { FRONTIER_MODELS, matchModels } from "@/lib/ai_frontier";

// GET /api/ai/notices — for the Neural Hardware "AI Frontier" rail.
// Returns the freshest LIVE article per tracked model + per-model counts.
//
// ROBUSTNESS: we query by SQL LIKE on the registry keywords/hosts (not a plain
// "600 newest" window), so we NEVER lose a model's coverage just because other
// non-AI articles are newer. Then we pick the best "latest" per model:
//   preferred = a release/announcement-type headline (release, debut, launches,
//   introduces, v, unveils, encoder-free, leaks, etc.), else the newest.
export async function GET(_req: NextRequest) {
  try {
    const titleLikes = new Set<string>();
    const hostLikes = new Set<string>();
    for (const m of FRONTIER_MODELS) {
      for (const k of m.keys) titleLikes.add(`%${k.toLowerCase()}%`);
      for (const h of m.hosts || []) hostLikes.add(`%${h.toLowerCase()}%`);
    }

    // SQL: live AND (title matches a model keyword OR source_host matches a model).
    const conds: any[] = [
      eq(article.status, "live"),
    ];
    const orsConditions: any[] = [];
    for (const like of titleLikes) orsConditions.push(sql`lower(coalesce(title,'')) LIKE ${like}`);
    for (const like of hostLikes) orsConditions.push(sql`lower(coalesce(source_url,'')) LIKE ${like}`);
    if (orsConditions.length) conds.push(or(...orsConditions));

    const rows: any[] = await db
      .select()
      .from(article)
      .where(and(...conds))
      .orderBy(desc(article.publishedAt), desc(article.createdAt))
      .limit(1200);

    // Group by model. Keep count + the kind of headline seen.
    const byModel: Record<string, { latest: any; count: number }> = {};
    const RELEASE_RE = /(release|releases?|launch|launches|debut|introduces?|announces?|unveils?|new|v\d+(\.\d+)+|leaks?|model|agent)/i;

    for (const r of rows) {
      const item = {
        id: r.id, title: r.title, headline: r.headline, summary: r.summary,
        sourceUrl: r.sourceUrl, imageUrl: r.imageUrl, publishedAt: r.publishedAt,
        featured: r.featured === true, pinned: !!r.pinned && r.pinned.active,
      };
      const matched = matchModels({ title: r.title, sourceUrl: r.sourceUrl });
      for (const slug of matched) {
        if (!byModel[slug]) byModel[slug] = { latest: item, count: 0 };
        const rec = byModel[slug];
        rec.count += 1;
        const itemRelease = RELEASE_RE.test((item.headline || item.title || "").toLowerCase());
        const cur = rec.latest;
        if (!cur) { rec.latest = item; continue; }
        const curIsRelease = RELEASE_RE.test((cur.headline || cur.title || "").toLowerCase());
        // Prefer a release/announcement headline over an incidental keyword match.
        if (itemRelease && !curIsRelease) rec.latest = item;
      }
    }

    // Build the notices array in registry order — ALWAYS include every tracked
    // model so the rail reads as a complete monitor (models with no live articles
    // yet show as "awaiting coverage" rather than vanishing).
    const notices = FRONTIER_MODELS.map((m) => ({
      slug: m.slug,
      name: m.name,
      vendor: m.vendor,
      color: m.color,
      desc: m.desc,
      count: byModel[m.slug]?.count || 0,
      latest: byModel[m.slug]?.latest || null,
    }));

    // Total live count for the rail header (whole magazine, not just models).
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