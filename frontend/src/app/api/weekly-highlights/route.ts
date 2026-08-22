/**
 * GET /api/weekly-highlights
 *
 * Returns the top articles from the past 7 days, grouped by magazine,
 * for the Weekly Highlights feature (Tier 3 social-first content engine).
 * Designed to be consumed by the /highlights page.
 *
 * Response shape:
 * {
 *   generatedAt: ISO date string,
 *   weekRange: { start, end },
 *   magazines: [{
 *     id, name, tagline, agentName, accent,
 *     articleCount,
 *     articles: [{ id, title, headline, summary, commentary, imageUrl, publishedAt, subcategory, featured, pinKind, sourceName, articleUrl }]
 *   }],
 *   totalArticles: number,
 *   totalMagazines: number
 * }
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { article, magazine as magazineTable } from "@/drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { MAGAZINES } from "@/lib/themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_BASE_URL || "https://anteroom.news";

export async function GET() {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all live articles from the past 7 days
    const liveArticles: any[] = await db
      .select()
      .from(article)
      .leftJoin(magazineTable, eq(article.magazineId, magazineTable.id))
      .where(
        and(
          eq(article.status, "live"),
          gte(article.publishedAt, weekAgo)
        )
      )
      .orderBy(
        desc(article.featured),
        desc(article.publishedAt)
      );

    // Build a map of magazine accent colors from the static themes config
    const colorMap: Record<string, string> = {};
    for (const m of MAGAZINES) {
      colorMap[m.id] = m.accent || "#ffd700";
    }

    // Group articles by magazine
    const byMag: Record<string, { mag: any; articles: any[] }> = {};
    for (const row of liveArticles) {
      const a = row.article;
      const mag = row.magazine;
      const mid = a.magazineId || "other";
      if (!byMag[mid]) {
        byMag[mid] = { mag, articles: [] };
      }
      byMag[mid].articles.push({
        id: a.id,
        title: a.headline || a.title,
        headline: a.headline,
        summary: (a.summary || "").slice(0, 300),
        commentary: (a.commentary || "").slice(0, 500),
        imageUrl: a.imageUrl,
        publishedAt: a.publishedAt,
        subcategory: a.subcategory,
        featured: a.featured || false,
        sourceName: a.sourceName,
        articleUrl: SITE_URL + "/articles/" + a.id,
      });
    }

    // Build magazine groups sorted by article count (most prolific first)
    const groups = Object.entries(byMag)
      .map(([id, group]) => {
        const mag = group.mag;
        const staticMag = MAGAZINES.find((m) => m.id === id);
        return {
          id,
          name: (mag && mag.name) || (staticMag && staticMag.name) || id,
          tagline: (mag && mag.tagline) || (staticMag && staticMag.tagline) || "",
          agentName: (mag && mag.agentName) || (staticMag && staticMag.short) || "The Desk",
          accent: colorMap[id] || "#ffd700",
          articleCount: group.articles.length,
          articles: group.articles.slice(0, 8), // top 8 per magazine
        };
      })
      .sort((a, b) => b.articleCount - a.articleCount);

    return NextResponse.json({
      generatedAt: now.toISOString(),
      weekRange: {
        start: weekAgo.toISOString(),
        end: now.toISOString(),
      },
      magazines: groups,
      totalArticles: liveArticles.length,
      totalMagazines: groups.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to generate weekly highlights" },
      { status: 500 }
    );
  }
}
