"use client";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { DELETION_REASONS } from "@/lib/deletionReasons";

type QArticle = {
  id: string; title: string; sourceUrl: string | null; summary: string | null;
  commentary: string | null;
  warnings: any; status: string; ingress: string; flagged: boolean; suitabilityOk: boolean;
  subcategory: string | null; createdAt: string; publishedAt: string | null; socialRepeat: boolean;
  featured: boolean; efx: string | null; siteName?: string | null;
  magazine: { id: string; name: string } | null;
};
type QResp = { magazines: { id: string; name: string }[]; articles: QArticle[] };

const STATUS_TPL: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: "DRAFT", bg: "#3b2f00", fg: "#ffd700" },
  approved: { label: "APPROVED", bg: "#00331f", fg: "#34d399" },
  live: { label: "LIVE", bg: "#06253a", fg: "#58a6ff" },
  rejected: { label: "REJECTED", bg: "#3a0a0a", fg: "#f87171" },
};

const sel: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(150,150,150,.3)", background: "#111", color: "#e6e6e6", fontSize: 13, cursor: "pointer", minWidth: 150 };
const btn: React.CSSProperties = { padding: "5px 9px", borderRadius: 6, border: "1px solid rgba(150,150,150,.25)", background: "#1a1d21", color: "#ccc", fontSize: 12, cursor: "pointer" };

// Cinematic CSS effects that can be applied to an article's hero image when approved/published.
const EFX_OPTS: { value: string; label: string }[] = [
  { value: "", label: "🎞 No effect" },
  { value: "vhs", label: "📼 VHS / surveillance" },
  { value: "rain", label: "🌧 Rain" },
  { value: "lightning", label: "⚡ Lightning" },
];

