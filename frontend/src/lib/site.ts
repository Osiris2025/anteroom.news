// Single source of truth for the public site origin (no trailing slash).
//
// The platform is deployment-agnostic: nothing outside this file should ever
// hardcode a hostname. Set the values in the compose env (or .env) and the
// whole app - share links, bookmarklets, digest emails, OpenRouter referers,
// auth trusted origins, sitemap/robots - follows.
//
//   NEXT_PUBLIC_SITE_URL  - inlined into the browser bundle at build time.
//                           REQUIRED for client components (share buttons,
//                           /collect bookmarklet). Rebuild after changing it.
//   SITE_BASE_URL         - server-side runtime override (no rebuild needed).
//   Defaults to https://anteroom.news only so a bare `next build` still works.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_BASE_URL ||
  "https://anteroom.news"
).replace(/\/+$/, "");

/** Hostname without scheme, for display in instructions and emails. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/** Join a path onto the public origin. */
export function siteUrl(path = ""): string {
  if (!path) return SITE_URL;
  return SITE_URL + (path.startsWith("/") ? path : "/" + path);
}
