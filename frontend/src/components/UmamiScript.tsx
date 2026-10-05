import Script from "next/script";

/**
 * Privacy-friendly Umami page analytics (cookieless by default).
 * Honors browser Do Not Track via data-do-not-track.
 * Self-hosted at stats.anteroom.news (homelab); does not replace TrackPageView.
 */
const WEBSITE_ID = "6dc90540-4556-45fb-868e-167d157b426b";
const SCRIPT_SRC = "https://stats.anteroom.news/script.js";

export default function UmamiScript() {
  return (
    <Script
      defer
      src={SCRIPT_SRC}
      data-website-id={WEBSITE_ID}
      data-do-not-track="true"
      strategy="afterInteractive"
    />
  );
}