// ArticleCard — magazine change persists immediately (works even for live articles)
// but updates the card IN PLACE (no re-sort/re-arrange). Status changes reload the list.
function ArticleCard({ a, magazines, subcatsByMag, addSubcat, onAct, onMag, onDel, onComment, onPin, onSubcat, onStatus }: {
  a: QArticle; magazines: { id: string; name: string }[];
  subcatsByMag: Record<string, string[]>; addSubcat: (magazineId: string | null | undefined, name: string) => void;
  onAct: (id: string, patch: any) => void;
  onMag: (id: string, magazineId: string) => void;
  onDel: (id: string, reason?: string) => void;
  onComment: (id: string, title: string) => void;
  onPin: (id: string, title: string) => void;
  onSubcat: (id: string, subcategory: string | null) => void;
  onStatus: (id: string, newStatus: string) => void;
}) {
  const st = STATUS_TPL[a.status] || { label: a.status, bg: "#222", fg: "#aaa" };
  const [showCommentary, setShowCommentary] = useState(false);
  const hasCommentary = !!a.commentary && a.commentary.trim().length > 0;
  const [showSubcat, setShowSubcat] = useState(false);
  const [newSubcat, setNewSubcat] = useState("");
  const [delOpen, setDelOpen] = useState(false);
  const [delReason, setDelReason] = useState("other");
  const parentMagId = a.magazine?.id || "none";
  const subcats = subcatsByMag[parentMagId] || [];

  const applySubcat = (v: string) => {
    const val = (v && v.trim()) || null;
    if (val) addSubcat(a.magazine?.id, val);
    onSubcat(a.id, val);
    setShowSubcat(false);
    setNewSubcat("");
  };

  return (
    <article style={{ border: "1px solid rgba(150,150,150,.15)", borderRadius: 10, overflow: "hidden", background: "var(--card-bg, rgba(255,255,255,.03))", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "6px 10px", display: "flex", gap: 6, alignItems: "center", borderBottom: "1px solid rgba(150,150,150,.1)", fontSize: 10 }}>
        <span style={{ background: st.bg, color: st.fg, padding: "2px 7px", borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>{st.label}</span>
        {a.featured && <span title="featured flagship" style={{ color: "#ffd700" }}>★</span>}
        {a.flagged && <span title="flagged" style={{ color: "#ffd700" }}>⚑</span>}
        {!a.suitabilityOk && <span title="unsuitable" style={{ color: "#f87171" }}>⚠</span>}
        {a.socialRepeat && <span title="social repeat" style={{ color: "#58a6ff" }}>↻</span>}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>
          {a.createdAt && <span title={`Dropped ${new Date(a.createdAt).toLocaleString()}`} style={{ color: "#58a6ff", whiteSpace: "nowrap" }}>🕓 {new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
          {a.ingress}
        </span>
      </div>
      <div style={{ padding: 12, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25, marginBottom: 6 }}>{a.title}</div>
        <div style={{ fontSize: 10, color: "var(--accent, #ffd700)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          {magazines.find((m) => m.id === a.magazine?.id)?.name || "Unassigned"}{a.subcategory ? ` / ${a.subcategory}` : ""}
        </div>
        {a.summary && <p style={{ fontSize: 13, opacity: 0.8, margin: "0 0 8px", lineHeight: 1.45 }}>{a.summary}</p>}
        {a.siteName && <div style={{ fontSize: 10, color: "#58a6ff", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{a.siteName}</div>}
      </div>
      <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(150,150,150,.12)", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {a.status === "draft" && <Btn onClick={() => onStatus(a.id, "approved")} bg="#00331f" fg="#34d399">✓ Approve</Btn>}
        {a.status === "approved" && <Btn onClick={() => onStatus(a.id, "live")} bg="#06253a" fg="#58a6ff">Publish</Btn>}
        {a.status !== "rejected" && <Btn onClick={() => onStatus(a.id, "rejected")} bg="#3a0a0a" fg="#f87171">✕ Reject</Btn>}
        {a.status === "rejected" && <Btn onClick={() => onStatus(a.id, "draft")} bg="#222" fg="#aaa">↩ Draft</Btn>}
        <select title="Change magazine (applies immediately)" value={a.magazine?.id || ""}
          onChange={(e) => e.target.value && onMag(a.id, e.target.value)} style={{ ...sel, minWidth: 120, padding: "5px 8px", fontSize: 11 }}>
          <option value="">→ magazine</option>
          {magazines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button title="Assign / create subcategory"
          onClick={() => { setNewSubcat(a.subcategory || ""); setShowSubcat((s) => !s); }}
          style={{ ...btn, color: a.subcategory ? "#34d399" : btn.color, borderColor: a.subcategory ? "rgba(52,211,153,.45)" : btn.borderColor }}>🏷</button>
        {showSubcat && (
          <div className="nexus-subcat-pop" style={{ marginTop: 8, width: "100%", background: "rgba(22,26,32,.98)", border: "1px solid rgba(150,150,150,.3)", borderRadius: 10, padding: 12, boxShadow: "0 10px 30px rgba(0,0,0,.5)", zIndex: 60 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, color: "var(--accent,#ffd700)", marginBottom: 8 }}>
              Subcategory · {a.magazine?.name || "Unassigned"}
            </div>
            {subcats.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, maxHeight: 120, overflowY: "auto" }}>
                {subcats.map((s) => (
                  <button key={s} type="button"
                    onClick={() => applySubcat(s)}
                    style={{ ...btn, flex: "0 0 auto", padding: "5px 10px", fontSize: 11, fontWeight: 600, background: s === a.subcategory ? "rgba(52,211,153,.18)" : "transparent", color: s === a.subcategory ? "#34d399" : "#cdd3dd", borderColor: s === a.subcategory ? "rgba(52,211,153,.5)" : "rgba(150,150,150,.25)" }}>
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#8a8f98", marginBottom: 10 }}>No subcategories yet for this magazine — create the first below.</div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <input value={newSubcat} onChange={(e) => setNewSubcat(e.target.value)} placeholder="New subcategory…"
                onKeyDown={(e) => { if (e.key === "Enter") applySubcat(newSubcat); }}
                style={{ flex: 1, minWidth: 0, padding: "7px 9px", borderRadius: 7, border: "1px solid rgba(150,150,150,.3)", background: "#0d0f12", color: "#e6e6e6", fontSize: 12 }} />
              <button type="button" onClick={() => applySubcat(newSubcat)} disabled={!newSubcat.trim()} style={{ ...btn, fontWeight: 700, color: "var(--accent,#ffd700)", borderColor: "rgba(255,215,0,.4)", padding: "5px 10px" }}>Add</button>
              {a.subcategory && <button type="button" onClick={() => applySubcat("")} title="Clear" style={{ ...btn, color: "#f87171", borderColor: "rgba(248,113,113,.35)", padding: "5px 8px" }}>✕</button>}
            </div>
          </div>
        )}
        <button title="Toggle social repeat" onClick={() => onAct(a.id, { socialRepeat: !a.socialRepeat })} style={a.socialRepeat ? { ...btn, background: "#06253a", color: "#58a6ff" } : btn}>↻</button>
        <button title="Make the flagship featured story" onClick={() => onAct(a.id, { featured: !a.featured })} style={a.featured ? { ...btn, background: "#3b2f00", color: "#ffd700" } : btn}>★</button>
        <select title="Cinematic effect for the hero image (VHS / rain / lightning…)" value={a.efx || ""}
          onChange={(e) => onAct(a.id, { efx: e.target.value || null })}
          style={{ ...sel, minWidth: 120, padding: "5px 8px", fontSize: 11 }}>
          {EFX_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          title={hasCommentary ? "View existing commentary (click to show/hide)" : "Generate AI commentary via the magazine's named agent"}
          onClick={() => hasCommentary ? setShowCommentary((s) => !s) : onComment(a.id, a.title)}
          style={hasCommentary
            ? { ...btn, color: "#34d399", borderColor: "rgba(52,211,153,.45)" }
            : { ...btn, color: "#fbbf24", borderColor: "rgba(251,191,36,.4)" }}
        >⚙ Commentary{hasCommentary ? " ✓" : ""}</button>
        {hasCommentary && showCommentary && (
          <div style={{ width: "100%", marginTop: 8, padding: "10px 12px", background: "rgba(52,211,153,.06)", border: "1px solid rgba(52,211,153,.3)", borderRadius: 8, fontSize: 12.5, lineHeight: 1.5, display: "block", whiteSpace: "pre-wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontSize: 10, color: "#34d399" }}>Existing commentary</span>
              <button title="Regenerate commentary" onClick={() => onComment(a.id, a.title)} style={{ ...btn, marginLeft: "auto", color: "#fbbf24", borderColor: "rgba(251,191,36,.4)", fontSize: 11, padding: "2px 7px" }}>↻ regenerate</button>
            </div>
            {a.commentary}
          </div>
        )}
        <button title="Pin as FLASH/hero article" onClick={() => onPin(a.id, a.title)} style={{ ...btn, color: "#ff4444", borderColor: "rgba(255,68,68,.4)" }}>📌 Pin</button>
        {a.sourceUrl && <a href={a.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent,#ffd700)", textDecoration: "none", marginLeft: "auto", fontSize: 11, alignSelf: "center" }}>source ↗</a>}
        <button title="Delete (records reason for source stats)" onClick={() => setDelOpen(true)} style={{ ...btn, color: "#f87171" }}>🗑</button>
        {delOpen && (
          <div style={{ width: "100%", marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <select value={delReason} onChange={(e) => setDelReason(e.target.value)} autoFocus
              style={{ background: "#1c1f24", color: "#eee", border: "1px solid rgba(150,150,150,.3)", borderRadius: 6, padding: "4px 6px", fontSize: 12 }}>
              {DELETION_REASONS.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
            <button onClick={() => onDel(a.id, delReason)} style={{ ...btn, color: "#fff", background: "#7f1d1d", fontWeight: 700 }}>Confirm delete</button>
            <button onClick={() => setDelOpen(false)} style={{ ...btn, color: "#aaa" }}>✕</button>
          </div>
        )}
      </div>
    </article>
  );
}

function Btn({ onClick, bg, fg, children }: any) {
  return <button onClick={onClick} style={{ ...btn, background: bg, color: fg, fontWeight: 700 }}>{children}</button>;
}

export default function AdminQueue() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState<QResp | null>(null);
  const [mag, setMag] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  // Growing list of subcategories, KEYED BY PARENT MAGAZINE so an article only
  // sees choices from its own magazine (e.g. no "Fish Tales" under Tech). Seeded
  // from localStorage and refreshed with any seen in the loaded queue.
  const [subcatsByMag, setSubcatsByMag] = useState<Record<string, string[]>>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("nexus-subcategories") || "{}");
      return (raw && typeof raw === "object") ? raw : {};
    } catch { return {}; }
  });
  useEffect(() => {
    if (!data) return;
    const seen: Record<string, Set<string>> = {};
    Object.entries(subcatsByMag).forEach(([k, v]) => {
      if (Array.isArray(v)) seen[k] = new Set(v.filter((s) => typeof s === "string"));
    });
    data.articles.forEach((a) => {
      if (!a.subcategory) return;
      const key = a.magazine?.id || "none";
      if (!seen[key]) seen[key] = new Set();
      seen[key].add(a.subcategory);
    });
    const merged: Record<string, string[]> = {};
    Object.entries(seen).forEach(([k, s]) => { merged[k] = Array.from(s).sort((x, y) => x.localeCompare(y)); });
    setSubcatsByMag(merged);
    try { localStorage.setItem("nexus-subcategories", JSON.stringify(merged)); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Persist a new subcategory under its parent magazine so it grows that magazine's list.
  const addSubcat = (magazineId: string | null | undefined, name: string) => {
    const n = name.trim();
    if (!n) return;
    const key = magazineId || "none";
    setSubcatsByMag((prev) => {
      const cur = prev[key] || [];
      const merged = cur.includes(n) ? cur : [...cur, n].sort((x, y) => x.localeCompare(y));
      const next = { ...prev, [key]: merged };
      try { localStorage.setItem("nexus-subcategories", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const load = () => {
    const params = new URLSearchParams();
    if (mag !== "all") params.set("magazine", mag);
    if (status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/admin/queue?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => { if (j.error) setErr(j.error); else setData(j); })
      .catch((e) => setErr(e.message));
  };
  useEffect(load, [mag, status, q]);

  const act = async (id: string, patch: any) => {
    const r = await fetch(`/api/admin/article/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const j = await r.json();
    if (j.error) setErr(j.error); else load();
  };

  // magazine change: PATCH immediately but update the card IN PLACE (no re-sort/re-arrange),
  // so it works even for live articles and doesn't shuffle the list.
  const onMag = async (id: string, magazineId: string) => {
    const r = await fetch(`/api/admin/article/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ magazineId }) });
    const j = await r.json();
    if (j.error) { setErr(j.error); return; }
    setData((d) => d ? {
      ...d,
      articles: d.articles.map((x) => x.id === id ? { ...x, magazine: d.magazines.find((m) => m.id === magazineId) || null } : x),
    } : d);
  };

  // subcategory change: PATCH immediately, update the card IN PLACE (no reload, no re-sort,
  // no jumping/disappearing). The global growing list is updated separately via addSubcat.
  const onSubcat = async (id: string, subcategory: string | null) => {
    const r = await fetch(`/api/admin/article/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subcategory }) });
    const j = await r.json();
    if (j.error) { setErr(j.error); return; }
    setData((d) => d ? { ...d, articles: d.articles.map((x) => x.id === id ? { ...x, subcategory } : x) } : d);
  };

  // status change: PATCH immediately, update the card IN PLACE so approving
  // doesn't jump the card or make it disappear from the current view.
  const onStatus = async (id: string, newStatus: string) => {
    const r = await fetch(`/api/admin/article/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    const j = await r.json();
    if (j.error) { setErr(j.error); return; }
    setData((d) => d ? { ...d, articles: d.articles.map((x) => x.id === id ? { ...x, status: newStatus } : x) } : d);
  };

  // Bulk approve / bulk publish
  const [busy, setBusy] = useState("");

  const bulkApprove = async () => {
    if (!data || busy) return;
    const ids = data.articles.filter((a) => a.status === "draft").map((a) => a.id);
    if (!ids.length) { alert("No draft articles to approve."); return; }
    setBusy("approving");
    let ok = 0, fail = 0;
    for (const id of ids) {
      try {
        const r = await fetch(`/api/admin/article/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }) });
        const j = await r.json();
        if (j.error) fail++; else ok++;
      } catch { fail++; }
    }
    setBusy("");
    load();
    if (!fail) setErr(`Approved ${ok} articles.`);
    else setErr(`Approved ${ok}, ${fail} failed.`);
  };

  const bulkPublish = async () => {
    if (!data || busy) return;
    const ids = data.articles.filter((a) => a.status === "approved").map((a) => a.id);
    if (!ids.length) { alert("No approved articles to publish."); return; }
    setBusy("publishing");
    let ok = 0, fail = 0;
    for (const id of ids) {
      try {
        const r = await fetch(`/api/admin/article/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "live" }) });
        const j = await r.json();
        if (j.error) fail++; else ok++;
      } catch { fail++; }
    }
    setBusy("");
    load();
    if (!fail) setErr(`Published ${ok} articles.`);
    else setErr(`Published ${ok}, ${fail} failed.`);
  };

  // create a new magazine on demand
  const newMag = async () => {
    const name = prompt("New magazine name:");
    if (!name || !name.trim()) return;
    const slug = prompt("Slug (lowercase, dashes — e.g. sports-desk). Leave blank to auto-generate:", "");
    const tagline = prompt("Tagline (optional):", "") || undefined;
    const desc = prompt("Description (optional):", "") || undefined;
    const r = await fetch("/api/admin/magazines", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), id: slug || undefined, tagline, description: desc }),
    });
    const j = await r.json();
    if (j.error) { setErr(j.error); return; }
    // refetch to include the new magazine
    load();
  };

  async function del(id: string, reason = "other") {
    if (!confirm("Delete this article permanently?")) return;
    await fetch(`/api/admin/article/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    load();
  };

  // Generate AI commentary via the magazine's named agent (OpenRouter)
  const onPin = async (id: string, title: string) => {
    const kind = prompt("Pin kind (FLASH / IMPORTANT):", "FLASH");
    if (!kind) return;
    const runFor = prompt("Duration (24h / 7d / empty for indefinite):", "24h");
    if (runFor === null) return;
    const r = await fetch("/api/admin/pins", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article_id: id, kind, run_for: runFor }),
    });
    const j = await r.json();
    if (j.error) setErr("Pin failed: " + j.error);
    else alert("Pinned as " + kind + "!");
  };

  const onComment = async (id: string, title: string) => {
    setErr("");
    const r = await fetch("/api/admin/generate-commentary", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article_id: id }),
    });
    const j = await r.json();
    if (j.error) { setErr(`Commentary failed: ${j.error}`); return; }
    alert(`Commentary generated by ${j.agent}:\n\n${j.commentary}`);
  };

  // Generate a CATBOY-style WWN entertainment article via OpenRouter
  const genWWN = async () => {
    const topic = prompt("Optional topic idea (or leave blank for random CATBOY mischief):", "");
    if (topic === null) return;
    setGenLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/generate-entertainment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magazineId: "weekly-weird-news", topic: topic.trim() || undefined }),
      });
      const j = await r.json();
      if (j.error) { setErr(j.error); return; }
      alert(`🐱 "${j.article.title}" generated as draft!`);
      load();
    } catch (e: any) { setErr(e.message || "Failed to generate"); }
    finally { setGenLoading(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <input placeholder="🔍 Search articles… (fuzzy)" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(150,150,150,.3)", background: "#111", color: "#e6e6e6", fontSize: 13, flex: "1 1 200px", minWidth: 200 }} />
        <select value={mag} onChange={(e) => setMag(e.target.value)} style={sel}>
          {[{ id: "all", name: "All magazines" }, ...(data?.magazines || [])].map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={sel}>
          <option value="all">All statuses</option>
          <option value="draft">Draft (needs review)</option>
          <option value="approved">Approved</option>
          <option value="live">Live</option>
          <option value="rejected">Rejected</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>{data ? `${data.articles.length} shown · ${data.articles.filter((a) => a.socialRepeat).length} for social · ${data.articles.filter((a) => a.status === "draft").length} draft · ${data.articles.filter((a) => a.status === "approved").length} approved` : "…"}</span>
        {data && data.articles.filter((a) => a.status === "draft").length > 0 && (
          <button onClick={bulkApprove} disabled={!!busy} style={{ ...btn, color: "#34d399", borderColor: "rgba(52,211,153,.4)", fontWeight: 700 }}>{busy === "approving" ? "⏳ Approving…" : "✓ Approve All"}</button>
        )}
        {data && data.articles.filter((a) => a.status === "approved").length > 0 && (
          <button onClick={bulkPublish} disabled={!!busy} style={{ ...btn, color: "#58a6ff", borderColor: "rgba(88,166,255,.4)", fontWeight: 700 }}>{busy === "publishing" ? "⏳ Publishing…" : "📤 Publish All Approved"}</button>
        )}
        <button onClick={genWWN} style={{ ...btn, color: "#ff6b9d", borderColor: "rgba(255,107,157,.4)", fontWeight: 700 }} disabled={genLoading}>🐱 {genLoading ? "Generating…" : "Generate WWN Article"}</button>
        <button onClick={newMag} title="Create a new magazine" style={{ ...btn, color: "var(--accent,#ffd700)", borderColor: "rgba(255,215,0,.4)" }}>＋ New Magazine</button>
      </div>

      {err && <div style={{ background: "#3a0a0a", color: "#f87171", padding: 10, borderRadius: 6, marginBottom: 14 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {data?.articles.map((a) => (
          <ArticleCard key={a.id} a={a} subcatsByMag={subcatsByMag} addSubcat={addSubcat} magazines={data.magazines} onAct={act} onMag={onMag} onDel={del} onComment={onComment} onPin={onPin} onSubcat={onSubcat} onStatus={onStatus} />
        ))}
      </div>

      {data && data.articles.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🗞️</div>
          <div>No articles{mag !== "all" ? " in this magazine" : ""} yet.</div>
        </div>
      )}
    </div>
  );
}