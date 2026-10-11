// Magazine subcategories: display labels and server-side (re)tagging.
// Slugs + keywords live in the magazine_taxonomy table (also used by the engine);
// labels/descriptions live in subcategories.json (shared with the engine).
import META from "./subcategories.json";

type SubMeta = { label?: string; description?: string };
const M: any = META;

/** Human label for a subcategory slug ("chips-hardware" -> "Chips, Hardware & Data Centers"). */
export function subcatLabel(slug: string | null | undefined, magazineId?: string | null): string {
  if (!slug) return "";
  const perMag: SubMeta | undefined = magazineId ? M.magazines?.[magazineId]?.[slug] : undefined;
  if (perMag?.label) return perMag.label;
  if (M.labels?.[slug]) return M.labels[slug];
  for (const mag of Object.values(M.magazines || {}) as Record<string, SubMeta>[]) {
    if (mag[slug]?.label) return mag[slug].label as string;
  }
  return slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function subcatDescription(magazineId: string, slug: string): string | null {
  return M.magazines?.[magazineId]?.[slug]?.description || null;
}
