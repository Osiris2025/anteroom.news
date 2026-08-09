import { headers } from "next/headers";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];
const ROLES = ["superadmin", "admin", "user", "guest"];
const TIERS = ["guest", "free", "plus", "member"];
const STATUSES = ["active", "disabled"];

// GET /api/admin/users — list users + available role/tier/status values
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const me = (session?.user as any) || {};
  if (!ADMIN_ROLES.includes(me.role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, tier: user.tier, status: user.status, createdAt: user.createdAt })
    .from(user)
    .orderBy(desc(user.createdAt));
  return Response.json({ users: rows, roles: ROLES, tiers: TIERS, statuses: STATUSES });
}