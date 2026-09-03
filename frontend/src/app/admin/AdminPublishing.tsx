"use client";
import { useEffect, useState } from "react";

// Publishing control tab — kill-switch, thresholds, per-source override, and the
// last-24h digest/queue. Consumes /api/admin/publishing-gate (GET/PATCH) and
// /api/admin/publishing-digest (GET). All state persists to pipeline_setting +
// source.auto_publish (data-driven; engine reads the same tables).

type SourceRow = {
  id: string; name: string; url: string; magazineId: string | null;
  magazineName: string | null; tune: number; deleteCount: number; moveCount: number;
  autoPublishOverride: "on" | "off" | null;
};

type DigestItem = { id: string; title: string; magazineName: string | null; sourceName: string | null };

export default function AdminPublishing() {
  const [killSwitch, setKillSwitch] = useState(false);
  const [until, setUntil] = useState("");
  const [thresholds, setThresholds] = useState({ maxDeleteCount: 2, maxMoveCount: 2, minTuneAutopublish: 0, minTuneApprove: -3 });
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [live, setLive] = useState<DigestItem[]>([]);
  const [queue, setQueue] = useState<DigestItem[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [queuedTotal, setQueuedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    try {
      const [g, d] = await Promise.all([
        fetch("/api/admin/publishing-gate").then(r => r.json()),
        fetch("/api/admin/publishing-digest").then(r => r.json()),
      ]);
      setKillSwitch(!!g.settings?.autoPublishEnabled);
      setUntil(g.settings?.autoPublishUntil || "");
      setThresholds({
        maxDeleteCount: g.thresholds?.maxDeleteCount ?? 2,
        maxMoveCount: g.thresholds?.maxMoveCount ?? 2,
        minTuneAutopublish: g.thresholds?.minTuneAutopublish ?? 0,
        minTuneApprove: g.thresholds?.minTuneApprove ?? -3,
      });
      setSources(g.perSource || []);
      setLiveTotal(g.digest?.last24hLiveTotal ?? 0);
      setQueuedTotal(g.digest?.queuedTotal ?? 0);
      setLive((d.autoPublished || []).map((a: any) => ({ id: a.id, title: a.title, magazineName: a.magazineName, sourceName: a.sourceName })));
      setQueue((d.queued || []).map((a: any) => ({ id: a.id, title: a.title, magazineName: a.magazineName, sourceName: a.sourceName })));
    } catch (e: any) {
      setErr("Failed to load: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveSettings() {
    setErr(""); setSaved("");
    const r = await fetch("/api/admin/publishing-gate", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoPublishEnabled: killSwitch, autoPublishUntil: until, ...thresholds }),
    });
    const j = await r.json();
    if (!r.ok) return setErr(j.error || "save failed");
    setSaved("Settings saved.");
    setKillSwitch(!!j.settings?.autoPublishEnabled);
    await load();
  }

  async function setSourceOverride(id: string, ov: "on" | "off" | null) {
    setErr(""); setSaved("");
    const r = await fetch("/api/admin/publishing-gate", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: id, autoPublishOverride: ov }),
    });
    const j = await r.json();
    if (!r.ok) return setErr(j.error || "override save failed");
    setSaved(j.applied?.overrideUpdated ? "Source override saved." : "Saved.");
    await load();
  }

  const set = (k: keyof typeof thresholds) => (e: any) =>
    setThresholds({ ...thresholds, [k]: Number(e.target.value) });

  return (
    <div style={{ fontFamily: "inherit" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>⚙️ Publishing</h2>
      <p style={{ margin: "0 0 16px", opacity: .7, fontSize: 13 }}>Two-tier auto-publish (auto-publish → queue → draft). Kill-switch is OFF = nothing auto-publishes.</p>

      {saved && <div style={{ color: "#39d353", fontSize: 13, margin: "0 0 12px" }}>✓ {saved}</div>}
      {err && <div style={{ color: "#ff6b6b", fontSize: 13, margin: "0 0 12px" }}>✗ {err}</div>}

      {/* Kill-switch */}
      <div style={{ padding: 16, background: "#13161a", borderRadius: 10, border: "1px solid rgba(150,150,150,.2)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>Auto-publish kill-switch</div>
            <div style={{ opacity: .65, fontSize: 12, marginTop: 2 }}>
              {killSwitch ? "ON — healthy sources auto-publish to live" : "OFF — everything goes to draft (human review)"}
            </div>
          </div>
          <button onClick={() => setKillSwitch(!killSwitch)}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid " + (killSwitch ? "#ff6b6b" : "var(--accent,#ffd700)"), background: killSwitch ? "rgba(255,107,107,.15)" : "rgba(255,215,0,.12)", color: killSwitch ? "#ff6b6b" : "var(--accent,#ffd700)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 12, cursor: "pointer" }}>
            {killSwitch ? "TURN OFF" : "TURN ON"}
          </button>
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12, opacity: .8 }}>
          <label>Auto-off by (ISO timestamp, blank = never):</label>
          <input value={until} onChange={(e) => setUntil(e.target.value)} placeholder="2026-08-20T12:00:00+00:00"
            style={{ background: "#0d0f12", border: "1px solid rgba(150,150,150,.3)", color: "inherit", padding: "6px 10px", borderRadius: 6, fontSize: 12, flex: 1 }} />
        </div>
      </div>

      {/* Thresholds */}
      <div style={{ padding: 16, background: "#13161a", borderRadius: 10, border: "1px solid rgba(150,150,150,.2)", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Health thresholds</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          {([["maxDeleteCount","Max deletes before demote"],["maxMoveCount","Max moves before demote"],["minTuneAutopublish","Min tune to auto-publish"],["minTuneApprove","Min tune to even queue"]] as const).map(([key, label]) => (
            <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              <span style={{ opacity: .7 }}>{label}</span>
              <input type="number" value={thresholds[key]} onChange={set(key)} onBlur={saveSettings}
                style={{ background: "#0d0f12", border: "1px solid rgba(150,150,150,.3)", color: "inherit", padding: "6px 10px", borderRadius: 6, fontSize: 13 }} />
            </label>
          ))}
        </div>
        <button onClick={saveSettings} style={{ marginTop: 12, padding: "8px 18px", borderRadius: 8, border: "1px solid var(--accent,#ffd700)", background: "rgba(255,215,0,.12)", color: "var(--accent,#ffd700)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Save settings</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Per-source override */}
        <div style={{ padding: 16, background: "#13161a", borderRadius: 10, border: "1px solid rgba(150,150,150,.2)" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Per-source override</div>
          <div style={{ opacity: .65, fontSize: 12, marginBottom: 10 }}>force: on = always auto-publish, off = never, — = follow global/health</div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {sources.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(150,150,150,.1)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ fontSize: 11, opacity: .6 }}>{s.magazineName || "—"} · tune {s.tune} · d{s.deleteCount} m{s.moveCount}</div>
                </div>
                <select value={s.autoPublishOverride ?? "follow-global"} onChange={(e) => setSourceOverride(s.id, (e.target.value === "follow-global" ? null : e.target.value) as any)}
                  style={{ background: "#0d0f12", border: "1px solid rgba(150,150,150,.3)", color: "inherit", padding: "4px 6px", borderRadius: 6, fontSize: 12 }}>
                  <option value="follow-global">—</option>
                  <option value="on">on</option>
                  <option value="off">off</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Digest */}
        <div style={{ padding: 16, background: "#13161a", borderRadius: 10, border: "1px solid rgba(150,150,150,.2)" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Last 24h</div>
          <div style={{ fontSize: 12, opacity: .7, marginBottom: 10 }}>{liveTotal} auto-published · {queuedTotal} queued (approved)</div>
          <div style={{ fontWeight: 700, fontSize: 13, margin: "12px 0 4px" }}>🟢 Auto-published</div>
          <div style={{ maxHeight: 140, overflowY: "auto", opacity: .85 }}>
            {live.length === 0 && <div style={{ fontSize: 12, opacity: .6 }}>None</div>}
            {live.map((a) => <div key={a.id} style={{ fontSize: 12, padding: "3px 0", borderBottom: "1px solid rgba(150,150,150,.08)" }}>{a.title} <span style={{ opacity: .55 }}>· {a.magazineName}</span></div>)}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, margin: "12px 0 4px" }}>🟡 Queued (approved)</div>
          <div style={{ maxHeight: 140, overflowY: "auto", opacity: .85 }}>
            {queue.length === 0 && <div style={{ fontSize: 12, opacity: .6 }}>None</div>}
            {queue.map((a) => <div key={a.id} style={{ fontSize: 12, padding: "3px 0", borderBottom: "1px solid rgba(150,150,150,.08)" }}>{a.title} <span style={{ opacity: .55 }}>· {a.magazineName}</span></div>)}
          </div>
          <button onClick={load} style={{ marginTop: 12, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(150,150,150,.3)", background: "transparent", color: "inherit", fontSize: 12, cursor: "pointer" }}>↻ Refresh</button>
        </div>
      </div>
    </div>
  );
}