import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { article } from "@/drizzle/schema";
import { FRONTIER_MODELS, matchModels } from "@/lib/ai_frontier";

// GET /api/ai/model/[slug] — the article history (news) for one tracked model.
// Live articles FROM ANY MAGAZINE that match the model's keyword/source rules —
// so e.g. /ai/hermes surfaces every Hermes story we have, not just Neural Hardware
// release notes.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = FRONTIER_MODELS.find((m) => m.slug === slug);
  if (!model) return Response.json({ error: "Unknown model" }, { status: 404 });

  try {
    const rows: any[] = await db
      .select()
      .from(article)
      .where(and(eq(article.status, "live")))
      .orderBy(desc(article.publishedAt))
      .limit(500);

    // Filter in JS to the matched model (same rule as the notices rail).
    const news = rows
      .filter((r) => matchModels({ title: r.title, sourceUrl: r.sourceUrl }).includes(slug))
      .map((r) => ({
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