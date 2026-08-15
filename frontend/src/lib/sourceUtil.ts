// Shared helpers for presenting a source URL (e.g. article "source" links)
// cleanly to the user — hiding the ugly Google News RSS redirect tokens and
// showing a recognizable publisher domain instead.

/** Strip scheme/www and trailing slash → "techcrunch.com". */
export function hostOf(url?: string | null): string {
  if (!url) return "";
  try {
    const h = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return h;
  } catch {
    return url;
  }
}

/**
 * Google News RSS item links are long redirects:
 *   https://news.google.com/rss/articles/CBMi...
 * They DO open when clicked, but look awful and aren't recognizable.
 * Given the real publisher (from the feed's source.href) or a fallback, return
 * a clean label like "TechCrunch" / "Hostinger".
 */
export function sourceLabel(url?: string | null, viaDomain?: string | null): string {
  if (viaDomain) {
    const h = viaDomain.replace(/^https?:\/\//, "").replace(/^www\./, "").toLowerCase();
    if (h.endsWith(".com") || h.endsWith(".co") || h.endsWith(".org") || h.endsWith(".io")) {
      // "techcrunch.com" → "TechCrunch"
      return h.split(".")[0].replace(/[-_]/g, " ")
        .split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return h;
  }
  if (!url) return "";
  if (url.includes("news.google.com")) return "Google News";
  const h = hostOf(url);
  if (!h) return url;
  if (h === "news.google.com") return "Google News";
  return h.split(".")[0].replace(/[-_]/g, " ")
    .split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}