import { NextRequest } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { magazine } from "@/drizzle/schema";

// GET /api/magazines — public list of magazines. Returns the ADMIN-EDITABLE
// identity fields so the frontend can render the DB versions everywhere. The DB
// is the source of truth for customer-facing text AND (stage 2) identity
// (realm/theme/accent/tags). The code MAGAZINES array in themes.ts remains only
// as a fallback until renderers are switched to read from data.
export async function GET(_req: NextRequest) {
  try {
    const rows = await db.select({
      id: magazine.id,
      name: magazine.name,
      tagline: magazine.tagline,
      description: magazine.description,
      realm: magazine.realm,
      theme: magazine.theme,
      accent: magazine.accent,
      accent2: magazine.accent2,
      tags: magazine.tags,
    }).from(magazine).orderBy(asc(magazine.name));
    return Response.json({ magazines: rows });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load magazines" }, { status: 500 });
  }
}