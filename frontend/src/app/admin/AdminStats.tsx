"use client";
import { useEffect, useState } from "react";
import { DELETION_REASONS, deletionReasonLabel } from "@/lib/deletionReasons";

type SourceRow = {
  id: string; name: string | null; url: string; magazineId: string | null;
  status: string; tune: number; limit: number;
  deleteCount: number; moveCount: number; lastDeleteAt: string | null;
};
type Cnt = { sourceName?: string | null; reason?: string | null; cnt: number };
type LiveCnt = { sourceName?: string | null; live?: number; total?: number };
type Stats = {
  delBySource: Cnt[]; delByReason: Cnt[]; movesBySource: Cnt[]; liveBySource: LiveCnt[]; sources: SourceRow[];
};

const card: React.CSSProperties = { background: "#121519", border: "1px solid rgba(150,150,150,.18)", borderRadius: 12, padding: 16 };

async function api(path: string, method: string, body?: any) {
  const r = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Failed");
  return j;
}

export default function AdminStats() {
  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    try {
      const j = await (await fetch("/api/admin/stats")).json();
      if (j.error) { setErr(j.error); return; }
      setData(j);
    } catch { setErr("Failed to load stats"); }
  };
  useEffect(() => { load(); }, []);

  const tune = async (s: SourceRow, patch: any) => {
    setBusy(s.id);
    try { await api(`/api/admin/sources/${s.id}`, "PATCH", patch); await load(); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(""); }
  };

  const delSource = async (s: SourceRow) => {
    if (!confirm(`Delete source feed "${s.name || s.url}" permanently?`)) return;
    setBusy(s.id);
    try { await api(`/api/admin/sources/${s.id}`, "DELETE"); await load(); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(""); }
  };

  const reasons = new Map<string | null, number>();
  data?.delByReason.forEach((r) => reasons.set(r.reason ?? null, r.cnt));

  const nameOf = (s: Cnt) => s.sourceName || "";
  const health = (d: number, m: number) => {
    const raw = d * 4 + m; // deletions weighted higher
    return raw >= 8 ? "🔴 Troublesome" : raw >= 3 ? "🟠 Watch" : raw > 0 ? "🟡 OK" : "🟢 Good";
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {err && <div style={{ color: "#f87171", fontSize: 13 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        {/* Deletions by reason */}
        <div style={card}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>Why posts are deleted</h3>
          {reasons.size === 0 && <div style={{ opacity: .6, fontSize: 13 }}>No deletions recorded yet.</div>}
          {Array.from(reasons.entries()).sort((a, b) => b[1] - a[1]).map(([code, n]) => (
            <div key={code} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(150,150,150,.1)" }}>
              <span>{deletionReasonLabel(code || "other")}</span><b>{n}</b>
            </div>
          ))}
        </div>

        {/* Top deleted sources */}
        <div style={card}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>Top sources deleted from</h3>
          {data?.delBySource.length === 0 && <div style={{ opacity: .6, fontSize: 13 }}>None yet.</div>}
          {data?.delBySource.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(150,150,150,.1)" }}>
              <span>{s.sourceName}</span><b style={{ color: "#f87171" }}>{s.cnt}</b>
            </div>
          ))}
        </div>

        {/* Sources needing re-home (moves) */}
                <div style={card}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>Posts that needed moving</h3>
                  {data?.movesBySource.length === 0 && <div style={{ opacity: .6, fontSize: 13 }}>No moves yet.</div>}
                  {data?.movesBySource.map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(150,150,150,.1)" }}>
                      <span>{s.sourceName}</span><b style={{ color: "#fbbf24" }}>{s.cnt}</b>
                    </div>
                  ))}
                </div>

                {/* Published output per source (live) */}
                <div style={card}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>Published output by source</h3>
                  {data?.liveBySource.length === 0 && <div style={{ opacity: .6, fontSize: 13 }}>No published articles yet.</div>}
                  {data?.liveBySource.sort((a, b) => (b.live || 0) - (a.live || 0)).map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(150,150,150,.1)" }}>
                      <span title={s.sourceName ?? ""} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{s.sourceName}</span>
                      <b style={{ color: "#4ade80" }}>{s.live}</b>
                    </div>
                  ))}
                </div>
              </div>

      {/* Source health registry — tune / pause / delete */}
      <div style={card}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>
          Source health &amp; tuning <span style={{ opacity: .5, fontWeight: 400 }}>· tune ↓/↑, pause, or delete</span>
        </h3>
        {(!data || data.sources.length === 0) && <div style={{ opacity: .6, fontSize: 13 }}>No sources.</div>}
        {data?.sources.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(150,150,150,.12)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.name || s.url}
              </div>
              <div style={{ fontSize: 11, opacity: .6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 420 }}>{s.url}</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>{health(s.deleteCount, s.moveCount)}</div>
            </div>
            <div style={{ fontSize: 11, textAlign: "right", color: "#999", whiteSpace: "nowrap" }}>
              del {s.deleteCount} · moved {s.moveCount}
            </div>
            <button disabled={busy === s.id} onClick={() => tune(s, { tune: Math.max(-3, s.tune - 1) })}
              style={btn()}>−</button>
            <span style={{ width: 24, textAlign: "center", fontWeight: 800, color: s.tune > 0 ? "#34d399" : s.tune < 0 ? "#f87171" : "#aaa" }}>{s.tune}</span>
            <button disabled={busy === s.id} onClick={() => tune(s, { tune: Math.min(3, s.tune + 1) })}
              style={btn()}>+</button>
            <button disabled={busy === s.id}
              onClick={() => tune(s, { status: s.status === "paused" ? "active" : "paused" })}
              style={{ ...btn(), color: s.status === "paused" ? "#fbbf24" : "#999", borderColor: s.status === "paused" ? "rgba(251,191,36,.4)" : undefined }}>
              {s.status === "paused" ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button disabled={busy === s.id} onClick={() => delSource(s)}
              style={{ ...btn(), color: "#f87171" }}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const btn = () => ({
  background: "#1a1e24", color: "#eee", border: "1px solid rgba(150,150,150,.25)", borderRadius: 6,
  padding: "2px 8px", fontSize: 13, cursor: "pointer",
}) as any;