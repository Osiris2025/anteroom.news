import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { pin, article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

async function guard(): Promise<Response | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as any)?.role || "";
    if (!ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  return null;
}

// GET /api/admin/pins — list all active pins with article info
export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  const rows: any[] = await db
    .select({
      pin: pin,
      article: { id: article.id, title: article.title, headline: article.headline, status: article.status, publishedAt: article.publishedAt },
      magazine: { id: magazine.id, name: magazine.name },
    })
    .from(pin)
    .innerJoin(article, eq(pin.articleId, article.id))
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(pin.active, true))
    .orderBy(pin.pinnedAt);

  return Response.json({ pins: rows });
}

// POST /api/admin/pins — pin an article (creates a new pin)
// body: { article_id, kind?, run_for? }
// kind defaults to "FLASH", run_for defaults to "24h"
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  let body: any = {};
  try { body = await req.json(); } catch {}

  const articleId = body.article_id;
  if (!articleId) {
    return Response.json({ error: "article_id is required" }, { status: 400 });
  }

  // Verify article exists
  const [art] = await db.select().from(article).where(eq(article.id, articleId));
  if (!art) {
    return Response.json({ error: "Article not found" }, { status: 404 });
  }

  const kind = body.kind || "FLASH";
  const runFor = body.run_for || "24h";

  // Calculate expires_at based on run_for
  let expiresAt: Date | null = null;
  if (runFor === "24h") {
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else if (runFor === "7d") {
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  const id = "pin_" + ts + "_" + rand;

  const [newPin] = await db
    .insert(pin)
    .values({
      id,
      articleId,
      kind,
      runFor,
      expiresAt,
      pinnedAt: new Date(),
      active: true,
    })
    .returning();

  return Response.json({ pin: newPin });
}
