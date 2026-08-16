import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { article, deletionLog, magazineMoveLog, source } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

async function guard(): Promise<Response | null> {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {}
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  return null;
}

// GET /api/admin/article/[id]  — single article detail (optional, for edit form)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const [row] = await db.select().from(article).where(eq(article.id, id));
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ article: row });
}

// PATCH /api/admin/article/[id] — administer an article
// body: { status?, magazineId?, subcategory?, socialRepeat? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  let body: any = {};
  try { body = await req.json(); } catch {}
  const [row] = await db.select().from(article).where(eq(article.id, id));
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const upd: any = {};
  if (body.status !== undefined) {
    upd.status = body.status;
    if (body.status === "live") upd.publishedAt = new Date();
    if (body.status === "approved" || body.status === "rejected") upd.reviewedAt = new Date();
  }
  // Track magazine moves so the system learns the right home magazine.
  if (body.magazineId !== undefined) {
    const target = body.magazineId || null;
    if (target && target !== row.magazineId) {
      await db.insert(magazineMoveLog).values({
        id: randomUUID(), articleId: row.id, title: row.title,
        sourceUrl: row.sourceUrl, sourceName: row.sourceName,
        fromMagazineId: row.magazineId, toMagazineId: target,
      });
      // bump the source's move_count (reflects difficulty picking a home)
      if (row.sourceUrl) {
        await db.update(source).set({ moveCount: sql`${source.moveCount} + 1` })
          .where(eq(source.url, row.sourceUrl));
      }
    }
    upd.magazineId = target;
  }
  if (body.subcategory !== undefined) upd.subcategory = body.subcategory || null;
  if (body.socialRepeat !== undefined) {
    upd.socialRepeat = !!body.socialRepeat;
    upd.socialPostedAt = body.socialRepeat ? (row.socialPostedAt || new Date()) : null;
  }
  if (body.featured !== undefined) {
    if (body.featured) {
      await db.update(article).set({ featured: false }).where(eq(article.featured, true));
    }
    upd.featured = !!body.featured;
  }
  if (body.flagged !== undefined) upd.flagged = !!body.flagged;
  if (body.efx !== undefined) upd.efx = body.efx || null;

  const [updated] = await db.update(article).set(upd).where(eq(article.id, id)).returning();
  return Response.json({ article: updated });
}

// DELETE /api/admin/article/[id] — remove an article
// body (optional): { reason: <code>, detail?: string }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  let body: any = {};
  try { body = await req.json(); } catch {}
  const reason = (body.reason || "other").trim() || "other";

  const [row] = await db.select().from(article).where(eq(article.id, id));
  if (row) {
    // Log WHY it was removed (drives troublesome-source stats + tuning).
    await db.insert(deletionLog).values({
      id: randomUUID(), articleId: row.id, title: row.title,
      sourceUrl: row.sourceUrl, sourceName: row.sourceName,
      magazineId: row.magazineId, reason, detail: body.detail || null,
    });
    // Bump the source's delete_count / last_delete_at.
    if (row.sourceUrl) {
      await db.update(source).set({
        deleteCount: sql`${source.deleteCount} + 1`,
        lastDeleteAt: new Date(),
      }).where(eq(source.url, row.sourceUrl));
    }
  }
  await db.delete(article).where(eq(article.id, id));
  return Response.json({ ok: true, id, reason });
}