"use client";
import { useEffect } from "react";

/**
 * Invisible component that fires a page-view beacon once on mount.
 * Captures UTM params from URL, referrer, and user agent.
 * Place once in the root layout — no effect on subsequent client-side navigation.
 */
export default function TrackPageView() {
  useEffect(() => {
    // Only track actual page loads, not hash changes
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const payload: Record<string, string | undefined> = {
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || undefined,
    };

    // Capture UTM params
    const utm = params.get("utm_source");
    if (utm) payload.utmSource = utm;
    const utmMedium = params.get("utm_medium");
    if (utmMedium) payload.utmMedium = utmMedium;
    const utmCampaign = params.get("utm_campaign");
    if (utmCampaign) payload.utmCampaign = utmCampaign;
    const utmContent = params.get("utm_content");
    if (utmContent) payload.utmContent = utmContent;

    // Fire-and-forget — no retry on failure
    fetch("/api/track/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silently ignore tracking errors
    });
  }, []);

  return null;
}