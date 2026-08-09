import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

async function getRole(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as any)?.role || "";
    return role;
  } catch {
    return "";
  }
}

// GET /api/admin/queue?magazine=tech-pulse&status=all
// Raindrop-style admin queue of ingested articles, filterable by magazine. Admin-only.
export async function GET(req: NextRequest) {
  const role = await getRole();
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const magId = sp.get("magazine") || "all";
  const status = sp.get("status") || "all";
  const q = (sp.get("q") || "").trim();

  try {
    const magazines = await db.select({ id: magazine.id, name: magazine.name }).from(magazine);

    const query = db.select().from(article).leftJoin(magazine, eq(article.magazineId, magazine.id));
    const conds: any[] = [];
    if (magId && magId !== "all") conds.push(eq(article.magazineId, magId));
    if (status && status !== "all") conds.push(eq(article.status, status));
    // fuzzy search on title (and less so on summary/magazine name)
    if (q) {
      const like = `%${q.replace(/[%_\\]/g, (c: string) => "\\" + c)}%`;
      conds.push(or(
        ilike(article.title, like),
        ilike(article.summary, like),
        ilike(magazine.name, like),
      ));
    }

    const qb = query.where(conds.length ? and(...conds) : undefined).orderBy(desc(article.createdAt)).limit(200);
    const rows: any[] = await qb;

    const articles = rows.map((r) => ({
      id: r.article.id,
      title: r.article.title,
      sourceUrl: r.article.sourceUrl,
      summary: r.article.summary,
      commentary: r.article.commentary,
      warnings: r.article.warnings,
      status: r.article.status,
      ingress: r.article.ingress,
      flagged: r.article.flagged,
      suitabilityOk: r.article.suitabilityOk,
      subcategory: r.article.subcategory,
      socialRepeat: r.article.socialRepeat,
      featured: r.article.featured,
      createdAt: r.article.createdAt,
      publishedAt: r.article.publishedAt,
      magazine: r.magazine ? { id: r.magazine.id, name: r.magazine.name } : null,
    }));

    return Response.json({ magazines, articles });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load queue" }, { status: 500 });
  }
}