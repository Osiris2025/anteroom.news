import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ROLES = ["superadmin", "admin", "user", "guest"];
const TIERS = ["guest", "free", "plus", "member"];
const STATUSES = ["active", "disabled"];

// PATCH /api/admin/users/[id] — update role / tier / status (superadmin only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const me = (session?.user as any) || {};
  // only superadmin can change roles of others (prevents an admin from escalating others)
  if (me.role !== "superadmin") {
    return Response.json({ error: "Forbidden — superadmin only" }, { status: 403 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const { id } = await params;

  const [target] = await db.select().from(user).where(eq(user.id, id));
  if (!target) return Response.json({ error: "User not found" }, { status: 404 });

  // Protect the primary superadmin from being demoted/disabled by accident
  if (target.role === "superadmin" && me.email !== target.email) {
    return Response.json({ error: "Cannot change another superadmin" }, { status: 400 });
  }

  const upd: any = {};
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) return Response.json({ error: "Bad role" }, { status: 400 });
    upd.role = body.role;
  }
  if (body.tier !== undefined) {
    if (!TIERS.includes(body.tier)) return Response.json({ error: "Bad tier" }, { status: 400 });
    upd.tier = body.tier;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return Response.json({ error: "Bad status" }, { status: 400 });
    upd.status = body.status;
  }

  const [updated] = await db.update(user).set(upd).where(eq(user.id, id)).returning();
  return Response.json({ user: updated });
}