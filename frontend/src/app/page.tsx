import { db } from "@/lib/db";
import { magazine as magazineTable } from "@/drizzle/schema";
import { asc } from "drizzle-orm";
import ThemeRenderer from "@/components/ThemeRenderer";

// The homepage reads magazines from the DB (admin source of truth), so it must
// render on each request — NOT be statically cached at build time (when the DB
// isn't available, which would freeze the hardcoded fallback taglines).
export const dynamic = "force-dynamic";

/**
 * Homepage — the shared semantic template body for the active theme.
 * Loads the magazine list from the DB so taglines/names/descriptions render the
 * ADMIN-EDITABLE values (DB is source of truth), not the hardcoded code defaults.
 */
export default async function Home() {
  let dbMagazines: Array<{ id: string; name: string; tagline: string | null; description: string | null }> = [];
  try {
    dbMagazines = await db.select({
      id: magazineTable.id,
      name: magazineTable.name,
      tagline: magazineTable.tagline,
      description: magazineTable.description,
    }).from(magazineTable).orderBy(asc(magazineTable.name));
  } catch {
    dbMagazines = [];
  }
  return <ThemeRenderer dbMagazines={dbMagazines} />;
}
