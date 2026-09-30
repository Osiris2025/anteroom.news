// Single source of truth for the public site origin (no trailing slash).
// Override with SITE_BASE_URL (server-side env); defaults to production.
export const SITE_URL = (process.env.SITE_BASE_URL || "https://anteroom.news").replace(/\/+$/, "");
