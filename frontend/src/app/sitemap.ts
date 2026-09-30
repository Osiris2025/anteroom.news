import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { SITE_URL } from "@/lib/site";

// Force dynamic rendering — this sitemap queries Postgres at request time
export const dynamic = "force-dynamic";

const STATIC_PAGES: { path: string; priority: number; changefreq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changefreq: "hourly" },
  { path: "/collect", priority: 0.5, changefreq: "weekly" },
  { path: "/social-feed", priority: 0.5, changefreq: "hourly" },
  { path: "/shop", priority: 0.4, changefreq: "weekly" },
  { path: "/dms", priority: 0.3, changefreq: "monthly" },
  { path: "/profile", priority: 0.3, changefreq: "monthly" },
  { path: "/subscribe", priority: 0.5, changefreq: "monthly" },
  { path: "/support", priority: 0.4, changefreq: "monthly" },
  { path: "/about", priority: 0.4, changefreq: "monthly" },
  { path: "/legal", priority: 0.3, changefreq: "monthly" },
];

const AI_PAGES = [
  "/ai/hermes", "/ai/gpt", "/ai/claude", "/ai/gemini",
  "/ai/deepseek", "/ai/qwen", "/ai/lama", "/ai/grok",
  "/ai/mstral", "/ai/bytendance",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const magazines = await db.select({ id: magazine.id }).from(magazine);
  const articles = await db
    .select({ id: article.id, publishedAt: article.publishedAt })
    .from(article)
    .where(eq(article.status, "live"))
    .orderBy(article.publishedAt);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: SITE_URL + p.path,
    lastModified: now,
    changeFrequency: p.changefreq,
    priority: p.priority,
  }));

  const aiEntries: MetadataRoute.Sitemap = AI_PAGES.map((path) => ({
    url: SITE_URL + path,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  const magazineEntries: MetadataRoute.Sitemap = magazines.map((m) => ({
    url: SITE_URL + "/magazines/" + m.id,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: SITE_URL + "/articles/" + a.id,
    lastModified: a.publishedAt ?? now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...aiEntries, ...magazineEntries, ...articleEntries];
}
