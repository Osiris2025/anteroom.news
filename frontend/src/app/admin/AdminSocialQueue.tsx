"use client";
import { useEffect, useState } from "react";

// Social Queue tab — what the social publisher has queued, posted, or failed.
// Consumes /api/admin/social-queue (GET, POST actions, DELETE). DB is the
// source of truth: publisher writes social_post rows, this page reads them.

type PostRow = {
  id: string;
  articleId: string;
  title: string | null;
  magazine: string | null;
  platform: string;
  status: string;
  scheduledAt: string | null;
  postUrl: string | null;
  postedAt: string | null;
  metrics: { likes?: number; reposts?: number; replies?: number; quotes?: number; fetched_at?: string } | null;
  error: string | null;
};

type Data = {
  queued: PostRow[];
  posted: PostRow[];
  failed: PostRow[];
  summary: { queued: number; posted: number; failed: number };
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

const box: React.CSSProperties = {
  padding: 16, background: "#13161a", borderRadius: 10,
  border: "1px solid rgba(150,150,150,.2)", marginBottom: 16,
};
const btn: React.CSSProperties = {
  padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(150,150,150,.35)",
  background: "#1b1f26", color: "#ccc", fontSize: 11, cursor: "pointer",
  textTransform: "uppercase", letterSpacing: 1, fontWeight: 700,
};
const btnAccent: React.CSSProperties = {
  ...btn, border: "1px solid var(--accent,#ffd700)", color: "var(--accent,#ffd700)",
  background: "rgba(255,215,0,.12)",
};
const btnDanger: React.CSSProperties = {
  ...btn, border: "1px solid #ff6b6b", color: "#ff6b6b", background: "rgba(255,107,107,.12)",
};

function Metrics({ m }: { m: PostRow["metrics"] }) {
  if (!m || (m.likes == null && m.reposts == null && m.replies == null)) {
    return <span style={{ opacity: 0.5 }}>no metrics</span>;
  }
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }} title={m.fetched_at ? `fetched ${new Date(m.fetched_at).toLocaleString()}` : undefined}>
      ♥ {m.likes ?? 0} &nbsp; 🔁 {m.reposts ?? 0} &nbsp; 💬 {m.replies ?? 0}
    </span>
  );
}

