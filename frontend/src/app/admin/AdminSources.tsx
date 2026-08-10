"use client";
import { useEffect, useState } from "react";

type Source = {
  id: string; magazineId: string | null; magazineName: string | null;
  type: string; url: string; name: string | null; sort: string | null; limit: number | null;
};
type Mag = { id: string; name: string };

const btn: React.CSSProperties = { padding: "5px 9px", borderRadius: 6, border: "1px solid rgba(150,150,150,.25)", background: "#1a1d21", color: "#ccc", fontSize: 12, cursor: "pointer" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "7px 9px", marginTop: 4, borderRadius: 6, border: "1px solid rgba(150,150,150,.3)", background: "#111", color: "#e6e6e6", fontSize: 13 };
const label: React.CSSProperties = { fontSize: 11, opacity: 0.7, marginBottom: 6 };

function Group({ magName, items, onDelete, notify }: { magName: string; items: Source[]; onDelete: (id: string) => Promise<void>; notify: (m: string) => void }) {
  return (
    <div style={{ border: "1px solid rgba(150,150,150,.15)", borderRadius: 10, padding: 14, background: "var(--card-bg, rgba(255,255,255,.03))" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent,#ffd700)" }} />
        <b style={{ fontSize: 15, color: "#e6e6e6" }}>{magName}</b>
        <span style={{ fontSize: 11, opacity: 0.5, marginLeft: "auto" }}>{items.length} sources</span>
      </div>
      {items.length === 0 && <div style={{ fontSize: 12, opacity: 0.5, padding: 6 }}>No sources configured.</div>}
      {items.map((s) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", borderTop: "1px solid rgba(150,150,150,.1)", fontSize: 13 }}>
          <span style={{ padding: "2px 7px", borderRadius: 5, fontSize: 10, textTransform: "uppercase", background: s.type === "reddit" ? "rgba(159,101,255,.2)" : "rgba(52,211,153,.15)", color: s.type === "reddit" ? "#c084fc" : "#34d399", fontWeight: 700 }}>{s.type}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#e6e6e6", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name || s.url}</div>
            <div style={{ fontSize: 11, opacity: 0.55, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.type === "reddit" ? `r/${s.url} (${s.sort || "hot"}/${s.limit || 25})` : s.url}
            </div>
          </div>
          <button onClick={() => onDelete(s.id)} style={{ ...btn, marginLeft: "auto", background: "#3a0a0a", borderColor: "rgba(248,113,113,.35)", color: "#f87171" }}>🗑 Delete</button>
        </div>
      ))}
    </div>
  );
}

export default function AdminSources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [mags, setMags] = useState<Mag[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  // form state
  const [magId, setMagId] = useState("");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("rss");
  const [subreddit, setSubreddit] = useState("");

  const load = () => {
    fetch("/api/admin/sources").then((r) => r.json())
      .then((j) => { if (j.error) setErr(j.error); else setSources(j.sources || []); })
      .catch((e) => setErr(e.message));
    fetch("/api/admin/magazines").then((r) => r.json())
      .then((j) => { if (j.error) setErr(j.error); else { setMags(j.magazines || []); if (!magId) setMagId((j.magazines?.[0]?.id) || ""); } })
      .catch((e) => setErr(e.message));
  };
  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const del = async (id: string) => {
    const r = await fetch(`/api/admin/sources/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (j.error) setErr(j.error); else { load(); notify("Source removed"); }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magId) return setErr("Choose a magazine");
    const body: any = { magazineId: magId, type, name: name.trim() || undefined, sort: "hot", limit: 25 };
    if (type === "reddit") {
      body.subreddit = (subreddit || url).trim().replace(/^r\//, "");
      if (!body.subreddit) return setErr("Enter a subreddit (e.g. askscience)");
      body.url = body.subreddit;
    } else {
      body.url = url.trim();
      if (!body.url) return setErr("Enter a feed URL");
    }
    const r = await fetch("/api/admin/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.error) setErr(j.error); else { setUrl(""); setName(""); setSubreddit(""); load(); notify("Source added"); }
  };

  const groups: { name: string; items: Source[] }[] = [];
  const byMag = new Map<string, Source[]>();
  for (const s of sources) {
    const key = s.magazineId || "";
    if (!byMag.has(key)) byMag.set(key, []);
    byMag.get(key)!.push(s);
  }
  for (const m of mags) {
    groups.push({ name: m.name, items: byMag.get(m.id) || [] });
  }

  return (
    <div>
      {err && <div style={{ background: "#3a0a0a", color: "#f87171", padding: 10, borderRadius: 6, marginBottom: 14 }}>{err}</div>}
      {msg && <div style={{ background: "#00331f", color: "#34d399", padding: 10, borderRadius: 6, marginBottom: 14 }}>{msg}</div>}

      <div style={{ border: "1px solid rgba(150,150,150,.15)", borderRadius: 10, padding: 16, marginBottom: 18, background: "var(--card-bg, rgba(255,255,255,.03))" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#e6e6e6", marginBottom: 12 }}>＋ Add Source</div>
        <form onSubmit={create} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <label style={label}>Magazine
            <select value={magId} onChange={(e) => setMagId(e.target.value)} style={input}>
              {mags.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label style={label}>Type
            <select value={type} onChange={(e) => setType(e.target.value)} style={input}>
              <option value="rss">RSS</option>
              <option value="reddit">Reddit</option>
            </select>
          </label>
          {type === "reddit" ? (
            <label style={label}>Subreddit (e.g. askscience)
              <input value={subreddit} onChange={(e) => setSubreddit(e.target.value)} placeholder="askscience" style={input} />
            </label>
          ) : (
            <label style={label}>RSS URL
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/feed" style={input} />
            </label>
          )}
          <label style={label}>Display name (optional)
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SciTech Daily" style={input} />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" style={{ ...btn, background: "#0b5a", borderColor: "rgba(52,211,153,.4)", color: "#34d399", fontWeight: 700, padding: "8px 16px", width: "100%" }}>＋ Add</button>
          </div>
        </form>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
        {groups.map((g) => <Group key={g.name} magName={g.name} items={g.items} onDelete={del} notify={notify} />)}
      </div>
    </div>
  );
}