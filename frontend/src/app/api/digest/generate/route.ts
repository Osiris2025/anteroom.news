/**
 * GET /api/digest/generate?frequency=daily|weekly&test=email@example.com
 *
 * Generates email digests for all verified subscribers. Cron-ready.
 * SECURITY: Admin-only, or pass ?key=CRON_SECRET for cron access.
 */

import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq, inArray, and, gte, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { digestSubscription, article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const ADMIN_ROLES = ["superadmin", "admin"];
const CRON_SECRET = process.env.CRON_SECRET || "";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const key = req.nextUrl.searchParams.get("key");
  if (key && CRON_SECRET && key === CRON_SECRET) return true;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as any)?.role || "";
    return ADMIN_ROLES.includes(role);
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderDigestHtml(opts: {
  magazineGroups: { name: string; id: string; articles: { title: string; summary: string; imageUrl: string | null }[] }[];
  unsubscribeToken: string;
  frequency: string;
}): string {
  const { magazineGroups, unsubscribeToken } = opts;
  const items = magazineGroups.flatMap((g) => g.articles);
  const totalArticles = items.length;
  const siteUrl = process.env.AUTH_URL || "https://nexus.osiris2025.com";

  const sections = magazineGroups.map((group) => {
    const articlesHtml = group.articles.slice(0, 5).map((art) => {
      const imgCell = art.imageUrl
        ? `<td width="80" style="padding:0;"><img src="${escapeHtml(art.imageUrl)}" alt="" width="80" height="80" style="display:block;width:80px;height:80px;object-fit:cover;" onerror="this.style.display='none'"></td>`
        : "";
      return `<tr><td style="padding:8px 30px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;"><tr>${imgCell}<td style="padding:12px 16px;"><span style="color:#e0e0e0;font-size:14px;font-weight:600;line-height:1.3;display:block;">${escapeHtml(art.title)}</span><p style="margin:4px 0 0;font-size:12px;color:#888;line-height:1.4;">${escapeHtml((art.summary || "").slice(0, 200))}</p></td></tr></table></td></tr>`;
    }).join("");

    const moreLink = group.articles.length > 5
      ? `<tr><td style="padding:4px 30px 10px;"><a href="${siteUrl}/magazines/${group.id}" style="color:#0f3460;font-size:13px;text-decoration:none;">+ ${group.articles.length - 5} more in ${escapeHtml(group.name)} &rarr;</a></td></tr>`
      : "";

    return `<tr><td style="padding:25px 30px 10px;"><h2 style="margin:0;font-size:18px;font-weight:700;color:#0f3460;">${escapeHtml(group.name)}</h2></td></tr>${articlesHtml}${moreLink}`;
  }).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Anteroom Digest</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#141414;border-radius:12px;overflow:hidden;">
<tr><td style="padding:30px 30px 20px;text-align:center;background:linear-gradient(135deg,#1a1a2e,#16213e);">
<h1 style="margin:0;font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Anteroom</h1>
<p style="margin:8px 0 0;font-size:14px;color:#888;">Your curated digest &middot; ${totalArticles} stories</p>
</td></tr>
<tr><td style="padding:20px 30px;background:#1e1e1e;">
<table role="presentation" width="100%"><tr>
<td style="text-align:center;padding:10px;"><span style="font-size:28px;font-weight:900;color:#fff;">${magazineGroups.length}</span><br><span style="font-size:12px;color:#888;">Magazines</span></td>
<td style="text-align:center;padding:10px;"><span style="font-size:28px;font-weight:900;color:#fff;">${totalArticles}</span><br><span style="font-size:12px;color:#888;">Articles</span></td>
</tr></table>
</td></tr>
${sections}
<tr><td style="padding:30px;text-align:center;border-top:1px solid #222;">
<p style="margin:0 0 10px;font-size:12px;color:#666;">You are receiving this because you subscribed to Anteroom.</p>
<a href="${siteUrl}/api/unsubscribe?token=${escapeHtml(unsubscribeToken)}" style="color:#666;font-size:12px;text-decoration:underline;">Unsubscribe</a>
<p style="margin:10px 0 0;font-size:11px;color:#444;">${siteUrl}</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const frequency = req.nextUrl.searchParams.get("frequency") || "daily";
    if (!["daily", "weekly"].includes(frequency)) {
      return Response.json({ error: "frequency must be daily or weekly" }, { status: 400 });
    }

    const testEmail = req.nextUrl.searchParams.get("test");

    let subscribers: any[];
    if (testEmail) {
      const [sub] = await db
        .select()
        .from(digestSubscription)
        .where(
          and(
            eq(digestSubscription.email, testEmail.toLowerCase().trim()),
            eq(digestSubscription.verified, true)
          )
        );
      subscribers = sub ? [sub] : [];
    } else {
      subscribers = await db
        .select()
        .from(digestSubscription)
        .where(
          and(
            eq(digestSubscription.verified, true),
            eq(digestSubscription.frequency, frequency),
            sql`${digestSubscription.unsubscribedAt} IS NULL`
          )
        );
    }

    if (!subscribers.length) {
      return Response.json({
        generated: 0,
        message: testEmail
          ? "No verified subscriber found for that email."
          : "No ${frequency} subscribers needing a digest.",
      });
    }

    const cutoff = new Date(
      Date.now() - (frequency === "daily" ? 24 : 7 * 24) * 60 * 60 * 1000
    );

    const allMagazines = await db.select().from(magazine);
    const magMap = new Map(allMagazines.map((m: any) => [m.id, m]));

    const results: any[] = [];

    for (const sub of subscribers) {
      const magIds = sub.magazines || null;
      let liveArticles: any[];
      if (magIds && Array.isArray(magIds) && magIds.length > 0) {
        liveArticles = await db
          .select()
          .from(article)
          .where(
            and(
              eq(article.status, "live"),
              inArray(article.magazineId, magIds),
              gte(article.publishedAt, cutoff)
            )
          )
          .orderBy(desc(article.publishedAt))
          .limit(50);
      } else {
        liveArticles = await db
          .select()
          .from(article)
          .where(
            and(eq(article.status, "live"), gte(article.publishedAt, cutoff))
          )
          .orderBy(desc(article.publishedAt))
          .limit(50);
      }

      if (!liveArticles.length) {
        results.push({
          email: sub.email,
          generated: false,
          reason:
            "No live articles in the last " +
            (frequency === "daily" ? "24 hours" : "7 days") +
            ".",
        });
        continue;
      }

      const byMag: Record<string, any[]> = {};
      for (const a of liveArticles) {
        const mid = a.magazineId || "other";
        if (!byMag[mid]) byMag[mid] = [];
        byMag[mid].push(a);
      }

      const magazineGroups = Object.entries(byMag)
        .map(([mid, arts]) => {
          const mag = magMap.get(mid);
          return {
            id: mid,
            name: mag?.name || mid,
            articles: arts.slice(0, 10).map((a: any) => ({
              title: a.title,
              summary: a.summary,
              imageUrl: a.imageUrl,
            })),
          };
        })
        .sort((a, b) => b.articles.length - a.articles.length);

      const html = renderDigestHtml({
        magazineGroups,
        unsubscribeToken: sub.unsubscribeToken || "unknown",
        frequency,
      });

      // Attempt to send the email via SMTP
      const subject = `Anteroom Digest - ${magazineGroups.length} magazines, ${liveArticles.length} stories`;
      const emailResult = await sendEmail({ to: sub.email, subject, html });

      if (emailResult.sent) {
        await db
          .update(digestSubscription)
          .set({ lastSentAt: new Date() })
          .where(eq(digestSubscription.id, sub.id));
      }

      results.push({
        email: sub.email,
        generated: true,
        sent: emailResult.sent,
        sendReason: emailResult.reason || null,
        articleCount: liveArticles.length,
        magazineCount: magazineGroups.length,
        htmlPreviewLength: html.length,
      });
    }

    return Response.json({
      frequency,
      generated: results.filter((r: any) => r.generated).length,
      sent: results.filter((r: any) => r.sent).length,
      skipped: results.filter((r: any) => !r.generated).length,
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      results,
    });
  } catch (e: any) {
    return Response.json(
      { error: e?.message || "Digest generation failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
