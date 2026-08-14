import { db } from "@/lib/db";
import { magazine as magazineTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import ThemeRenderer from "@/components/ThemeRenderer";

/**
 * Magazine page — renders through the SAME theme engine as the homepage.
 * Loads the magazine record from the DB (name/tagline/description) so admin
 * edits are honored, falling back to the code defaults in ThemeRenderer when
 * the DB has no values. DB is the source of truth for customer-facing text.
 */
export default async function MagazinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let dbMag: { id: string; name: string | null; tagline: string | null; description: string | null } | null = null;
  try {
    const rows = await db.select({
      id: magazineTable.id,
      name: magazineTable.name,
      tagline: magazineTable.tagline,
      description: magazineTable.description,
    }).from(magazineTable).where(eq(magazineTable.id, id)).limit(1);
    if (rows.length) dbMag = rows[0];
  } catch {
    // DB read failed — fall through to code defaults so the page still renders.
    dbMag = null;
  }
  return <ThemeRenderer magazineId={id} dbMagazine={dbMag} />;
}
