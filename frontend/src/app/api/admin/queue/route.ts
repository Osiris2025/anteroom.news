import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine, source } from "@/drizzle/schema";
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

    // Friendly site names from the source table, keyed by hostname (lowercased).
    const srcRows = await db.select({ name: source.name, url: source.url }).from(source);
    const srcByHost = new Map<string, string>();
    for (const s of srcRows) {
      try {
        if (s.url) srcByHost.set(new URL(s.url).hostname.replace(/^www\./, "").toLowerCase(), s.name || "");
      } catch { /* ignore */ }
    }
    const siteNameFor = (u?: string | null): string => {
      if (!u) return "";
      try {
        const h = new URL(u).hostname.replace(/^www\./, "").toLowerCase();
        return srcByHost.get(h) || h;
      } catch {
        return u;
      }
    };

    const query = db.select().from(article).leftJoin(magazine, eq(article.magazineId, magazine.id));
    const conds: any[] = [];
    if (magId && magId !== "all") conds.push(eq(article.magazineId, magId));
    if (status && status !== "all") conds.push(eq(article.status, status));
    // Full-text search via tsvector when ?q= is provided (title/summary/commentary)
    if (q) {
      conds.push(sql`search_vector @@ plainto_tsquery('english', ${q})`);
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
      efx: r.article.efx,
      createdAt: r.article.createdAt,
      publishedAt: r.article.publishedAt,
      magazine: r.magazine ? { id: r.magazine.id, name: r.magazine.name } : null,
      siteName: siteNameFor(r.article.sourceUrl),
    }));

    return Response.json({ magazines, articles });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load queue" }, { status: 500 });
  }
}