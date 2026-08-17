/**
 * POST /api/admin/pins/cleanup
 *
 * Cleans up expired pins and resets orphaned article pinned flags.
 *
 * Uses raw SQL to avoid Drizzle schema version mismatch — the
 * `pinned` and `pin_kind` columns were added via migration.
 */

import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["superadmin", "admin"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const role = (session?.user as any)?.role || "";
    if (!ADMIN_ROLES.includes(role)) {
      return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    // Step 1: Deactivate expired pins
    const deactivated = await db.execute(sql`
      UPDATE "pin"
      SET active = false, updated_at = NOW()
      WHERE active = true AND expires_at < NOW()
      RETURNING id, kind, article_id, expires_at
    `);
    const cleaned = deactivated?.length || 0;

    // Step 2: Clear article pinned flags for articles whose pin just expired
    // (Uses a subquery to find all articles linked to expired pins)
    if (cleaned > 0) {
      await db.execute(sql`
        UPDATE "article"
        SET pinned = false, pin_kind = NULL, updated_at = NOW()
        WHERE pinned = true
        AND id IN (
          SELECT article_id FROM "pin"
          WHERE active = false AND expires_at < NOW()
        )
      `);
    }

    // Step 3: Clean any orphaned flags (pinned=true but no active pin exists)
    const orphaned = await db.execute(sql`
      UPDATE "article"
      SET pinned = false, pin_kind = NULL, updated_at = NOW()
      WHERE pinned = true
      AND id NOT IN (SELECT article_id FROM "pin" WHERE active = true)
      RETURNING id
    `);
    const orphanedCount = orphaned?.length || 0;

    // Step 4: Count remaining active pins
    const activePins = await db.execute(sql`
      SELECT COUNT(*)::int as count FROM "pin" WHERE active = true
    `);
    const activeRemaining = Number(activePins?.[0]?.count || 0);

    return Response.json({
      cleaned,
      orphanedCleaned: orphanedCount,
      message: cleaned > 0
        ? `Cleaned ${cleaned} expired pin(s). ${orphanedCount} orphaned article flag(s) reset.`
        : orphanedCount > 0
          ? `No expired pins, but fixed ${orphanedCount} orphaned article flag(s).`
          : "No expired pins or orphaned flags to clean up.",
      details: (deactivated || []).map((r: any) => ({
        id: r.id,
        kind: r.kind,
        articleId: r.article_id,
        expiredAt: r.expires_at,
      })),
      activeRemaining,
    });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to clean up expired pins" }, { status: 500 });
  }
}

/** GET handler — same as POST (convenience for curl/API calls). */
export async function GET(req: NextRequest) {
  return POST(req);
}