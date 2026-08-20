/**
 * GET /api/unsubscribe?token=xxx
 *
 * Unsubscribe from email digests. Called from the unsubscribe link in digest emails.
 */
import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { digestSubscription } from "@/drizzle/schema";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token || token.length < 8) {
      return new Response("Invalid unsubscribe link.", { status: 400 });
    }

    const [sub] = await db
      .select({ id: digestSubscription.id })
      .from(digestSubscription)
      .where(
        and(
          eq(digestSubscription.unsubscribeToken, token),
          eq(digestSubscription.verified, true)
        )
      );

    if (!sub) {
      return new Response("Subscription not found or already unsubscribed.", {
        status: 404,
      });
    }

    await db
      .update(digestSubscription)
      .set({ unsubscribedAt: new Date() })
      .where(eq(digestSubscription.id, sub.id));

    return new Response(
      "<html><body style='font-family:sans-serif;padding:40px;text-align:center;background:#0a0a0a;color:#e0e0e0;'><h1>Unsubscribed</h1><p>You have been unsubscribed from AI News Nexus digests.</p><a href='/' style='color:#0f3460;'>Back to AI News Nexus</a></body></html>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e: any) {
    return new Response("Something went wrong. Please try again.", {
      status: 500,
    });
  }
}
