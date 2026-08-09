import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";

// GET /api/articles/[id] — public single article (reader page data source),
// left-joined on magazine so the reader can carry the magazine's agent + identity.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows: any[] = await db
    .select()
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.id, id));

  const r = rows[0];
  if (!r || !r.article) return Response.json({ error: "Article not found" }, { status: 404 });
  const a = r.article;
  return Response.json({
    article: {
      id: a.id,
      title: a.title,
      headline: a.headline,
      sourceUrl: a.sourceUrl,
      imageUrl: a.imageUrl,
      summary: a.summary,
      commentary: a.commentary,
      aiThoughts: a.aiThoughts,
      status: a.status,
      subcategory: a.subcategory,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
      magazine: r.magazine
        ? { id: r.magazine.id, name: r.magazine.name, agentName: r.magazine.agentName, agentModel: r.magazine.agentModel, theme: r.magazine.id }
        : null,
    },
  });
}