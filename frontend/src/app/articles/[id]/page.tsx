import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import ArticlePageClient from "@/components/ArticlePageClient";

const SITE_URL = "https://nexus.osiris2025.com";

// /articles/[id] — public on-site article reader (server component).
// Fetches the article + its magazine, then hands off to ArticlePageClient, which
// themes the reader with the USER'S active theme (user choice always wins), not a
// static magazine->theme map. Keeps the dark/light palette consistent with the rest
// of the page so headlines stay readable on any theme.

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const rows: any[] = await db
    .select()
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.id, id));
  const r = rows[0];
  if (!r || !r.article) return { title: "Article Not Found \u2014 AI News Nexus" };

  const a = r.article;
  const mag = r.magazine;
  const title = a.headline || a.title || "AI News Nexus";
  const description = a.summary || a.commentary || `Read on ${mag?.name || "AI News Nexus"}`;
  const imageUrl = a.imageUrl || "";
  const canonicalUrl = `${SITE_URL}/articles/${id}`;

  return {
    title: `${title} \u2014 ${mag?.name || "AI News Nexus"}`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "AI News Nexus",
      type: "article",
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: title }] } : {}),
      ...(mag ? { tags: [mag.name] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

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
        sourceName: a.sourceName,
        imageUrl: a.imageUrl,
        efx: a.efx,
        summary: a.summary,
        commentary: a.commentary,
        subcategory: a.subcategory,
        publishedAt: a.publishedAt,
      }}
      magazine={mag ? { id: mag.id, name: mag.name, agentName: mag.agentName, agentModel: mag.agentModel } : null}
    />
  );
}