"use client";
import { useEffect, useState } from "react";

type PinRow = {
  id: string;
  kind: string;
  runFor: string | null;
  expiresAt: string | null;
  pinnedAt: string;
  article: { id: string; title: string; headline: string | null; status: string; publishedAt: string | null };
  magazine: { id: string; name: string } | null;
};

const btn: React.CSSProperties = { padding: "5px 9px", borderRadius: 6, border: "1px solid rgba(150,150,150,.25)", background: "#1a1d21", color: "#ccc", fontSize: 12, cursor: "pointer" };

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

/**
 * AdminPins — Manage active pins. Shows all pins with remaining hours,
 * with urgency coloring for pins approaching expiry (stale-pin awareness).
 */
export default function AdminPins() {
  const [pins, setPins] = useState<PinRow[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch("/api/admin/pins")
      .then((r) => r.json())
      .then((j) => { if (j.error) setErr(j.error); else setPins(j.pins || []); })
      .catch((e) => setErr(e.message));
  };
  useEffect(load, []);

  const unpin = async (id: string) => {
    const r = await fetch(`/api/admin/pins/${id}`, { method: "PATCH" });
    const j = await r.json();
    if (j.error) setErr(j.error);
    else { setMsg("Unpinned ✓"); load(); setTimeout(() => setMsg(""), 2000); }
  };

  const kindColors: Record<string, string> = {
    FLASH: "#ff4444",
    IMPORTANT: "#ff8800",
  };

  // Determine urgency level based on expiry time
  const getUrgency = (expiresAt: string | null): { bg: string; border: string; label: string } | null => {
    if (!expiresAt) return null; // indefinite
    const now = Date.now();
    const exp = new Date(expiresAt).getTime();
    const hoursLeft = (exp - now) / (1000 * 60 * 60);

    if (hoursLeft <= 0) return { bg: "#3a0a0a", border: "rgba(248,113,113,.6)", label: "Expired!" };
    if (hoursLeft <= 1) return { bg: "#3a0a0a", border: "rgba(248,113,113,.4)", label: `${Math.round(hoursLeft * 60)}m left` };
    if (hoursLeft <= 4) return { bg: "#2a1f00", border: "rgba(255,215,0,.4)", label: `${Math.round(hoursLeft)}h left` };
    return null; // not urgent
  };

  return (
    <div>
      {err && <div style={{ background: "#3a0a0a", color: "#f87171", padding: 10, borderRadius: 6, marginBottom: 14 }}>{err}</div>}
      {msg && <div style={{ background: "#00331f", color: "#34d399", padding: 10, borderRadius: 6, marginBottom: 14 }}>{msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.65 }}>
          {pins.length} active pin{pins.length !== 1 ? "s" : ""} — pinned articles appear as hero/FLASH sections above the feed.
          {pins.filter((p) => !p.expiresAt).length > 0 && (
            <span style={{ marginLeft: 8, color: "#58a6ff" }}>
              ({pins.filter((p) => !p.expiresAt).length} indefinite — no auto-expiry)
            </span>
          )}
        </div>
      </div>

      {pins.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📌</div>
          <div>No active pins. Pin an article from the Inbox tab.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pins.map((p) => {
            const expiresIn = p.expiresAt ? Math.round((new Date(p.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)) : null;
            const urgency = getUrgency(p.expiresAt);

            return (
              <div
                key={p.id}
                style={{
                  border: `1px solid ${urgency?.border || "rgba(150,150,150,.15)"}`,
                  borderRadius: 10, padding: 12,
                  background: urgency?.bg || "var(--card-bg, rgba(255,255,255,.03))",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <span style={{ background: kindColors[p.kind] || "#666", color: "#fff", padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: 10, letterSpacing: 1 }}>{p.kind}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{p.article.headline || p.article.title}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    {p.magazine?.name || "Unassigned"} · Pinned {fmtDate(p.pinnedAt)}
                    {p.expiresAt
                      ? ` · Expires ${fmtDate(p.expiresAt)} (${expiresIn}h remaining)`
                      : " · Never expires"}
                    {urgency && (
                      <span style={{
                        marginLeft: 8, fontWeight: 700,
                        color: urgency.label === "Expired!" ? "#f87171" : "#ffd700",
                      }}>
                        ⚠ {urgency.label}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 10, opacity: 0.4 }}>{p.runFor || "∞"}</div>
                <button onClick={() => unpin(p.id)} style={{ ...btn, color: "#f87171", borderColor: "rgba(248,113,113,.4)" }}>Unpin</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
