"use client";
import { useEffect, useState } from "react";

// Campaigns tab — social campaign queues (holidays, vendor pushes, promos).
// Each campaign: name/kind, target connections (platforms), run length
// (start/end), posts/day + ET window, and its own item list. Active campaigns
// are drained into the social queue by the publisher's hourly run.

type Campaign = {
  id: string;
  name: string;
  kind: string;
  description: string | null;
  status: string;
  startAt: string;
  endAt: string;
  postsPerDay: number;
  windowStartMin: number;
  windowEndMin: number;
  targetPlatforms: string[];
  runLengthDays: number;
  itemsQueued: number;
  itemsScheduled: number;
  itemsPosted: number;
  itemsTotal: number;
};

type Item = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  position: number;
  status: string;
  scheduled_at: string | null;
};

const PLATFORMS = [
  { id: "x", label: "X" },
  { id: "bluesky", label: "Bluesky" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "threads", label: "Threads" },
  { id: "instagram", label: "Instagram" },
  { id: "mastodon", label: "Mastodon" },
];
const KINDS = [
  { id: "holiday", label: "🎄 Holiday" },
  { id: "vendor", label: "🏷️ Vendor campaign" },
  { id: "promo", label: "📣 Promo" },
  { id: "custom", label: "• Custom" },
];
const STATUS_COLORS: Record<string, string> = {
  draft: "#aaa", active: "#39d353", completed: "#58a6ff", archived: "#666",
};

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
const input: React.CSSProperties = {
  background: "#0d0f12", border: "1px solid rgba(150,150,150,.3)", color: "#ddd",
  borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = { fontSize: 11, opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 };

function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function minsToTime(m: number) {
  const h = Math.floor(m / 60), mm = m % 60;
  return `${h}:${String(mm).padStart(2, "0")}`;
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [openItems, setOpenItems] = useState<Record<string, Item[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  // form state
  const [name, setName] = useState("");
  const [kind, setKind] = useState("custom");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [postsPerDay, setPostsPerDay] = useState(2);
  const [windowStart, setWindowStart] = useState("08:00");
  const [windowEnd, setWindowEnd] = useState("22:00");
  const [platforms, setPlatforms] = useState<string[]>(["bluesky"]);

  // item form state (per campaign)
  const [itemFor, setItemFor] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemBody, setItemBody] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemLink, setItemLink] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/admin/social-campaigns");
      const j = await r.json();
      if (!r.ok) return setErr(j.error || "load failed");
      setCampaigns(j.campaigns || []);
      setErr("");
    } catch (e: any) { setErr("Failed to load: " + (e?.message || e)); }
  }
  useEffect(() => { load(); }, []);

  async function loadItems(campaignId: string) {
    const r = await fetch(`/api/admin/social-campaigns?items=${campaignId}`);
    const j = await r.json();
    setOpenItems((prev) => ({ ...prev, [campaignId]: j.items || [] }));
  }

  function openForm(c?: Campaign) {
    if (c) {
      setEditing(c); setName(c.name); setKind(c.kind); setDescription(c.description || "");
      setStartAt(c.startAt.slice(0, 16)); setEndAt(c.endAt.slice(0, 16));
      setPostsPerDay(c.postsPerDay);
      setWindowStart(minsToTime(c.windowStartMin)); setWindowEnd(minsToTime(c.windowEndMin));
      setPlatforms(c.targetPlatforms);
    } else {
      setEditing(null); setName(""); setKind("custom"); setDescription("");
      const now = new Date(); setStartAt(now.toISOString().slice(0, 16));
      setEndAt(new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 16));
      setPostsPerDay(2); setWindowStart("08:00"); setWindowEnd("22:00"); setPlatforms(["bluesky"]);
    }
    setShowForm(true);
  }

  async function saveCampaign() {
    setBusy("save"); setErr(""); setMsg("");
    try {
      const [sh, sm] = windowStart.split(":").map(Number);
      const [eh, em] = windowEnd.split(":").map(Number);
      const r = await fetch("/api/admin/social-campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id, name, kind, description, startAt, endAt, postsPerDay,
          windowStartMin: sh * 60 + sm, windowEndMin: eh * 60 + em, targetPlatforms: platforms,
        }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "save failed");
      else { setMsg(editing ? "Campaign updated." : "Campaign created (draft)."); setShowForm(false); await load(); }
    } finally { setBusy(""); }
  }

  async function setStatus(campaignId: string, status: string) {
    setBusy(campaignId + status); setErr(""); setMsg("");
    try {
      const r = await fetch("/api/admin/social-campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-status", campaignId, status }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "status change failed");
      else { setMsg(`Campaign ${status}.`); await load(); }
    } finally { setBusy(""); }
  }

  async function deleteCampaign(campaignId: string) {
    if (!confirm("Delete this campaign and all its items? Posted history stays in the social queue.")) return;
    setBusy(campaignId); setErr(""); setMsg("");
    try {
      const r = await fetch(`/api/admin/social-campaigns?id=${campaignId}`, { method: "DELETE" });
      if (!r.ok) { const j = await r.json(); setErr(j.error || "delete failed"); }
      else { setMsg("Campaign deleted."); await load(); }
    } finally { setBusy(""); }
  }

  async function addItem(campaignId: string) {
    if (!itemTitle.trim()) return setErr("Item title required");
    setBusy(campaignId + "-add"); setErr(""); setMsg("");
    try {
      const r = await fetch("/api/admin/social-campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-item", campaignId, title: itemTitle, body: itemBody, imageUrl: itemImage, linkUrl: itemLink }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "add failed");
      else {
        setItemTitle(""); setItemBody(""); setItemImage(""); setItemLink("");
        await loadItems(campaignId); await load();
      }
    } finally { setBusy(""); }
  }

  async function deleteItem(campaignId: string, itemId: string) {
    setBusy(itemId);
    try {
      await fetch("/api/admin/social-campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-item", itemId }),
      });
      await loadItems(campaignId); await load();
    } finally { setBusy(""); }
  }

  async function bumpItemTime(campaignId: string, itemId: string, hours: number) {
    setBusy(itemId);
    try {
      const items = openItems[campaignId] || [];
      const it = items.find((x) => x.id === itemId);
      const base = it?.scheduled_at ? new Date(it.scheduled_at) : new Date();
      const next = new Date(base.getTime() + hours * 3600000);
      await fetch("/api/admin/social-campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-item-time", itemId, scheduledAt: next.toISOString() }),
      });
      await loadItems(campaignId);
    } finally { setBusy(""); }
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>🎯 Social Campaigns</h2>
      <p style={{ margin: "0 0 16px", opacity: 0.7, fontSize: 13 }}>
        Specialized queues — holidays, vendor pushes, promos — each with target connections, run length, and posts/day. Active campaigns drain into the Social Queue automatically.
      </p>

      {msg && <div style={{ color: "#39d353", fontSize: 13, margin: "0 0 12px" }}>✓ {msg}</div>}
      {err && <div style={{ color: "#ff6b6b", fontSize: 13, margin: "0 0 12px" }}>✗ {err}</div>}

      <div style={{ marginBottom: 16 }}>
        <button style={btnAccent} onClick={() => openForm()}>＋ New Campaign</button>
      </div>

      {showForm && (
        <div style={box}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>{editing ? "Edit campaign" : "New campaign"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><div style={labelStyle}>Name</div><input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Holiday Gift Guide" /></div>
            <div><div style={labelStyle}>Kind</div>
              <select style={input} value={kind} onChange={(e) => setKind(e.target.value)}>
                {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select></div>
            <div><div style={labelStyle}>Starts</div><input type="datetime-local" style={input} value={startAt} onChange={(e) => setStartAt(e.target.value)} /></div>
            <div><div style={labelStyle}>Ends (run length)</div><input type="datetime-local" style={input} value={endAt} onChange={(e) => setEndAt(e.target.value)} /></div>
            <div><div style={labelStyle}>Posts per day</div><input type="number" min={1} max={24} style={input} value={postsPerDay} onChange={(e) => setPostsPerDay(Number(e.target.value))} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><div style={labelStyle}>Window start (ET)</div><input style={input} value={windowStart} onChange={(e) => setWindowStart(e.target.value)} /></div>
              <div style={{ flex: 1 }}><div style={labelStyle}>Window end (ET)</div><input style={input} value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} /></div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}><div style={labelStyle}>Description</div><input style={input} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Target connections</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PLATFORMS.map((p) => (
                <button key={p.id}
                  style={{ ...btn, ...(platforms.includes(p.id) ? btnAccent : {}) }}
                  onClick={() => setPlatforms((prev) => prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id])}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnAccent} disabled={busy === "save"} onClick={saveCampaign}>{busy === "save" ? "…" : editing ? "Save" : "Create draft"}</button>
            <button style={btn} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {campaigns.length === 0 && <div style={{ opacity: 0.5, fontSize: 13, padding: 16 }}>No campaigns yet — create one to get started.</div>}

      {campaigns.map((c) => (
        <div key={c.id} style={box}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</span>
              <span style={{ marginLeft: 10, fontSize: 11, color: STATUS_COLORS[c.status] || "#aaa", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{c.status}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {c.status === "draft" && <button style={btnAccent} disabled={busy === c.id + "active"} onClick={() => setStatus(c.id, "active")}>▶ Activate</button>}
              {c.status === "active" && <button style={btn} disabled={busy === c.id + "draft"} onClick={() => setStatus(c.id, "draft")}>⏸ Pause</button>}
              {c.status !== "archived" && <button style={btn} disabled={busy === c.id + "archived"} onClick={() => setStatus(c.id, "archived")}>📦 Archive</button>}
              <button style={btn} onClick={() => openForm(c)}>✎ Edit</button>
              <button style={btnDanger} disabled={busy === c.id} onClick={() => deleteCampaign(c.id)}>Delete</button>
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            {KINDS.find((k) => k.id === c.kind)?.label || c.kind} · {fmt(c.startAt)} → {fmt(c.endAt)} ({c.runLengthDays}d) · {c.postsPerDay}/day · window {minsToTime(c.windowStartMin)}–{minsToTime(c.windowEndMin)} ET · → {c.targetPlatforms.join(", ")}
          </div>
          {c.description && <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 8 }}>{c.description}</div>}
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>
            items: {c.itemsPosted} posted · {c.itemsScheduled + c.itemsQueued} queued · {c.itemsTotal} total
          </div>

          <button style={btn} onClick={() => {
            const open = !!openItems[c.id];
            setOpenItems((prev) => ({ ...prev, [c.id]: open ? prev[c.id] : prev[c.id] || [] }));
            if (!open) loadItems(c.id);
            else setOpenItems((prev) => { const n = { ...prev }; delete n[c.id]; return n; });
          }}>
            {openItems[c.id] ? "▾ Hide items" : "▸ Items"}
          </button>

          {openItems[c.id] && (
            <div style={{ marginTop: 12 }}>
              {(openItems[c.id] || []).map((it) => (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: "1px solid rgba(150,150,150,.12)", fontSize: 13 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>
                      {it.status} · {it.scheduled_at ? fmt(it.scheduled_at) : "auto-slot"}
                      {it.link_url ? ` · ${it.link_url.slice(0, 40)}` : ""}
                    </div>
                  </div>
                  {it.status !== "posted" && (
                    <>
                      <button style={btn} disabled={busy === it.id} onClick={() => bumpItemTime(c.id, it.id, -1)}>−1h</button>
                      <button style={btn} disabled={busy === it.id} onClick={() => bumpItemTime(c.id, it.id, 1)}>+1h</button>
                      <button style={btnDanger} disabled={busy === it.id} onClick={() => deleteItem(c.id, it.id)}>✕</button>
                    </>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input style={input} placeholder="Post text / headline" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} />
                <input style={input} placeholder="Link URL (optional)" value={itemLink} onChange={(e) => setItemLink(e.target.value)} />
                <input style={{ ...input, gridColumn: "1 / -1" }} placeholder="Image URL (optional)" value={itemImage} onChange={(e) => setItemImage(e.target.value)} />
              </div>
              <button style={{ ...btnAccent, marginTop: 8 }} disabled={busy === c.id + "-add"} onClick={() => addItem(c.id)}>
                {busy === c.id + "-add" ? "…" : "＋ Add item"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
