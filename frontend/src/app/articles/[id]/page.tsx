import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import ArticlePageClient from "@/components/ArticlePageClient";

// /articles/[id] — public on-site article reader (server component).
// Fetches the article + its magazine, then hands off to ArticlePageClient, which
// themes the reader with the USER'S active theme (user choice always wins), not a
// static magazine->theme map. Keeps the dark/light palette consistent with the rest
// of the page so headlines stay readable on any theme.
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

  return (
    <ArticlePageClient
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
    />
  );
}