import { NextRequest } from "next/server";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { article } from "@/drizzle/schema";
import { FRONTIER_MODELS, matchModels } from "@/lib/ai_frontier";

// GET /api/ai/model/[slug] — the article history (news) for one tracked model.
// Live articles FROM ANY MAGAZINE that match the model's keyword/source rules.
//
// ROBUSTNESS: filter by SQL LIKE on the model's keywords/hosts (not a "newest 500"
// window), so a model's coverage never gets starved just because other non-AI
// articles are newer (Hermes etc. had published_at = ingestion time).
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = FRONTIER_MODELS.find((m) => m.slug === slug);
  if (!model) return Response.json({ error: "Unknown model" }, { status: 404 });

  try {
    // SQL: live AND (title matches a model keyword OR source_host matches a model host).
    const conds: any[] = [eq(article.status, "live")];
    const ors: any[] = [];
    for (const k of model.keys) ors.push(sql`lower(coalesce(title,'')) LIKE ${`%${k.toLowerCase()}%`}`);
    for (const h of model.hosts || []) ors.push(sql`lower(coalesce(source_url,'')) LIKE ${`%${h.toLowerCase()}%`}`);
    if (ors.length) conds.push(or(...ors));

    const rows: any[] = await db
      .select()
      .from(article)
      .where(and(...conds))
      .orderBy(desc(article.publishedAt), desc(article.createdAt))
      .limit(200);

    const news = rows.map((r) => ({
      id: r.id, title: r.title, headline: r.headline, summary: r.summary,
      sourceUrl: r.sourceUrl, imageUrl: r.imageUrl, publishedAt: r.publishedAt,
      pinned: !!r.pinned && r.pinned.active,
      magazineId: r.magazineId,
    }));

    return Response.json({ model: { ...model }, news });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}