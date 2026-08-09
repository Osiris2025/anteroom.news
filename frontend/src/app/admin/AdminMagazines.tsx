"use client";
import { useEffect, useState } from "react";

type Mag = {
  id: string; name: string; tagline: string | null; description: string | null;
  tone: string | null; agentName: string | null; agentModel: string | null; colors: any;
};
const btn: React.CSSProperties = { padding: "5px 9px", borderRadius: 6, border: "1px solid rgba(150,150,150,.25)", background: "#1a1d21", color: "#ccc", fontSize: 12, cursor: "pointer" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "7px 9px", marginTop: 4, borderRadius: 6, border: "1px solid rgba(150,150,150,.3)", background: "#111", color: "#e6e6e6", fontSize: 13 };
const MODEL_OPTIONS = ["deepseek/deepseek-v4-flash-0731", "openai/gpt-4o-mini", "anthropic/claude-3.5-haiku", "meta-llama/llama-3.3-70b-instruct", "google/gemini-1.5-flash"];

const DEFAULT_NAMES: Record<string, string> = {
  "weekly-weird-news": "Max the Cryptid Reporter", "weird-and-wild": "Dr. Vera Quark",
  "tech-pulse": "Ada Circuit", "poli-split": "Deacon Rift", "climate-watch": "Terra Bloom",
  "startup-signal": "Nova Kicker", "oss-report": "Patch Reyes",
};

function MagCard({ m, onPatch, notify }: { m: Mag; onPatch: (id: string, patch: any) => Promise<void>; notify: (msg: string) => void }) {
  const [agentName, setAgentName] = useState(m.agentName || "");
  const [agentModel, setAgentModel] = useState(m.agentModel || MODEL_OPTIONS[0]);
  const [tagline, setTagline] = useState(m.tagline || "");
  const [desc, setDesc] = useState(m.description || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onPatch(m.id, { agentName: agentName.trim() || null, agentModel, tagline: tagline.trim() || null, description: desc.trim() || null });
      notify(`Saved ${m.name}`);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ border: "1px solid rgba(150,150,150,.15)", borderRadius: 10, padding: 14, background: "var(--card-bg, rgba(255,255,255,.03))" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent,#ffd700)" }} />
        <b style={{ fontSize: 15, color: "#e6e6e6" }}>{m.name}</b>
        <span style={{ fontSize: 11, opacity: 0.5, marginLeft: "auto" }}>{m.id}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--accent,#ffd700)", marginBottom: 10 }}>Agent: {m.agentName || DEFAULT_NAMES[m.id] || "—"}</div>

      <label style={{ fontSize: 11, opacity: 0.7, display: "block", marginBottom: 8 }}>AI Agent name
        <input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="e.g. Ada Circuit" style={input} />
      </label>
      <label style={{ fontSize: 11, opacity: 0.7, display: "block", marginBottom: 8 }}>AI Agent model
        <select value={agentModel} onChange={(e) => setAgentModel(e.target.value)} style={input}>
          {MODEL_OPTIONS.map((md) => <option key={md} value={md}>{md}</option>)}
        </select>
      </label>
      <label style={{ fontSize: 11, opacity: 0.7, display: "block", marginBottom: 8 }}>Tagline
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} style={input} />
      </label>
      <label style={{ fontSize: 11, opacity: 0.7, display: "block", marginBottom: 10 }}>Description
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} style={{ ...input, resize: "vertical" }} />
      </label>
      <button onClick={save} disabled={saving} style={{ ...btn, background: "#0b5a", borderColor: "rgba(52,211,153,.4)", color: "#34d399", fontWeight: 700 }}>{saving ? "Saving…" : "💾 Save"}</button>
    </div>
  );
}

export default function AdminMagazines() {
  const [mags, setMags] = useState<Mag[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => {
    fetch("/api/admin/magazines").then((r) => r.json())
      .then((j) => { if (j.error) setErr(j.error); else setMags(j.magazines || []); })
      .catch((e) => setErr(e.message));
  };
  useEffect(() => { load(); }, []);

  const patch = async (id: string, body: any) => {
    const r = await fetch(`/api/admin/magazines/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.error) setErr(j.error); else load();
  };
  const notify = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  const create = async () => {
    const name = prompt("New magazine name:");
    if (!name || !name.trim()) return;
    const slug = prompt("Slug (lowercase, dashes). Blank = auto:", "");
    const agentName = prompt("AI agent name:", "") || null;
    const agentModel = prompt("AI agent model (blank = default):", MODEL_OPTIONS[0]) || MODEL_OPTIONS[0];
    const r = await fetch("/api/admin/magazines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), id: slug || undefined, agentName, agentModel }) });
    const j = await r.json();
    if (j.error) setErr(j.error); else { setCreating(false); load(); notify(`Created ${j.magazine?.name}`); }
  };

  return (
    <div>
      {err && <div style={{ background: "#3a0a0a", color: "#f87171", padding: 10, borderRadius: 6, marginBottom: 14 }}>{err}</div>}
      {msg && <div style={{ background: "#00331f", color: "#34d399", padding: 10, borderRadius: 6, marginBottom: 14 }}>{msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.65 }}>Per-magazine AI agents — edit the named agent + model that writes on-site commentary.</div>
        <button onClick={create} style={{ ...btn, color: "var(--accent,#ffd700)", borderColor: "rgba(255,215,0,.4)" }}>＋ New Magazine</button>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
        {mags.map((m) => <MagCard key={m.id} m={m} onPatch={patch} notify={notify} />)}
      </div>
      {mags.length === 0 && <div style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>Loading…</div>}
    </div>
  );
}