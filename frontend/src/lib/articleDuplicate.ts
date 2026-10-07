import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";

/**
 * Shared helpers for any route that inserts into `article`.
 * `article.source_url` is UNIQUE, so submitting a link twice used to surface
 * a raw "Failed query: insert into article ..." error to the user.
 */

export type DuplicateInfo = {
  id: string;
  title: string;
  status: string;
  magazineName: string | null;
  url: string;
};

/** Look up an existing article by its source URL. */
export async function findDuplicate(sourceUrl: string): Promise<DuplicateInfo | null> {
  const rows = await db
    .select({
      id: article.id,
      title: article.title,
      headline: article.headline,
      status: article.status,
      magazineName: magazine.name,
    })
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.sourceUrl, sourceUrl))
    .limit(1);
  const e = rows[0];
  if (!e) return null;
  return {
    id: e.id,
    title: e.headline || e.title || "Untitled",
    status: e.status,
    magazineName: e.magazineName ?? null,
    url: `/articles/${e.id}`,
  };
}

/** Friendly 409 response for a known duplicate. */
export function duplicateJson(dup: DuplicateInfo): Response {
  const where = dup.magazineName ? ` in ${dup.magazineName}` : "";
  return Response.json(
    { error: `Already on the site: ${dup.title} (${dup.status}${where})`, duplicate: dup },
    { status: 409 }
  );
}

/** Pre-check: returns a 409 response if the URL already exists, else null. Never throws. */
export async function duplicateResponse(sourceUrl: string): Promise<Response | null> {
  try {
    const dup = await findDuplicate(sourceUrl);
    return dup ? duplicateJson(dup) : null;
  } catch (e) {
    console.error("Duplicate check failed:", e);
    return null;
  }
}

/** True when a (Drizzle-wrapped) Postgres error is a unique violation. */
export function isUniqueViolation(e: any): boolean {
  return (e?.code || e?.cause?.code) === "23505";
}

/**
 * Turn an article insert failure into a user-safe response.
 * Logs the real error; duplicates get the friendly message, anything else a generic one.
 */
export async function insertErrorResponse(e: any, sourceUrl: string | null, context: string): Promise<Response> {
  console.error(`${context} insert failed:`, e);
  if (sourceUrl && isUniqueViolation(e)) {
    const dup = await duplicateResponse(sourceUrl);
    if (dup) return dup;
    return Response.json({ error: "Already on the site: this link has been added before." }, { status: 409 });
  }
  return Response.json({ error: "Could not save the article. Please try again." }, { status: 500 });
}
