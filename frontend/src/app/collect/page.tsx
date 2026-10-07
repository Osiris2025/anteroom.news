"use client";
import { useState, useEffect } from "react";
import { authClient, useSession } from "@/lib/auth-client";

/**
 * CollectPage — Link collector for any signed-in user (C7 Raindrop-style).
 * Shows a bookmarklet drag link + URL input for direct paste.
 * Uses /api/collect which auto-detects magazine and checks suitability.
 */
export default function CollectPage() {
  const { data: session } = useSession();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    article?: any;
    magazine?: { id: string; name: string } | null;
    warnings?: { level: string; message: string }[];
    suitabilityOk?: boolean;
  } | null>(null);
  const [err, setErr] = useState("");
  const [dup, setDup] = useState<{ url: string; title: string; status: string; magazineName?: string | null } | null>(null);

  // Bookmarklet JavaScript code
  const bookmarkletCode = `javascript:(function(){
  const u=location.href;
  fetch("https://nexus.osiris2025.com/api/collect",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    credentials:"include",
    body:JSON.stringify({url:u})
  }).then(r=>r.json()).then(d=>{
    if(d.error) alert("Anteroom: "+d.error);
    else alert("Anteroom: \\""+(d.article?.title||"Saved")+"\\" saved as draft"+(d.magazine?" in "+d.magazine.name:"")+"!");
  }).catch(e=>alert("Anteroom error: "+e.message));
})();`;

  const handleCollect = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setErr("");
    setDup(null);

    try {
      const r = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await r.json();
      if (data.duplicate) {
        setDup(data.duplicate);
        setResult({ ok: false, message: data.error });
      } else if (data.error) {
        setErr(data.error);
        setResult({ ok: false, message: data.error });
      } else {
        setResult(data);
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
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--accent, #ffd700)", fontWeight: 800, marginBottom: 4 }}>
          Link Collector
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.05, margin: 0, letterSpacing: -0.5 }}>
          🔗 Save links to Anteroom
        </h1>
        <p style={{ fontSize: 15, opacity: 0.7, marginTop: 8, lineHeight: 1.5 }}>
          Drop any article URL — AI auto-detects the best magazine, checks suitability,
          and saves it as a draft in the Dispatch Desk for review.
        </p>
      </div>

      {/* Session check */}
      {!session ? (
        <div style={{ padding: 20, borderRadius: 10, border: "1px dashed rgba(255,215,0,.3)", background: "rgba(255,215,0,.04)", textAlign: "center" }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Sign in to start collecting links</div>
          <button
            onClick={() => window.location.href = "/profile"}
            style={{
              padding: "10px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer",
              border: "1px solid var(--accent, #ffd700)", background: "rgba(255,215,0,.12)", color: "var(--accent, #ffd700)", fontSize: 14,
            }}
          >
            Sign In / Sign Up
          </button>
        </div>
      ) : (
        <>
          {/* Bookmarklet */}
          <div style={{
            padding: 20, borderRadius: 10, border: "1px dashed rgba(255,215,0,.25)",
            background: "rgba(255,215,0,.04)", marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📌 Bookmarklet</span>
              <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.6 }}>
                Drag this to your bookmarks bar — click it on any article to save instantly
              </span>
            </div>
            <a
              href={bookmarkletCode}
              onClick={(e) => {
                // Drag-only; clicking is a fallback that doesn't work well
                e.preventDefault();
              }}
              draggable
              style={{
                display: "inline-block", padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: "grab",
                border: "1px solid var(--accent, #ffd700)", background: "rgba(255,215,0,.12)", color: "var(--accent, #ffd700)",
                textDecoration: "none", fontSize: 14, userSelect: "none",
              }}
            >
              ⚡ Save to Anteroom
            </a>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
              Drag the button above to your browser&apos;s bookmarks bar
            </div>
          </div>

          {/* URL input */}
          <div style={{
            padding: 20, borderRadius: 10, border: "1px solid rgba(150,150,150,.15)",
            background: "var(--card-bg, rgba(255,255,255,.03))", marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>✏️ Or paste a URL</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                placeholder="Paste a URL here…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCollect()}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8,
                  border: "1px solid rgba(150,150,150,.3)", background: "#111",
                  color: "#e6e6e6", fontSize: 14,
                }}
              />
              <button
                onClick={handleCollect}
                disabled={loading || !url.trim()}
                style={{
                  padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                  border: "1px solid rgba(255,215,0,.4)", background: loading ? "#333" : "rgba(255,215,0,.12)",
                  color: loading ? "#999" : "var(--accent, #ffd700)", fontSize: 14,
                  opacity: loading || !url.trim() ? 0.5 : 1,
                }}
              >
                {loading ? "⏳ Analyzing…" : "Collect"}
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ padding: 16, borderRadius: 8, background: "#111", marginBottom: 14, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <span>Fetching the URL, extracting metadata, and analyzing with AI…</span>
            </div>
          )}

          {/* Error */}
          {err && (
            <div style={{ padding: 14, borderRadius: 8, background: "#3a0a0a", marginBottom: 14, fontSize: 13, color: "#f87171" }}>
              ⚠ {err}
            </div>
          )}

          {/* Already on the site */}
          {dup && (
            <div style={{ padding: 14, borderRadius: 8, background: "rgba(88,166,255,.08)", border: "1px solid rgba(88,166,255,.3)", marginBottom: 14, fontSize: 13, color: "#9ecbff", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>ℹ Already on the site</div>
              <div style={{ marginTop: 4 }}>
                <a href={dup.url} target="_blank" rel="noopener noreferrer" style={{ color: "#58a6ff", textDecoration: "underline" }}>
                  {dup.title}
                </a>
              </div>
              <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
                Status: {dup.status}
                {dup.magazineName ? ` · ${dup.magazineName}` : ""}
              </div>
            </div>
          )}

          {/* Success result */}
          {result?.ok && (
            <div style={{ padding: 18, borderRadius: 10, background: "#0a2a1a", marginBottom: 14, fontSize: 13, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>
                ✅ Saved to your drafts!
              </div>
              <div style={{ opacity: 0.9, marginBottom: 4 }}>{result.article?.title}</div>

              {/* Auto-detected magazine */}
              {result.magazine && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>📰 Assigned to:</span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: "rgba(255,215,0,.12)", color: "var(--accent, #ffd700)",
                  }}>
                    {result.magazine.name}
                  </span>
                </div>
              )}

              {/* Suitability warnings */}
              {result.warnings && result.warnings.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {result.warnings.map((w: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: "6px 10px", borderRadius: 6, marginBottom: 4, fontSize: 12,
                        background: w.level === "block" ? "#3a0a0a" : w.level === "warn" ? "#3a2f00" : "rgba(150,150,150,.1)",
                        color: w.level === "block" ? "#f87171" : w.level === "warn" ? "#ffd700" : "#aaa",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <span>{w.level === "block" ? "🚫" : w.level === "warn" ? "⚠" : "ℹ"}</span>
                      <span>{w.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, opacity: 0.6 }}>
                  💡 Visit the <a href="/admin" style={{ color: "var(--accent, #ffd700)" }}>Dispatch Desk</a> → Inbox to review, approve, and publish.
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* How it works section */}
      <div style={{
        marginTop: 32, padding: 20, borderRadius: 10,
        border: "1px solid rgba(150,150,150,.1)",
        background: "var(--card-bg, rgba(255,255,255,.02))",
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>How it works</h3>
        <ol style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.8, margin: 0, paddingLeft: 20 }}>
          <li><strong>Collect</strong> — paste any article URL (or use the bookmarklet while browsing)</li>
          <li><strong>AI analyzes</strong> — our AI reads the title and description, auto-detects the best-fit magazine, and checks for suitability concerns</li>
          <li><strong>Queued as draft</strong> — the article lands in the Dispatch Desk inbox for an editor to review, approve, and publish</li>
          <li><strong>Review queue</strong> — every article must be reviewed before going live (human-in-the-loop)</li>
        </ol>
      </div>
    </div>
  );
}