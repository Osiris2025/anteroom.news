import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import ArticlePageClient from "@/components/ArticlePageClient";
import { SITE_URL } from "@/lib/site";

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
  if (!r || !r.article) return { title: "Article Not Found — Anteroom" };

  const a = r.article;
  const mag = r.magazine;
  const title = a.headline || a.title || "Anteroom";
  const rawDesc = a.summary || a.commentary || `Read on ${mag?.name || "Anteroom"}`;
  // Plain text for previews: strip markdown markers and keep it to ~200 chars.
  const plain = String(rawDesc).replace(/[*_`#>]+/g, "").replace(/\s+/g, " ").trim();
  const description = plain.length > 200 ? plain.slice(0, 197).replace(/\s+\S*$/, "") + "…" : plain;
  const imageUrl = a.imageUrl || "";
  const canonicalUrl = `${SITE_URL}/articles/${id}`;
  const brandedOgUrl = `${SITE_URL}/api/og?articleId=${encodeURIComponent(id)}`;

  const ogImages: { url: string; width?: number; height?: number; alt: string }[] = [{ url: brandedOgUrl, width: 1200, height: 630, alt: title }];
  // Fallback to source image if branded OG fails
  if (imageUrl) {
    // Real size unknown, so don't claim 1200x630 for the publisher's photo.
    ogImages.push({ url: imageUrl, alt: title });
  }

  return {
    title: `${title} — ${mag?.name || "Anteroom"}`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Anteroom",
      type: "article",
      ...(a.publishedAt ? { publishedTime: new Date(a.publishedAt).toISOString() } : {}),
      images: ogImages,
      ...(mag ? { tags: [mag.name] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [brandedOgUrl],
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

  // JSON-LD Article structured data for SEO
  const articleTitle = a.headline || a.title || "";
  const authorName = mag?.agentName || mag?.name || "Anteroom";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articleTitle,
    description: a.summary || "",
    ...(a.imageUrl ? { image: a.imageUrl } : {}),
    datePublished: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
    dateModified: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Anteroom",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/articles/${id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
    </>
  );
}