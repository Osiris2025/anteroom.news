import { NextRequest } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { article } from "@/drizzle/schema";

// GET /api/articles/subcats?magazine=neural-hardware
// Returns the live subcategory counts for a magazine, so the sidebar can show
// a "Browse" chip list ONLY for subcategories that actually have content.
export async function GET(req: NextRequest) {
  const magId = req.nextUrl.searchParams.get("magazine") || "all";
  try {
    const conds: any[] = [eq(article.status, "live"), sql`${article.subcategory} IS NOT NULL`, sql`${article.subcategory} <> ''`];
    if (magId && magId !== "all") conds.push(eq(article.magazineId, magId));

    const rows = await db
      .select({ subcategory: article.subcategory, n: sql<number>`count(*)::int` })
      .from(article)
      .where(and(...conds))
      .groupBy(article.subcategory)
      .orderBy(sql`count(*) DESC`);

    return Response.json({ subcats: rows });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
