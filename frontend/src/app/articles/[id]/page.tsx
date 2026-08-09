import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { magazineTheme } from "@/lib/themes";
import ArticleReader from "@/components/ArticleReader";

// /articles/[id] — public on-site article reader (server component).
// Renders the article title, hero image (or themed placeholder), the saved summary,
// the per-magazine AI agent's commentary, a prominent link-out to the source, and
// the X-style comment thread. Themed via the magazine's mapped theme (never setTheme).
export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const rows: any[] = await db
    .select()
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.id, id));
  const r = rows[0];

  if (!r || !r.article) notFound();
  const a = r.article;
  const mag = r.magazine;
  const themeId = mag?.id ? (magazineTheme[mag.id] || "linear") : "linear";

  return (
    <ArticleReader
      article={{
        id: a.id,
        title: a.title,
        headline: a.headline,
        sourceUrl: a.sourceUrl,
        imageUrl: a.imageUrl,
        summary: a.summary,
        commentary: a.commentary,
        subcategory: a.subcategory,
        publishedAt: a.publishedAt,
      }}
      magazine={mag ? { id: mag.id, name: mag.name, agentName: mag.agentName, agentModel: mag.agentModel } : null}
      themeId={themeId}
    />
  );
}