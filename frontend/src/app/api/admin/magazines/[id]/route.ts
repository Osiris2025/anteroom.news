import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

// GET /api/admin/magazines/[id] — single magazine (incl. agent fields)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  const { id } = await params;
  const [row] = await db.select().from(magazine).where(eq(magazine.id, id));
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ magazine: row });
}

// PATCH /api/admin/magazines/[id] — edit agent_name, agent_model, tagline, description, colors.
// Admin + superadmin (admin-only + superadmin edits).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  const { id } = await params;
  let body: any = {};
  try { body = await req.json(); } catch {}

  const [row] = await db.select().from(magazine).where(eq(magazine.id, id));
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const upd: any = {};
  if (body.agentName !== undefined) upd.agentName = body.agentName || null;
  if (body.name !== undefined) upd.name = body.name;
  if (body.agentModel !== undefined) upd.agentModel = body.agentModel || "deepseek/deepseek-v4-flash-0731";
  if (body.tagline !== undefined) upd.tagline = body.tagline || null;
  if (body.description !== undefined) upd.description = body.description || null;
  if (body.colors !== undefined) upd.colors = body.colors || null;

  const [updated] = await db.update(magazine).set(upd).where(eq(magazine.id, id)).returning();
  return Response.json({ magazine: updated });
}