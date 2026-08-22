import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { userFollow, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/follows — list the current user's followed magazines.
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in required" }, { status: 401 });

  const rows: any[] = await db
    .select({
      id: userFollow.id,
      magazineId: userFollow.magazineId,
      createdAt: userFollow.createdAt,
      magazineName: magazine.name,
      magazineTagline: magazine.tagline,
    })
    .from(userFollow)
    .innerJoin(magazine, eq(userFollow.magazineId, magazine.id))
    .where(eq(userFollow.userId, uid))
    .orderBy(desc(userFollow.createdAt));

  return Response.json({ follows: rows });
}

// POST /api/follows — follow a magazine.
// body: { magazineId: string }
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Sign in required" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const magazineId = (body.magazineId || "").trim();
  if (!magazineId) return Response.json({ error: "magazineId required" }, { status: 400 });

  // Verify magazine exists
  const [mag] = await db.select({ id: magazine.id }).from(magazine).where(eq(magazine.id, magazineId));
  if (!mag) return Response.json({ error: "Magazine not found" }, { status: 404 });

  // Check if already following
  const [existing] = await db
    .select({ id: userFollow.id })
    .from(userFollow)
    .where(and(eq(userFollow.userId, uid), eq(userFollow.magazineId, magazineId)));
  if (existing) {
    return Response.json({ id: existing.id, message: "Already following" });
  }

  // Insert follow
  const id = randomUUID();
  await db.insert(userFollow).values({ id, userId: uid, magazineId });
  return Response.json({ id, magazineId, message: "Followed" });
}
