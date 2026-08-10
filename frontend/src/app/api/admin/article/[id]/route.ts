import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article } from "@/drizzle/schema";
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
  if (body.magazineId !== undefined) upd.magazineId = body.magazineId || null;
  if (body.subcategory !== undefined) upd.subcategory = body.subcategory || null; // assign OR create value
  if (body.socialRepeat !== undefined) {
    upd.socialRepeat = !!body.socialRepeat;
    upd.socialPostedAt = body.socialRepeat ? (row.socialPostedAt || new Date()) : null;
  }
  if (body.featured !== undefined) {
    // make this the flagship: clear others' featured, set this one
    if (body.featured) {
      await db.update(article).set({ featured: false }).where(eq(article.featured, true));
    }
    upd.featured = !!body.featured;
  }
  if (body.flagged !== undefined) upd.flagged = !!body.flagged;
  if (body.efx !== undefined) upd.efx = body.efx || null; // 'vhs' | 'rain' | 'lightning' | null

  const [updated] = await db.update(article).set(upd).where(eq(article.id, id)).returning();
  return Response.json({ article: updated });
}

// DELETE /api/admin/article/[id] — remove an article
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  await db.delete(article).where(eq(article.id, id));
  return Response.json({ ok: true, id });
}