function SectionHeader({ label, count, extra }: { label: string; count: number; extra?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <div style={{ fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", fontSize: 13 }}>
        {label} <span style={{ opacity: 0.6 }}>({count})</span>
      </div>
      {extra}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "8px 0", borderTop: "1px solid rgba(150,150,150,.12)", fontSize: 13,
};
const flex1: React.CSSProperties = { flex: 1, minWidth: 0 };
const titleStyle: React.CSSProperties = {
  fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};
const metaStyle: React.CSSProperties = { opacity: 0.6, fontSize: 11, marginTop: 2 };

type PreviewTarget = { id: string; title: string; magazine: string | null };
type FullArticle = {
  id: string; title: string; imageUrl?: string | null; summary?: string | null;
  commentary?: string | null; sourceUrl?: string | null;
  magazine?: { id: string; name: string } | null;
};

// PreviewModal — large centered article preview for social queue rows. Fetches the
// full article on open (queue rows only carry id+title). Esc / backdrop / ✕ close.
function SocialPreviewModal({ target, onClose }: { target: PreviewTarget; onClose: () => void }) {
  const [art, setArt] = useState<FullArticle | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pull a wide slice and find the exact article by id (public endpoint, live only).
        const r = await fetch(`/api/articles?limit=200`);
        const j = await r.json();
        const found: FullArticle | undefined = (j.articles || []).find((x: any) => x.id === target.id);
        if (!cancelled) {
          if (found) setArt(found);
          else setErr("Article data unavailable (it may not be live).");
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load article.");
      }
    })();
    return () => { cancelled = true; };
  }, [target.id]);

  const title = art?.title || target.title;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.62)", backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div style={{
        width: "min(920px, 94vw)", maxHeight: "88vh",
        display: "flex", flexDirection: "column",
        background: "#15181d", color: "#dfe3ea",
        border: "1px solid rgba(150,150,150,.35)", borderRadius: 14,
        boxShadow: "0 24px 70px rgba(0,0,0,.6)", overflow: "hidden",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid rgba(150,150,150,.18)", flexShrink: 0 }}>
          <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, color: "var(--accent,#ffd700)" }}>
            Quick review {target.magazine ? `· ${target.magazine}` : ""}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9aa0aa", fontSize: 16, cursor: "pointer", padding: "0 4px" }} aria-label="Close">✕</button>
        </div>
        {art?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art.imageUrl} alt="" style={{ display: "block", width: "100%", maxHeight: 320, objectFit: "cover", flexShrink: 0 }} />
        )}
        <div style={{ padding: "16px 20px", overflowY: "auto" }}>
          <div style={{ fontWeight: 800, fontSize: 19, lineHeight: 1.3, marginBottom: 12 }}>{title}</div>
          {err && <div style={{ fontSize: 13, color: "#ffb347" }}>{err}</div>}
          {art?.summary && (
            <div style={{ fontSize: 14, lineHeight: 1.65, color: "#c6ccd6", whiteSpace: "pre-wrap" }}>
              <b style={{ color: "#8f96a3", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Summary</b>
              {art.summary}
            </div>
          )}
          {art?.commentary && (
            <div style={{ fontSize: 14, lineHeight: 1.65, color: "#b9c2cf", whiteSpace: "pre-wrap", marginTop: 14, borderTop: "1px solid rgba(150,150,150,.15)", paddingTop: 14 }}>
              <b style={{ color: "#8f96a3", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Commentary</b>
              {art.commentary}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid rgba(150,150,150,.18)", flexShrink: 0 }}>
          {art?.sourceUrl && (
            <a href={art.sourceUrl} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: "none", display: "inline-block" }}>Source ↗</a>
          )}
          <a href={`/articles/${target.id}`} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: "none", display: "inline-block", color: "var(--accent,#ffd700)", borderColor: "rgba(255,215,0,.4)" }}>Open on site ↗</a>
        </div>
      </div>
    </div>
  );
}

