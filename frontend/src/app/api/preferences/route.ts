import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userPreference, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/preferences — the signed-in user's saved preferences.
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in required" }, { status: 401 });
  const [row] = await db
    .select({ defaultMagazineId: userPreference.defaultMagazineId, defaultMagazineName: magazine.name })
    .from(userPreference)
    .leftJoin(magazine, eq(userPreference.defaultMagazineId, magazine.id))
    .where(eq(userPreference.userId, uid));
  return Response.json({
    defaultMagazineId: row?.defaultMagazineId ?? null,
    defaultMagazineName: row?.defaultMagazineName ?? null,
  });
}

// PUT /api/preferences  { defaultMagazineId: string | null }
export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in required" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const id = body?.defaultMagazineId;
  if (id !== null && typeof id !== "string") {
    return Response.json({ error: "defaultMagazineId must be a magazine id or null" }, { status: 400 });
  }
  if (id) {
    const [m] = await db.select({ id: magazine.id }).from(magazine).where(eq(magazine.id, id));
    if (!m) return Response.json({ error: "Unknown magazine" }, { status: 404 });
  }
  await db
    .insert(userPreference)
    .values({ userId: uid, defaultMagazineId: id ?? null })
    .onConflictDoUpdate({
      target: userPreference.userId,
      set: { defaultMagazineId: id ?? null, updatedAt: new Date() },
    });
  return Response.json({ defaultMagazineId: id ?? null });
}
