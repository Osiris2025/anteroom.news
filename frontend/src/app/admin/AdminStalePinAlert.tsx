"use client";
import { useEffect, useState, useCallback } from "react";

type StalePinArticle = {
  id: string;
  title: string;
  headline: string | null;
  sourceUrl: string | null;
};

type StalePinMagazine = {
  id: string;
  name: string;
};

type ExpiredPin = {
  id: string;
  kind: string;
  expiresAt: string | null;
  article: StalePinArticle | null;
  magazine: StalePinMagazine | null;
};

type ExpiringPin = {
  id: string;
  kind: string;
  expiresAt: string | null;
  hoursRemaining: number;
  article: StalePinArticle | null;
  magazine: StalePinMagazine | null;
};

type StaleResp = {
  stale: number;
  expiredCount: number;
  expiringSoonCount: number;
  thresholdHours: number;
  expired: ExpiredPin[];
  expiringSoon: ExpiringPin[];
};

const bannerBase: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  marginBottom: 16,
  fontSize: 13,
  lineHeight: 1.5,
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
};

const kindColors: Record<string, string> = {
  FLASH: "#ff4444",
  IMPORTANT: "#ff8800",
};

/**
 * Proactive stale-pin alert banner (DM-style reminder).
 *
 * Checks /api/admin/pins/stale every time the admin page loads,
 * and shows a dismissible banner about pins approaching expiry.
 * This fulfills the Intake-Architecture requirement:
 * "DM-style reminder system tells admin that pinned items are getting stale/about to expire."
 */
export default function AdminStalePinAlert() {
  const [data, setData] = useState<StaleResp | null>(null);
  const [err, setErr] = useState("");
  const [dismissed, setDismissed] = useState(false);

  // Dismiss persists for the session (in memory — repopulates on page refresh)
  const check = useCallback(() => {
    fetch("/api/admin/pins/stale?threshold=4")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) {
          setErr(j.error);
          return;
        }
        setData(j);
        // If no stale pins, mark as dismissed
        if (j.stale === 0) setDismissed(true);
      })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(check, [check]);

  const handleDismiss = () => setDismissed(true);

  if (dismissed || !data || data.stale === 0) return null;

  const totalUrgent = data.expiringSoonCount + data.expiredCount;

  return (
    <>
      {err && (
        <div style={{ ...bannerBase, background: "#3a0a0a", border: "1px solid rgba(248,113,113,.3)", color: "#f87171" }}>
          <span>⚠️</span>
          <span>Stale-pin check failed: {err}</span>
        </div>
      )}

      {data.expiredCount > 0 && (
        <div style={{ ...bannerBase, background: "#3a0a0a", border: "1px solid rgba(248,113,113,.5)", color: "#f87171" }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>⏰</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {data.expiredCount} expired pin{data.expiredCount !== 1 ? "s" : ""} — still showing as hero!
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, opacity: 0.9 }}>
              {data.expired.map((p) => (
                <li key={p.id}>
                  <span style={{ color: kindColors[p.kind] || "#666", fontWeight: 700, marginRight: 6 }}>{p.kind}</span>
                  {p.article?.headline || p.article?.title || "Unknown article"}
                  {" — "}
                  <span style={{ opacity: 0.6 }}>{p.magazine?.name || "?"}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
              💡 Visit the Pins tab to unpin expired items.
            </div>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: "transparent", border: "none", color: "#f87171",
              cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px",
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {data.expiringSoonCount > 0 && (
        <div style={{ ...bannerBase, background: "#2a1f00", border: "1px solid rgba(255,215,0,.4)", color: "#ffd700" }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>⏳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {data.expiringSoonCount} pin{data.expiringSoonCount !== 1 ? "s" : ""} expiring within {data.thresholdHours}h
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, opacity: 0.9 }}>
              {data.expiringSoon.map((p) => (
                <li key={p.id}>
                  <span style={{ color: kindColors[p.kind] || "#666", fontWeight: 700, marginRight: 6 }}>{p.kind}</span>
                  {p.article?.headline || p.article?.title || "Unknown article"}
                  {" — "}
                  <span style={{ opacity: 0.6 }}>{p.hoursRemaining}h remaining</span>
                  {" · "}
                  <span style={{ opacity: 0.6 }}>{p.magazine?.name || "?"}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
              💡 Plan ahead — renew or replace before they expire.
            </div>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: "transparent", border: "none", color: "#ffd700",
              cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px",
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {!err && totalUrgent > 0 && (
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: -8, marginBottom: 14, textAlign: "right" }}>
          Last checked: {new Date().toLocaleTimeString()} ·{" "}
          <button
            onClick={() => { setDismissed(false); check(); }}
            style={{ background: "transparent", border: "none", color: "var(--accent,#ffd700)", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}
          >
            Refresh
          </button>
        </div>
      )}
    </>
  );
}
