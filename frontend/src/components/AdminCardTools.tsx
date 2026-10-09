"use client";
import { useEffect, useState } from "react";
import { DELETION_REASONS, deletionReasonLabel } from "@/lib/deletionReasons";

type Props = {
  articleId: string;
  currentMag: string;
  currentSubcat?: string | null;
  featured?: boolean;
  pinned?: boolean;
  socialRepeat?: boolean;
  magazines: { id: string; name: string }[];
  subcats: string[];
  onChanged: () => void; // reload cards after an admin action
  pal?: { box: string; border: string; ink: string; body: string; accent: string }; // optional theme colours
  // Called with the new summary after "↻ Summary" (or its Undo) so the page can
  // show it in place. When omitted, onChanged() is used to reload the cards.
  onSummary?: (summary: string | null) => void;
};

// Inline editorial toolbar — revealed on hover of the LOWER EDGE of an article
// card in the regular magazine view (admin only). Mirrors the Dispatch queue's
// tools: approve/reject/draft, move magazine, move subcategory, regenerate
// commentary, pin. Reuses the same admin article/generate-commentary endpoints.
export default function AdminCardTools({ articleId, currentMag, currentSubcat, featured, pinned, socialRepeat: socialRepeatProp, magazines, subcats, onChanged, pal, onSummary }: Props) {
  const [mag, setMag] = useState(currentMag || "");
  const [subcat, setSubcat] = useState(currentSubcat || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [editMag, setEditMag] = useState(false);
  const [editSub, setEditSub] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delReason, setDelReason] = useState("other");
  const [social, setSocial] = useState(!!socialRepeatProp);
  const [summarizing, setSummarizing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const bt = (bg: string, fg: string, fs: number) =>
    pal && bg === "#202020"
      ? { ...btn("transparent", pal.ink, fs), border: `1px solid ${pal.border}` }
      : btn(bg, fg, fs);
  const sl = () => (pal ? { ...sel(), background: pal.box, color: pal.ink, border: `1px solid ${pal.border}` } : sel());

  const flash = (m: string, ms = 2200) => { setMsg(m); setTimeout(() => setMsg(""), ms); };

  // Re-write the summary with AI (or undo the last re-write). Admin-only route.
  async function resummarize(undo = false) {
    if (summarizing || busy) return;
    setSummarizing(true); setBusy(true); setMsg(undo ? "↶ restoring old summary…" : "✎ writing a new summary…");
    try {
      const r = await fetch("/api/admin/resummarize", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId, undo }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { flash("✕ " + (j.error || "failed"), 6000); return; }
      setCanUndo(!undo);
      if (undo) flash("↶ old summary restored");
      else flash(j.usedSource === "page" ? "✓ new summary written" : "✓ new summary (source site blocked reading; rewrote the old one)", j.usedSource === "page" ? 3000 : 6000);
      if (onSummary) onSummary(j.summary ?? null); else onChanged();
    } catch { flash("✕ network error"); }
    finally { setSummarizing(false); setBusy(false); }
  }

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

  async function delArticle(): Promise<boolean> {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/article/${articleId}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: delReason }),
      });
      const j = await r.json();
      if (!r.ok) { flash("✕ " + (j.error || "failed")); return false; }
      flash("🗑 deleted (" + deletionReasonLabel(delReason) + ")");
      return true;
    } catch { flash("✕ network error"); return false; }
    finally { setBusy(false); }
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
      style={bt(bg, fg, 10)}>{label}</button>
  );

  return (
    <div style={{ padding: "8px 10px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {statusBtn("✓ Approve", "approved", "#00331f", "#34d399")}
      {statusBtn("↥ Publish", "live", "#0b1f33", "#58a6ff")}
      {statusBtn("✕ Reject", "rejected", "#3a0d0d", "#f57b7b")}
      <button onClick={() => act(() => patch({ status: "draft" }))} disabled={busy} style={bt("#202020", "#ccc", 10)}>↩ Draft</button>
      <button onClick={() => act(async () => { const ok = await patch({ socialRepeat: !social }); if (ok) setSocial(!social); return ok; })} disabled={busy} style={bt(social ? "#0b1f33" : "#202020", social ? "#58a6ff" : "#ccc", 10)}> {social ? "\u21bb Social \u2713" : "\u21bb Social"} </button>

      {/* Delete — ask WHY (drives troublesome-source stats). */}
      {!delOpen ? (
        <button onClick={() => setDelOpen(true)} disabled={busy} style={bt("#3a0d0d", "#f87171", 10)}>🗑 Del</button>
      ) : (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <select value={delReason} onChange={(e) => setDelReason(e.target.value)} autoFocus style={sl()}>
            {DELETION_REASONS.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
          <button onClick={() => act(delArticle)} disabled={busy} style={bt("#7f1d1d", "#fff", 10)}>Confirm</button>
          <button onClick={() => setDelOpen(false)} disabled={busy} style={bt("#202020", "#aaa", 10)}>✕</button>
        </span>
      )}

      {/* Star = flagship feature */}
      <button onClick={() => act(() => patch({ featured: !featured }))} disabled={busy}
        style={bt(featured ? "#3b2f00" : "#202020", featured ? "#ffd700" : "#ccc", 10)}>
        {featured ? "★ Starred" : "☆ Star"}
      </button>

      {/* Pin = FLASH/hero article */}
      <button onClick={() => act(pinArticle)} disabled={busy}
        style={bt(pinned ? "#3a0d0d" : "#202020", pinned ? "#ff4444" : "#ccc", 10)}>
        📌 {pinned ? "Pinned" : "Pin"}
      </button>

      {/* Move magazine */}
      {editMag ? (
        <select value={mag} onChange={(e) => { setMag(e.target.value); act(() => patch({ magazineId: e.target.value || null })); setEditMag(false); }}
          autoFocus style={sl()}>
          <option value="">— move to —</option>
          {magazines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      ) : (
        <button onClick={() => setEditMag(true)} disabled={busy} style={bt("#202020", "#ccc", 10)}>⇄ Mag</button>
      )}

      {/* Move subcategory */}
      {editSub ? (
        <select value={subcat} onChange={(e) => { setSubcat(e.target.value); act(() => patch({ subcategory: e.target.value || null })); setEditSub(false); }}
          autoFocus style={sl()}>
          <option value="">— subcategory —</option>
          {subcats.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ) : (
        <button onClick={() => setEditSub(true)} disabled={busy} style={bt("#202020", "#ccc", 10)}># Subcat</button>
      )}

      {/* Regenerate commentary */}
      <button onClick={() => act(async () => {
        const r = await fetch("/api/admin/generate-commentary", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId }),
        });
        const j = await r.json();
        if (!r.ok) { flash("✕ " + (j.error || "failed")); return false; }
        flash("↻ commentary regenerated"); return true;
      })} disabled={busy} style={bt("#202020", "#ccc", 10)}>↻ Commentary</button>

      {/* Re-summarize: AI re-reads the source and writes a fresh summary */}
      <button onClick={() => resummarize(false)} disabled={busy} title="Have the AI re-read the article and write a fresh summary"
        style={{ ...bt("#202020", "#ccc", 10), opacity: summarizing ? 0.7 : 1, cursor: summarizing ? "progress" : "pointer" }}>
        {summarizing ? "… Summarizing" : "↻ Summary"}
      </button>
      {canUndo && !summarizing && (
        <button onClick={() => resummarize(true)} disabled={busy} title="Put the previous summary back" style={bt("#202020", "#ccc", 10)}>↶ Undo summary</button>
      )}

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