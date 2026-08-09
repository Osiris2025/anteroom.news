import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pin } from "@/drizzle/schema";
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

// PATCH /api/admin/pins/[id] — unpin a pin (sets active=false, unpinnedAt=now)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;

  const [existing] = await db.select().from(pin).where(eq(pin.id, id));
  if (!existing) return Response.json({ error: "Pin not found" }, { status: 404 });

  const [updated] = await db
    .update(pin)
    .set({ active: false, unpinnedAt: new Date() })
    .where(eq(pin.id, id))
    .returning();

  return Response.json({ pin: updated });
}

// GET /api/admin/pins/[id] — get a single pin
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const [row] = await db.select().from(pin).where(eq(pin.id, id));
  if (!row) return Response.json({ error: "Pin not found" }, { status: 404 });
  return Response.json({ pin: row });
}
