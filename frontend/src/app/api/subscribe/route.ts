import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { digestSubscription } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

// POST /api/subscribe — subscribe an email to the newsletter/digest.
// body: { email: string, frequency?: "daily"|"weekly", magazines?: string[] }
// Returns the subscription id.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id || null;

  let body: any = {};
  try { body = await req.json(); } catch {}
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  const frequency = (body.frequency || "daily").trim();
  if (!["daily", "weekly"].includes(frequency)) {
    return Response.json({ error: "Frequency must be 'daily' or 'weekly'" }, { status: 400 });
  }

  const magazines = body.magazines || null;

  const [existing] = await db
    .select({ id: digestSubscription.id, verified: digestSubscription.verified, unsubscribedAt: digestSubscription.unsubscribedAt })
    .from(digestSubscription)
    .where(eq(digestSubscription.email, email));

  if (existing) {
    if (existing.unsubscribedAt) {
      await db.update(digestSubscription)
        .set({ frequency, magazines, userId: uid, unsubscribedAt: null, updatedAt: new Date() })
        .where(eq(digestSubscription.id, existing.id));
      return Response.json({ subscribed: true, id: existing.id, message: "Re-subscribed" });
    }
    await db.update(digestSubscription)
      .set({ frequency, magazines, userId: uid, updatedAt: new Date() })
      .where(eq(digestSubscription.id, existing.id));
    return Response.json({ subscribed: true, id: existing.id, message: "Preferences updated" });
  }

  const subId = randomUUID();
  const unsubscribeToken = randomUUID().replace(/-/g, "").slice(0, 16);
  const verifyToken = randomUUID().replace(/-/g, "").slice(0, 16);

  await db.insert(digestSubscription).values({
    id: subId, email, userId: uid, frequency, magazines,
    verified: false, verifyToken, unsubscribeToken,
  });

  // Auto-verify until email sending infrastructure is added
  await db.update(digestSubscription)
    .set({ verified: true, verifyToken: null })
    .where(eq(digestSubscription.id, subId));

  return Response.json({ subscribed: true, id: subId }, { status: 201 });
}
