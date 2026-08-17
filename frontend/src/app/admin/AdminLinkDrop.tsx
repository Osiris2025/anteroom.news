"use client";
import { useState, useEffect } from "react";

const btn: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid rgba(150,150,150,.25)",
  background: "#1a1d21",
  color: "#ccc",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const activeBtn: React.CSSProperties = {
  ...btn,
  background: "rgba(255,215,0,.12)",
  borderColor: "rgba(255,215,0,.4)",
  color: "#ffd700",
};

export default function AdminLinkDrop() {
  const [url, setUrl] = useState("");
  const [mag, setMag] = useState("auto");
  const [magazines, setMagazines] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    article?: any;
    ai_commentary?: string;
    detected_magazine_id?: string | null;
  } | null>(null);
  const [err, setErr] = useState("");

  // Load magazine list once on mount
  useEffect(() => {
    fetch("/api/admin/magazines")
      .then((r) => r.json())
      .then((d) => {
        if (d.magazines) setMagazines(d.magazines);
      })
      .catch(() => {});
  }, []);

  const handleDrop = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setErr("");

    try {
      const r = await fetch("/api/admin/link-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          magazineId: mag === "auto" ? null : mag,
        }),
      });
      const data = await r.json();
      if (data.error) {
        setErr(data.error);
        setResult({ ok: false, message: data.error });
      } else {
        setResult({
          ok: true,
          message: `✅ "${data.article.title}" dropped as draft`,
          article: data.article,
          ai_commentary: data.ai_commentary,
          detected_magazine_id: data.detected_magazine_id,
        });
        setUrl("");
      }
    } catch (e: any) {
      setErr(e.message || "Network error");
      setResult({ ok: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          background: "rgba(255,215,0,.04)",
          border: "1px dashed rgba(255,215,0,.25)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <span>🔗 Link Dropper</span>
          <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.6 }}>
            Paste a URL — AI interrogates it and drops as draft
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input
            placeholder="Paste a URL here…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDrop()}
            style={{
              flex: "1 1 300px",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid rgba(150,150,150,.3)",
              background: "#111",
              color: "#e6e6e6",
              fontSize: 14,
              minWidth: 200,
            }}
          />

          <select
            value={mag}
            onChange={(e) => setMag(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(150,150,150,.3)",
              background: "#111",
              color: "#e6e6e6",
              fontSize: 13,
              cursor: "pointer",
              minWidth: 150,
            }}
          >
            <option value="auto">↗ AI Auto-detect</option>
            {magazines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleDrop}
            disabled={loading || !url.trim()}
            style={{
              ...(loading ? btn : activeBtn),
              opacity: loading || !url.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "⏳ AI Interrogating…" : "⬇ Drop Article"}
          </button>
        </div>

        {loading && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              background: "#111",
              borderRadius: 8,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>🔍</span>
            <span>Fetching the URL, extracting content, and running AI analysis (magazine detection + summary + commentary)…</span>
          </div>
        )}

        {err && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              background: "#3a0a0a",
              borderRadius: 8,
              fontSize: 13,
              color: "#f87171",
            }}
          >
            ⚠ {err}
          </div>
        )}

        {result?.ok && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              background: "#0a2a1a",
              borderRadius: 8,
              fontSize: 13,
              color: "#34d399",
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              ✅ Draft created!
            </div>
            <div style={{ opacity: 0.8 }}>{result.article?.title}</div>

            {result.detected_magazine_id && (
              <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, background: "rgba(88,166,255,.15)", color: "#58a6ff", padding: "2px 8px", borderRadius: 4 }}>
                  📂 {magazines.find((m) => m.id === result.detected_magazine_id)?.name || result.detected_magazine_id}
                </span>
              </div>
            )}

            {result.article?.summary && (
              <div style={{ opacity: 0.6, marginTop: 6, fontSize: 12 }}>
                {result.article.summary.slice(0, 300)}
                {result.article.summary.length > 300 ? "…" : ""}
              </div>
            )}

            {result.ai_commentary && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer", fontSize: 11, opacity: 0.6, userSelect: "none" }}>
                  📝 AI Commentary ({result.ai_commentary.split(" ").length} words)
                </summary>
                <div style={{ marginTop: 6, padding: 10, background: "#0d1b2a", borderRadius: 6, fontSize: 12, lineHeight: 1.5, opacity: 0.8, whiteSpace: "pre-wrap" }}>
                  {result.ai_commentary}
                </div>
              </details>
            )}

            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, opacity: 0.5 }}>
                ingress: admin-link · id: {result.article?.id}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, opacity: 0.6 }}>
                💡 Use the Inbox tab to review, approve, and publish this article. The magazine and AI-generated content can be edited before publishing.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}