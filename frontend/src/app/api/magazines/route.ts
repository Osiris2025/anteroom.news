import { NextRequest } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { magazine } from "@/drizzle/schema";

// GET /api/magazines — public list of magazines with the ADMIN-EDITABLE fields
// (name, tagline, description) so the frontend can render the DB versions
// everywhere. The DB is the source of truth for customer-facing text; the code
// MAGAZINES array in themes.ts only supplies theme/accent/color/fallbacks.
export async function GET(_req: NextRequest) {
  try {
    const rows = await db.select({
      id: magazine.id,
      name: magazine.name,
      tagline: magazine.tagline,
      description: magazine.description,
    }).from(magazine).orderBy(asc(magazine.name));
    return Response.json({ magazines: rows });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load magazines" }, { status: 500 });
  }
}
