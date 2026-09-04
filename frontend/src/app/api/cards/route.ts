import { NextRequest } from "next/server";
import { asc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { magazineCard } from "@/drizzle/schema";

// GET /api/cards?magazine=<id> — the cards attached to a magazine (enabled),
// from DATA (magazine_card table). The frontend drawer renders from this instead
// of a hardcoded map. Returns an ordered list of {cardId, position, params}.
export async function GET(req: NextRequest) {
  const magazine = req.nextUrl.searchParams.get("magazine") || "";
  try {
    const rows = magazine
      ? await db.select({
          cardId: magazineCard.cardId,
          position: magazineCard.position,
          params: magazineCard.params,
          enabled: magazineCard.enabled,
        }).from(magazineCard)
          .where(and(eq(magazineCard.magazineId, magazine), eq(magazineCard.enabled, true)))
          .orderBy(asc(magazineCard.position))
      : [];
    return Response.json({ cards: rows });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load cards" }, { status: 500 });
  }
}