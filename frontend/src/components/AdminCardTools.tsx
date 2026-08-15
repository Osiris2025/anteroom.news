"use client";
import { useEffect, useState } from "react";

type Props = {
  articleId: string;
  currentMag: string;
  currentSubcat?: string | null;
  featured?: boolean;
  pinned?: boolean;
  magazines: { id: string; name: string }[];
  subcats: string[];
  onChanged: () => void; // reload cards after an admin action
};

// Inline editorial toolbar — revealed on hover of the LOWER EDGE of an article
// card in the regular magazine view (admin only). Mirrors the Dispatch queue's
// tools: approve/reject/draft, move magazine, move subcategory, regenerate
// commentary, pin. Reuses the same admin article/generate-commentary endpoints.
export default function AdminCardTools({ articleId, currentMag, currentSubcat, featured, pinned, magazines, subcats, onChanged }: Props) {
  const [mag, setMag] = useState(currentMag || "");
  const [subcat, setSubcat] = useState(currentSubcat || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [editMag, setEditMag] = useState(false);
  const [editSub, setEditSub] = useState(false);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2200); };

  async function patch(body: any) {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/article/${articleId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) { flash("✕ " + (j.error || "failed")); return false; }
      return true;
    } catch { flash("✕ network error"); return false; }
    finally { setBusy(false); }
  }

  async function act(fn: () => Promise<boolean>) {
    if (await fn()) { onChanged(); }
  }

  // Pin via the same endpoint the Dispatch queue uses (POST /api/admin/pins).
  async function pinArticle(): Promise<boolean> {
    const kind = window.prompt("Pin kind (FLASH / IMPORTANT):", "FLASH");
    if (!kind) return false;
    const runFor = window.prompt("Duration (24h / 7d / empty for indefinite):", "24h");
    if (runFor === null) return false;
    try {
      const r = await fetch("/api/admin/pins", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: articleId, kind, run_for: runFor }),
      });
      const j = await r.json();
      if (!r.ok) { flash("✕ " + (j.error || "failed")); return false; }
      flash("📌 pinned as " + kind); return true;
    } catch { flash("✕ network error"); return false; }
  }

  const statusBtn = (label: string, status: string, bg: string, fg: string) => (
    <button onClick={() => act(() => patch({ status }))} disabled={busy}
      style={btn(bg, fg, 10)}>{label}</button>
  );

  return (
    <div style={{ padding: "8px 10px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {statusBtn("✓ Approve", "approved", "#00331f", "#34d399")}
      {statusBtn("↥ Publish", "live", "#0b1f33", "#58a6ff")}
      {statusBtn("✕ Reject", "rejected", "#3a0d0d", "#f57b7b")}
      <button onClick={() => act(() => patch({ status: "draft" }))} disabled={busy} style={btn("#202020", "#ccc", 10)}>↩ Draft</button>

      {/* Star = flagship feature */}
      <button onClick={() => act(() => patch({ featured: !featured }))} disabled={busy}
        style={btn(featured ? "#3b2f00" : "#202020", featured ? "#ffd700" : "#ccc", 10)}>
        {featured ? "★ Starred" : "☆ Star"}
      </button>

      {/* Pin = FLASH/hero article */}
      <button onClick={() => act(pinArticle)} disabled={busy}
        style={btn(pinned ? "#3a0d0d" : "#202020", pinned ? "#ff4444" : "#ccc", 10)}>
        📌 {pinned ? "Pinned" : "Pin"}
      </button>

      {/* Move magazine */}
      {editMag ? (
        <select value={mag} onChange={(e) => { setMag(e.target.value); act(() => patch({ magazineId: e.target.value || null })); setEditMag(false); }}
          autoFocus style={sel()}>
          <option value="">— move to —</option>
          {magazines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      ) : (
        <button onClick={() => setEditMag(true)} disabled={busy} style={btn("#202020", "#ccc", 10)}>⇄ Mag</button>
      )}

      {/* Move subcategory */}
      {editSub ? (
        <select value={subcat} onChange={(e) => { setSubcat(e.target.value); act(() => patch({ subcategory: e.target.value || null })); setEditSub(false); }}
          autoFocus style={sel()}>
          <option value="">— subcategory —</option>
          {subcats.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ) : (
        <button onClick={() => setEditSub(true)} disabled={busy} style={btn("#202020", "#ccc", 10)}># Subcat</button>
      )}

      {/* Regenerate commentary */}
      <button onClick={() => act(async () => {
        const r = await fetch("/api/admin/generate-commentary", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId }),
        });
        const j = await r.json();
        if (!r.ok) { flash("✕ " + (j.error || "failed")); return false; }
        flash("↻ commentary regenerated"); return true;
      })} disabled={busy} style={btn("#202020", "#ccc", 10)}>↻ Commentary</button>

      {msg && <span style={{ fontSize: 11, color: "var(--accent,#ffd700)" }}>{msg}</span>}
    </div>
  );
}

const btn = (bg: string, fg: string, fs: number) => ({
  background: bg, color: fg, border: "1px solid rgba(150,150,150,.25)", borderRadius: 6,
  fontSize: fs, fontWeight: 600, padding: "4px 8px", cursor: "pointer", lineHeight: 1.2,
});
const sel = () => ({
  background: "#141414", color: "#eee", border: "1px solid rgba(150,150,150,.4)", borderRadius: 6,
  fontSize: 11, padding: "4px 6px",
});