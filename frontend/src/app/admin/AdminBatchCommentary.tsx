"use client";
import { useState, useEffect, useCallback } from "react";

type PerMagazine = { id: string; name: string; total: number; missing: number };
type Stats = { total: number; missing: number; perMagazine: PerMagazine[] };
type BatchResult = {
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
  succeededList: { id: string; title: string; agent: string }[];
  failedList: { id: string; title: string; error: string }[];
};

export default function AdminBatchCommentary() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; succeeded: number; failed: number }>({ done: 0, total: 0, succeeded: 0, failed: 0 });
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/batch-commentary")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => { setLoading(false); setError("Failed to load commentary stats"); });
  }, []);

  const runBatch = useCallback(async () => {
    if (!stats || running) return;
    setRunning(true);
    setResult(null);
    setError("");

    let totalSucceeded = 0;
    let totalFailed = 0;
    let remaining = stats.missing;
    const allSucceeded: any[] = [];
    const allFailed: any[] = [];

    while (remaining > 0) {
      const resp = await fetch("/api/admin/batch-commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 20, delayMs: 1200 }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        setError(err.error || `HTTP ${resp.status}`);
        break;
      }

      const data: BatchResult = await resp.json();
      totalSucceeded += data.succeeded;
      totalFailed += data.failed;
      remaining = data.remaining;
      allSucceeded.push(...data.succeededList);
      allFailed.push(...data.failedList);

      setProgress({ done: totalSucceeded + totalFailed, total: stats.missing, succeeded: totalSucceeded, failed: totalFailed });

      if (remaining === 0) break;
      // Brief pause between batches
      await new Promise((r) => setTimeout(r, 500));
    }

    setResult({ processed: totalSucceeded + totalFailed, succeeded: totalSucceeded, failed: totalFailed, remaining, succeededList: allSucceeded, failedList: allFailed });
    setRunning(false);

    // Refresh stats
    const fresp = await fetch("/api/admin/batch-commentary");
    const fdata = await fresp.json();
    setStats(fdata);
  }, [stats, running]);

  if (loading) {
    return (
      <div style={{ padding: "12px 16px", margin: "8px 0", background: "#13161a", borderRadius: 8, border: "1px solid rgba(150,150,150,.15)", fontSize: 13, color: "#888" }}>
        Loading commentary coverage stats...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div style={{ padding: "12px 16px", margin: "8px 0", background: "#13161a", borderRadius: 8, border: "1px solid rgba(150,150,150,.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: "var(--accent, #ffd700)" }}>
          💬 Commentary Coverage
        </div>
        <div style={{ fontSize: 13, color: "#aaa" }}>
          {stats.total} articles · <span style={{ color: stats.missing > 0 ? "#ff6b6b" : "#4ade80", fontWeight: 700 }}>{stats.missing} missing</span>
        </div>
      </div>

      {/* Compact per-magazine coverage bar */}
      <div style={{ fontSize: 12, marginBottom: 10, color: "#ccc", lineHeight: 1.6 }}>
        {stats.perMagazine.map((m) => {
          const pct = m.total > 0 ? Math.round((m.missing / m.total) * 100) : 0;
          return (
            <span key={m.id} style={{ display: "inline-block", marginRight: 12, marginBottom: 2 }}>
              <span style={{ fontWeight: 600 }}>{m.name}</span>{" "}
              {pct > 0 ? (
                <span style={{ color: pct > 50 ? "#ff6b6b" : pct > 0 ? "#ffa94d" : "#aaa" }}>
                  {m.missing}/{m.total} ({pct}%)
                </span>
              ) : (
                <span style={{ color: "#4ade80" }}>✅ {m.total}</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Progress bar */}
      {running && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ height: 6, background: "#1a1e24", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, (progress.done / progress.total) * 100)}%`, background: "linear-gradient(90deg, #ffd700, #ffa94d)", borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
            {progress.done}/{progress.total} · ✅ {progress.succeeded} · ❌ {progress.failed}
          </div>
        </div>
      )}

      {/* Result summary */}
      {result && !running && (
        <div style={{ fontSize: 12, marginBottom: 10, padding: "6px 10px", borderRadius: 6, background: result.failed === 0 ? "rgba(74,222,128,.08)" : "rgba(255,107,107,.08)", color: "#ccc" }}>
          {result.succeeded > 0 && <span style={{ color: "#4ade80" }}>✅ {result.succeeded} generated</span>}
          {result.failed > 0 && <span style={{ color: "#ff6b6b", marginLeft: 12 }}>❌ {result.failed} failed</span>}
          {result.remaining > 0 && <span style={{ color: "#ffa94d", marginLeft: 12 }}>⏳ {result.remaining} remaining (re-run to continue)</span>}
          {result.remaining === 0 && result.failed === 0 && <span style={{ color: "#4ade80", marginLeft: 12 }}>🎉 All done!</span>}
          {result.failedList.length > 0 && (
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: "pointer", color: "#ff6b6b" }}>Show failures ({result.failedList.length})</summary>
              <div style={{ marginTop: 4, maxHeight: 120, overflow: "auto" }}>
                {result.failedList.map((f) => (
                  <div key={f.id} style={{ padding: "2px 0", borderBottom: "1px solid rgba(150,150,150,.1)" }}>
                    <span style={{ fontWeight: 600 }}>{f.title?.slice(0, 40)}</span>: <span style={{ color: "#ff6b6b", fontSize: 11 }}>{f.error}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: "#ff6b6b", marginBottom: 8 }}>{error}</div>}

      {/* Generate button */}
      <button
        onClick={runBatch}
        disabled={running || stats.missing === 0}
        style={{
          padding: "8px 20px", borderRadius: 6, border: "none",
          background: stats.missing === 0 ? "#2a2e34" : running ? "#2a2e34" : "linear-gradient(135deg, #ffd700, #ffa94d)",
          color: stats.missing === 0 ? "#666" : running ? "#888" : "#0b0e11",
          fontWeight: 700, fontSize: 13, cursor: stats.missing === 0 || running ? "not-allowed" : "pointer",
          opacity: stats.missing === 0 ? 0.5 : 1,
        }}
      >
        {running ? "⏳ Generating..." : stats.missing === 0 ? "✅ All done" : `🚀 Generate ${stats.missing} missing commentaries`}
      </button>

      {stats.missing === 0 && !running && (
        <span style={{ fontSize: 12, color: "#4ade80", marginLeft: 10 }}>All articles have AI commentary 🎉</span>
      )}
    </div>
  );
}