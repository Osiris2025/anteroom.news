import { db } from "@/lib/db";
import { magazine as magazineTable } from "@/drizzle/schema";
import { eq, asc } from "drizzle-orm";
import ThemeRenderer from "@/components/ThemeRenderer";

/**
 * Magazine page — renders through the SAME theme engine as the homepage.
 * Loads magazine records from the DB (name/tagline/description) so admin edits
 * are honored everywhere (header, showcase, footer). DB is the source of truth
 * for customer-facing text; code defaults are only a fallback.
 */
export default async function MagazinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let dbMag: { id: string; name: string | null; tagline: string | null; description: string | null } | null = null;
  let dbMagazines: Array<{ id: string; name: string; tagline: string | null; description: string | null }> = [];
  try {
    const [rows, all] = await Promise.all([
      db.select({
        id: magazineTable.id,
        name: magazineTable.name,
        tagline: magazineTable.tagline,
        description: magazineTable.description,
      }).from(magazineTable).where(eq(magazineTable.id, id)).limit(1),
      db.select({
        id: magazineTable.id,
        name: magazineTable.name,
        tagline: magazineTable.tagline,
        description: magazineTable.description,
      }).from(magazineTable).orderBy(asc(magazineTable.name)),
    ]);
    if (rows.length) dbMag = rows[0];
    dbMagazines = all;
  } catch {
    dbMag = null;
    dbMagazines = [];
  }
  return <ThemeRenderer magazineId={id} dbMagazine={dbMag} dbMagazines={dbMagazines} />;
}
