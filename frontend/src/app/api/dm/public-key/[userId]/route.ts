import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dmKeyShare } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// GET /api/dm/public-key/[userId] — returns the public key for a given user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const [row] = await db
    .select({ publicKeyPem: dmKeyShare.publicKeyPem })
    .from(dmKeyShare)
    .where(eq(dmKeyShare.userId, userId))
    .limit(1);

  if (!row) {
    return Response.json({ error: "User has not registered a public key" }, { status: 404 });
  }

  return Response.json({ publicKeyPem: row.publicKeyPem });
}