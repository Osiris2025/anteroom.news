import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { source } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

// DELETE /api/admin/sources/[id] — remove a source by id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  const { id } = await params;
  const [row] = await db.select({ id: source.id }).from(source).where(eq(source.id, id));
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  await db.delete(source).where(eq(source.id, id));
  return Response.json({ ok: true, id });
}