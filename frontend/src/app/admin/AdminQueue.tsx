"use client";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";

type QArticle = {
  id: string; title: string; sourceUrl: string | null; summary: string | null;
  warnings: any; status: string; ingress: string; flagged: boolean; suitabilityOk: boolean;
  subcategory: string | null; createdAt: string; publishedAt: string | null; socialRepeat: boolean;
  featured: boolean;
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

// ArticleCard — magazine change persists immediately (works even for live articles)
// but updates the card IN PLACE (no re-sort/re-arrange). Status changes reload the list.
function ArticleCard({ a, magazines, onAct, onMag, onDel }: {
  a: QArticle; magazines: { id: string; name: string }[];
  onAct: (id: string, patch: any) => void;
  onMag: (id: string, magazineId: string) => void;
  onDel: (id: string) => void;
}) {
  const st = STATUS_TPL[a.status] || { label: a.status, bg: "#222", fg: "#aaa" };

  return (
    <article style={{ border: "1px solid rgba(150,150,150,.15)", borderRadius: 10, overflow: "hidden", background: "var(--card-bg, rgba(255,255,255,.03))", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "6px 10px", display: "flex", gap: 6, alignItems: "center", borderBottom: "1px solid rgba(150,150,150,.1)", fontSize: 10 }}>
        <span style={{ background: st.bg, color: st.fg, padding: "2px 7px", borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>{st.label}</span>
        {a.featured && <span title="featured flagship" style={{ color: "#ffd700" }}>★</span>}
        {a.flagged && <span title="flagged" style={{ color: "#ffd700" }}>⚑</span>}
        {!a.suitabilityOk && <span title="unsuitable" style={{ color: "#f87171" }}>⚠</span>}
        {a.socialRepeat && <span title="social repeat" style={{ color: "#58a6ff" }}>↻</span>}
        <span style={{ marginLeft: "auto", opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>{a.ingress}</span>
      </div>
      <div style={{ padding: 12, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25, marginBottom: 6 }}>{a.title}</div>
        <div style={{ fontSize: 10, color: "var(--accent, #ffd700)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          {magazines.find((m) => m.id === a.magazine?.id)?.name || "Unassigned"}{a.subcategory ? ` / ${a.subcategory}` : ""}
        </div>
        {a.summary && <p style={{ fontSize: 13, opacity: 0.8, margin: "0 0 8px", lineHeight: 1.45 }}>{a.summary}</p>}
      </div>
      <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(150,150,150,.12)", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {a.status === "draft" && <Btn onClick={() => onAct(a.id, { status: "approved" })} bg="#00331f" fg="#34d399">✓ Approve</Btn>}
        {a.status === "approved" && <Btn onClick={() => onAct(a.id, { status: "live" })} bg="#06253a" fg="#58a6ff">Publish</Btn>}
        {a.status !== "rejected" && <Btn onClick={() => onAct(a.id, { status: "rejected" })} bg="#3a0a0a" fg="#f87171">✕ Reject</Btn>}
        {a.status === "rejected" && <Btn onClick={() => onAct(a.id, { status: "draft" })} bg="#222" fg="#aaa">↩ Draft</Btn>}
        <select title="Change magazine (applies immediately)" value={a.magazine?.id || ""}
          onChange={(e) => e.target.value && onMag(a.id, e.target.value)} style={{ ...sel, minWidth: 120, padding: "5px 8px", fontSize: 11 }}>
          <option value="">→ magazine</option>
          {magazines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button title="Assign / create subcategory" onClick={() => { const v = prompt("Subcategory:", a.subcategory || ""); if (v !== null) onAct(a.id, { subcategory: v.trim() || null }); }} style={btn}>🏷</button>
        <button title="Toggle social repeat" onClick={() => onAct(a.id, { socialRepeat: !a.socialRepeat })} style={a.socialRepeat ? { ...btn, background: "#06253a", color: "#58a6ff" } : btn}>↻</button>
        <button title="Make the flagship featured story" onClick={() => onAct(a.id, { featured: !a.featured })} style={a.featured ? { ...btn, background: "#3b2f00", color: "#ffd700" } : btn}>★</button>
        {a.sourceUrl && <a href={a.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent,#ffd700)", textDecoration: "none", marginLeft: "auto", fontSize: 11, alignSelf: "center" }}>source ↗</a>}
        <button title="Delete" onClick={() => onDel(a.id)} style={{ ...btn, color: "#f87171" }}>🗑</button>
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

  const del = async (id: string) => {
    if (!confirm("Delete this article permanently?")) return;
    await fetch(`/api/admin/article/${id}`, { method: "DELETE" });
    load();
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
        <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>{data ? `${data.articles.length} shown · ${data.articles.filter((a) => a.socialRepeat).length} for social` : "…"}</span>
        <button onClick={newMag} title="Create a new magazine" style={{ ...btn, color: "var(--accent,#ffd700)", borderColor: "rgba(255,215,0,.4)" }}>＋ New Magazine</button>
      </div>

      {err && <div style={{ background: "#3a0a0a", color: "#f87171", padding: 10, borderRadius: 6, marginBottom: 14 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {data?.articles.map((a) => (
          <ArticleCard key={a.id} a={a} magazines={data.magazines} onAct={act} onMag={onMag} onDel={del} />
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