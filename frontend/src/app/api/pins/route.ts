import { NextRequest } from "next/server";
import { eq, and, desc, or, isNull, lt, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { pin, article, magazine } from "@/drizzle/schema";

// GET /api/pins/active — public endpoint for active (non-expired) pins
// Used by MagazineView to render the hero/FLASH section
export async function GET() {
  try {
    const rows: any[] = await db
      .select({
        id: pin.id,
        kind: pin.kind,
        runFor: pin.runFor,
        expiresAt: pin.expiresAt,
        pinnedAt: pin.pinnedAt,
        article: {
          id: article.id,
          title: article.title,
          headline: article.headline,
          summary: article.summary,
          sourceUrl: article.sourceUrl,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
        },
        magazine: { id: magazine.id, name: magazine.name },
      })
      .from(pin)
      .innerJoin(article, eq(pin.articleId, article.id))
      .leftJoin(magazine, eq(article.magazineId, magazine.id))
      .where(
        and(
          eq(pin.active, true),
          or(isNull(pin.expiresAt), gt(pin.expiresAt, new Date()))
        )
      )
      .orderBy(desc(pin.pinnedAt))
      .limit(20);

    return Response.json({ pins: rows });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load pins" }, { status: 500 });
  }
}