export default function AdminSocialQueue() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/admin/social-queue");
      const j = await r.json();
      if (!r.ok) return setErr(j.error || "load failed");
      setData(j);
      setErr("");
    } catch (e: any) {
      setErr("Failed to load: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function unqueue(id: string) {
    if (!confirm("Remove this post from the queue?")) return;
    setBusy(id); setErr(""); setMsg("");
    try {
      const r = await fetch(`/api/admin/social-queue?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "delete failed");
      else { setMsg("Post removed from queue."); await load(); }
    } finally {
      setBusy("");
    }
  }

  async function postNow(id: string) {
    setBusy(id); setErr(""); setMsg("");
    try {
      const r = await fetch("/api/admin/social-queue", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post-now", id }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "post-now failed");
      else { setMsg("Hot item — publisher sends it within 15 min."); await load(); }
    } finally { setBusy(""); }
  }

  async function retry(id: string) {
    setBusy(id); setErr(""); setMsg("");
    try {
      const r = await fetch("/api/admin/social-queue", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", id }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "retry failed");
      else { setMsg("Post requeued — publisher will pick it up on its next run."); await load(); }
    } finally {
      setBusy("");
    }
  }

  async function refreshMetrics() {
    setBusy("metrics"); setErr(""); setMsg("");
    try {
      const r = await fetch("/api/admin/social-queue", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh-metrics" }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "metrics refresh failed");
      else { setMsg(`Metrics refreshed — ${j.updated} updated${j.failed ? `, ${j.failed} failed` : ""}.`); await load(); }
    } finally {
      setBusy("");
    }
  }

  if (loading) return <div style={{ opacity: 0.6, padding: 24 }}>Loading social queue…</div>;

  return (
    <div>
      {preview && <SocialPreviewModal target={preview} onClose={() => setPreview(null)} />}
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>📣 Social Queue</h2>
      <p style={{ margin: "0 0 16px", opacity: 0.7, fontSize: 13 }}>
        Bluesky/social posts scheduled by the publisher. Queued rows push at their scheduled time; metrics refresh from the platform.
      </p>

      {msg && <div style={{ color: "#39d353", fontSize: 13, margin: "0 0 12px" }}>✓ {msg}</div>}
      {err && <div style={{ color: "#ff6b6b", fontSize: 13, margin: "0 0 12px" }}>✗ {err}</div>}

      {/* QUEUED */}
      <div style={box}>
        <SectionHeader label="Queued" count={data?.summary.queued ?? 0} />
        {data && data.queued.length === 0 && <div style={{ opacity: 0.5, fontSize: 13 }}>Nothing queued.</div>}
        {data?.queued.map((p) => (
          <div key={p.id} style={rowStyle}>
            <div style={flex1}>
              <div style={{ ...titleStyle, cursor: "pointer", borderBottom: "1px dashed rgba(150,150,150,.4)", display: "inline-block" }} onClick={() => setPreview({ id: p.articleId, title: p.title || p.articleId, magazine: p.magazine })} title="Click to preview the article">{p.title || p.articleId}</div>
              <div style={metaStyle}>
                {p.magazine || "—"} · {p.platform} · pushes {fmtDate(p.scheduledAt)}
              </div>
            </div>
            <button style={btnAccent} disabled={busy === p.id} onClick={() => postNow(p.id)}>
              {busy === p.id ? "…" : "⚡ Post Now"}
            </button>
            <button style={btnDanger} disabled={busy === p.id} onClick={() => unqueue(p.id)}>
              {busy === p.id ? "…" : "Delete"}
            </button>
          </div>
        ))}
      </div>

      {/* POSTED */}
      <div style={box}>
        <SectionHeader
          label="Posted" count={data?.summary.posted ?? 0}
          extra={<button style={btnAccent} disabled={busy === "metrics"} onClick={refreshMetrics}>
            {busy === "metrics" ? "Refreshing…" : "↻ Refresh metrics"}
          </button>}
        />
        {data && data.posted.length === 0 && <div style={{ opacity: 0.5, fontSize: 13 }}>Nothing posted yet.</div>}
        {data?.posted.map((p) => (
          <div key={p.id} style={rowStyle}>
            <div style={flex1}>
              <div style={{ ...titleStyle, cursor: "pointer", borderBottom: "1px dashed rgba(150,150,150,.4)", display: "inline-block" }} onClick={() => setPreview({ id: p.articleId, title: p.title || p.articleId, magazine: p.magazine })} title="Click to preview the article">{p.title || p.articleId}</div>
              <div style={metaStyle}>
                {p.magazine || "—"} · {p.platform} · posted {fmtDate(p.postedAt)}
              </div>
            </div>
            <div style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              <Metrics m={p.metrics} />
            </div>
            {p.postUrl
              ? <a href={p.postUrl} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: "none", display: "inline-block" }}>Permalink ↗</a>
              : <span style={{ opacity: 0.4, fontSize: 11 }}>no permalink</span>}
          </div>
        ))}
      </div>

      {/* FAILED */}
      <div style={box}>
        <SectionHeader label="Failed" count={data?.summary.failed ?? 0} />
        {data && data.failed.length === 0 && <div style={{ opacity: 0.5, fontSize: 13 }}>No failures.</div>}
        {data?.failed.map((p) => (
          <div key={p.id} style={rowStyle}>
            <div style={flex1}>
              <div style={{ ...titleStyle, cursor: "pointer", borderBottom: "1px dashed rgba(150,150,150,.4)", display: "inline-block" }} onClick={() => setPreview({ id: p.articleId, title: p.title || p.articleId, magazine: p.magazine })} title="Click to preview the article">{p.title || p.articleId}</div>
              <div style={{ ...metaStyle, color: "#ff6b6b" }}>
                {p.magazine || "—"} · {p.platform} · {p.error || "unknown error"}
              </div>
            </div>
            <button style={btnAccent} disabled={busy === p.id} onClick={() => retry(p.id)}>
              {busy === p.id ? "…" : "Retry"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
