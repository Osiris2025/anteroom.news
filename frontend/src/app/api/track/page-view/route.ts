import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { pageView } from "@/drizzle/schema";

// POST /api/track/page-view — log a page visit with referrer + UTM context
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = body.path || req.headers.get("referer") || "/";
    const ua = req.headers.get("user-agent") || body.userAgent || "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "";

    // Rate-limit check: skip known bots
    const botPatterns = [/bot/i, /crawler/i, /spider/i, /scrape/i, /curl/i, /wget/i];
    if (botPatterns.some((p) => p.test(ua))) {
      return Response.json({ ok: true, skipped: "bot" });
    }

    await db.insert(pageView).values({
      id: undefined, // auto-gen
      path,
      referrer: body.referrer || null,
      utmSource: body.utmSource || null,
      utmMedium: body.utmMedium || null,
      utmCampaign: body.utmCampaign || null,
      utmContent: body.utmContent || null,
      userAgent: ua.slice(0, 500),
      ip: ip.slice(0, 45),
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("track/page-view error:", err);
    return Response.json({ ok: true, error: String(err) }, { status: 500 });
  }
}
