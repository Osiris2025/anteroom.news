import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { source } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

async function guard(): Promise<Response | null> {
  let session = null;
  try { session = await auth.api.getSession({ headers: await headers() }); } catch {}
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) return Response.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

// PATCH /api/admin/sources/[id] — tune a source
// body: { status?: 'active'|'paused'|'deleted', tune?: number (-3..+3), limit?: number }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  let body: any = {};
  try { body = await req.json(); } catch {}

  const upd: any = {};
  if (body.status !== undefined) upd.status = body.status;
  if (body.tune !== undefined) {
    const t = Number(body.tune);
    if (!Number.isFinite(t)) return Response.json({ error: "tune must be a number" }, { status: 400 });
    upd.tune = Math.max(-3, Math.min(3, Math.round(t)));
  }
  if (body.limit !== undefined) {
    const n = Number(body.limit);
    upd.limit = Number.isFinite(n) && n > 0 ? Math.round(n) : 25;
  }
  if (Object.keys(upd).length === 0) return Response.json({ error: "nothing to update" }, { status: 400 });

  const [updated] = await db.update(source).set(upd).where(eq(source.id, id)).returning();
  return Response.json({ source: updated });
}

// DELETE /api/admin/sources/[id] — remove a source feed entirely
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  await db.delete(source).where(eq(source.id, id));
  return Response.json({ ok: true, id });
}