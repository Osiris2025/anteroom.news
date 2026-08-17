/**
 * GET /api/admin/pins/stale?threshold=4
 *
 * Returns active pins expiring within the threshold. Also returns already-expired pins.
 * **AUTO-CLEANS expired pins as a side effect** — deactivates expired pin records
 * AND resets article.pinned=false, article.pinKind=NULL.
 *
 * threshold = number of hours from now to consider "stale" (default 4).
 *
 * Fixes the pin/article flag inconsistency (2026-08-11):
 * When a pin expires via time (not manual unpin), the article.pinned flag
 * was never cleared. Now auto-cleanup runs on every stale-pin check.
 */

import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as any)?.role || "";
    if (!ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  let thresholdHours = parseInt(sp.get("threshold") || "4", 10);
  if (isNaN(thresholdHours) || thresholdHours < 1) thresholdHours = 4;

  const now = new Date();
  const staleThreshold = new Date(now.getTime() + thresholdHours * 60 * 60 * 1000);

  try {
    // ---- SIDE EFFECT: Auto-cleanup expired pins ----
    // Deactivate expired pins AND clear article pinned flags.
    // This fixes the pin/article flag inconsistency.
    await db.execute(sql`
      UPDATE "article"
      SET pinned = false, pin_kind = NULL, updated_at = NOW()
      WHERE pinned = true
      AND id IN (
        SELECT article_id FROM "pin"
        WHERE active = true AND expires_at < NOW()
      )
    `);
    await db.execute(sql`
      UPDATE "pin"
      SET active = false, updated_at = NOW()
      WHERE active = true AND expires_at < NOW()
    `);

    // ---- Fetch remaining active pins ----
    const rows = await db.execute(sql`
      SELECT
        p.id AS pin_id,
        p.kind AS pin_kind,
        p.run_for AS pin_run_for,
        p.expires_at AS pin_expires_at,
        p.pinned_at AS pin_pinned_at,
        a.id AS article_id,
        a.title AS article_title,
        a.headline AS article_headline,
        a.source_url AS article_source_url,
        m.id AS magazine_id,
        m.name AS magazine_name
      FROM "pin" p
      LEFT JOIN "article" a ON p.article_id = a.id
      LEFT JOIN "magazine" m ON a.magazine_id = m.id
      WHERE p.active = true
    `);

    const stalePins = (rows || []).filter((r: any) => {
      if (!r.pin_expires_at) return false;
      return new Date(r.pin_expires_at) <= staleThreshold;
    });

    const expired = stalePins.filter((p: any) => new Date(p.pin_expires_at!) <= now);
    const expiringSoon = stalePins.filter((p: any) => new Date(p.pin_expires_at!) > now);

    const mapPin = (p: any) => ({
      id: p.pin_id,
      kind: p.pin_kind,
      runFor: p.pin_run_for,
      pinnedAt: p.pin_pinned_at,
      expiresAt: p.pin_expires_at,
      article: {
        id: p.article_id,
        title: p.article_title,
        headline: p.article_headline,
        sourceUrl: p.article_source_url,
      },
      magazine: {
        id: p.magazine_id,
        name: p.magazine_name,
      },
    });

    return Response.json({
      stale: stalePins.length,
      expiredCount: expired.length,
      expiringSoonCount: expiringSoon.length,
      thresholdHours,
      autoCleaned: true,
      expired: expired.map(mapPin),
      expiringSoon: expiringSoon.map((p: any) => ({
        ...mapPin(p),
        hoursRemaining: Math.round((new Date(p.pin_expires_at!).getTime() - now.getTime()) / (1000 * 60 * 60)),
      })),
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to check stale pins" }, { status: 500 });
  }
}

/** POST handler — allows manual trigger. */
export async function POST(req: NextRequest) {
  return GET(req);
}