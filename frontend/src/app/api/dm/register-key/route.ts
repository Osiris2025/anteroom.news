import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { dmKeyShare } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// POST /api/dm/register-key — upsert the current user's ECDH public key
// Body: { publicKeyPem: string, signature: string }
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const publicKeyPem = body.publicKeyPem || "";
  if (!publicKeyPem) {
    return Response.json({ error: "publicKeyPem is required" }, { status: 400 });
  }

  // Upsert: insert or update the user's key share
  const existing = await db
    .select({ id: dmKeyShare.id })
    .from(dmKeyShare)
    .where(eq(dmKeyShare.userId, uid))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(dmKeyShare)
      .set({ publicKeyPem, keyCreatedAt: new Date() })
      .where(eq(dmKeyShare.userId, uid));
  } else {
    await db
      .insert(dmKeyShare)
      .values({
        id: randomUUID(),
        userId: uid,
        publicKeyPem,
        keyCreatedAt: new Date(),
      });
  }

  return Response.json({ ok: true });
}

// GET /api/dm/register-key — returns the current user's public key
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .select({ publicKeyPem: dmKeyShare.publicKeyPem })
    .from(dmKeyShare)
    .where(eq(dmKeyShare.userId, uid))
    .limit(1);

  if (!row) {
    return Response.json({ publicKeyPem: null });
  }

  return Response.json({ publicKeyPem: row.publicKeyPem });
}