"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ArticleComments from "./ArticleComments";
import ArticleEfx from "./ArticleEfx";
import { hostOf, sourceLabel } from "@/lib/sourceUtil";

type ReaderArticle = {
  id: string;
  title: string;
  headline?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  imageUrl?: string | null;
  efx?: string | null;
  summary?: string | null;
  commentary?: string | null;
  subcategory?: string | null;
  publishedAt?: string | null;
};
type ReaderMag = { id: string; name: string; agentName?: string | null; agentModel?: string | null } | null;

// palette(themeId) — concrete colors per theme so the reader re-skins cleanly for
// EVERY theme (dark + light). Never returns null (avoids TS style-prop rejects).
function palette(themeId: string) {
  const dark: Record<string, { box: string; border: string; ink: string; body: string; accent: string; img: string }> = {
    linear:    { box: "#0f1011", border: "#26282c", ink: "#f7f8f8", body: "#c9cdd4", accent: "#7170ff", img: "linear-gradient(135deg,#1a1a2e,#0f1011)" },
    terminal:  { box: "#001100", border: "#00ff40", ink: "#00ff00", body: "#00cc00", accent: "#00ff00", img: "linear-gradient(135deg,#002200,#000)" },
    crt:       { box: "#001100", border: "#00ff40", ink: "#00ff00", body: "#00cc00", accent: "#00ff00", img: "linear-gradient(135deg,#002200,#000)" },
    glass:     { box: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)", ink: "#fff", body: "#d6d3f0", accent: "#a5b4fc", img: "linear-gradient(135deg,#302b63,#0f0c29)" },
    dashboard: { box: "#111826", border: "#1f2a3d", ink: "#e8edf5", body: "#aab6c8", accent: "#38bdf8", img: "linear-gradient(135deg,#0a0e17,#1a2438)" },
    crawler:   { box: "#1c1c1c", border: "#333", ink: "#eee", body: "#c9c9c9", accent: "#f87171", img: "linear-gradient(135deg,#2a0000,#111)" },
    ticker:    { box: "#111826", border: "#1f2a3d", ink: "#e8edf5", body: "#aab6c8", accent: "#fbbf24", img: "linear-gradient(135deg,#1a1a3e,#16213e)" },
    board:     { box: "#3a2417", border: "#5c3a22", ink: "#d4a574", body: "#c69a6d", accent: "#e8b890", img: "linear-gradient(135deg,#2c1810,#4a2f1a)" },
    audio:     { box: "#161b22", border: "#2d333b", ink: "#c9d1d9", body: "#a5b0bd", accent: "#58a6ff", img: "linear-gradient(135deg,#0d1117,#1f2937)" },
    social:    { box: "#16181c", border: "#2f3336", ink: "#e7e9ea", body: "#c2c5c9", accent: "#1d9bf0", img: "linear-gradient(135deg,#000,#101418)" },
    map:       { box: "#101627", border: "#1e2a3e", ink: "#c8d6e5", body: "#9fb0c4", accent: "#00d4aa", img: "linear-gradient(135deg,#0a0e17,#16213e)" },
    deco:      { box: "#241f38", border: "#4a3f63", ink: "#e8d5b7", body: "#d4c3a8", accent: "#e6b96a", img: "linear-gradient(135deg,#1a1a2e,#3a2f52)" },
  };
  if (dark[themeId]) return dark[themeId];

  const light: Record<string, { box: string; border: string; ink: string; body: string; accent: string; img: string }> = {
    tabloid:   { box: "#fbf5e9", border: "#d0c4a8", ink: "#1a1a1a", body: "#4a4038", accent: "#c1121f", img: "linear-gradient(135deg,#ffe14d,#f6efe0)" },
    vercel:    { box: "#ffffff", border: "#e0e0e0", ink: "#171717", body: "#666", accent: "#0072f5", img: "linear-gradient(135deg,#f0f0f0,#fff)" },
    magazine:  { box: "#f8f9fa", border: "#e6e6e6", ink: "#1a1a1a", body: "#666", accent: "#667eea", img: "linear-gradient(135deg,#e9edfd,#fff)" },
    blog:      { box: "#ffffff", border: "#eee", ink: "#333", body: "#777", accent: "#333", img: "linear-gradient(135deg,#f5f5f5,#fff)" },
    spread:    { box: "#f0ece4", border: "#d8ccb8", ink: "#1a1a1a", body: "#5a5242", accent: "#8a1d24", img: "linear-gradient(135deg,#f0ece4,#faf8f5)" },
    water:     { box: "rgba(255,255,255,0.7)", border: "#e6dcc8", ink: "#2d2d2d", body: "#6a5a4a", accent: "#60a5fa", img: "linear-gradient(135deg,#fef9ef,#e8f0fe)" },
    cardwall:  { box: "#ffffff", border: "#e5e7eb", ink: "#1a1a2e", body: "#5a5a6a", accent: "#667eea", img: "linear-gradient(135deg,#eef1fb,#fff)" },
    split:     { box: "#ffffff", border: "#e0e0e0", ink: "#1a1a1a", body: "#555", accent: "#fbbf24", img: "linear-gradient(135deg,#fcf8ec,#fff)" },
  };
  return light[themeId] || { box: "#f5f5f7", border: "#dedfe3", ink: "#1a1a1a", body: "#444", accent: "#666", img: "linear-gradient(135deg,#eee,#fff)" };
}

export default function ArticleReader({ article, magazine, themeId }: { article: ReaderArticle; magazine: ReaderMag; themeId: string }) {
  const C = palette(themeId);
  const router = useRouter();
  const { title, headline, sourceUrl, sourceName, imageUrl, efx, summary, commentary, subcategory, publishedAt } = article;
  const magName = magazine?.name || "AI News Nexus";
  const agentName = magazine?.agentName || "The Desk";
  const displayTitle = headline || title;
  // Deeper history than the app root means the reader was reached by navigation
  // (e.g. from a magazine page or AI model page) — so "Back" should pop history.
  const backFallback = magazine?.id ? `/magazines/${magazine.id}` : "/";

  // Bookmark state
  const [bookmarked, setBookmarked] = useState(false);
  const [bmId, setBmId] = useState<string | null>(null);
  const [bmLoading, setBmLoading] = useState(false);

  // Check if current article is bookmarked
  const checkBookmark = async () => {
    try {
      const r = await fetch("/api/bookmarks");
      const j = await r.json();
      if (j.bookmarks) {
        const found = j.bookmarks.find((b: any) => b.articleId === article.id);
        if (found) { setBookmarked(true); setBmId(found.id); }
      }
    } catch {}
  };
  useEffect(() => { checkBookmark(); }, [article.id]);

  // Toggle bookmark
  const toggleBookmark = async () => {
    setBmLoading(true);
    try {
      const r = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: article.id }),
      });
      const j = await r.json();
      setBookmarked(j.bookmarked);
      if (j.bookmarked) setBmId(j.id); else setBmId(null);
    } catch {}
    setBmLoading(false);
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* sticky Back bar — always visible while reading (esp. on mobile) */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, marginBottom: 14, padding: "10px 0",
        background: C.box,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent", border: "none", cursor: "pointer", color: C.accent,
            fontWeight: 700, fontFamily: "inherit", fontSize: 13, padding: "6px 10px", borderRadius: 8,
            display: "inline-flex", alignItems: "center", gap: 6, margin: "-4px -8px",
          }}
        >
          <span style={{ fontSize: 15 }}>&larr;</span> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.body }}>{publishedAt ? new Date(publishedAt).toLocaleDateString() : ""}</span>
          {/* Bookmark toggle */}
          <button
            onClick={toggleBookmark}
            disabled={bmLoading}
            title={bookmarked ? "Remove bookmark" : "Save for later"}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: bookmarked ? C.accent : C.body, fontSize: 18, padding: "4px",
              opacity: bmLoading ? 0.5 : 1, lineHeight: 1,
            }}
          >
            {bookmarked ? "\u2605" : "\u2606"}
          </button>
        </div>
      </div>
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 800, color: C.accent, marginBottom: 14 }}>
        <Link href={backFallback} style={{ color: C.accent, textDecoration: "none" }}>{magName}</Link>{subcategory ? ` · ${subcategory}` : ""}
      </div>

      {/* headline */}
      <h1 style={{ fontSize: 40, lineHeight: 1.04, fontWeight: 900, margin: "0 0 6px", color: C.ink, letterSpacing: -0.5 }}>{displayTitle}</h1>
      <div style={{ fontSize: 13, color: C.body, marginBottom: 22, fontStyle: "italic" }}>Filed by {agentName}</div>

      {/* hero image (full width) OR compact field-report placeholder when no image */}
      {imageUrl ? (
        <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 22, background: C.img, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={displayTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <ArticleEfx efx={efx || null} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.box, border: `1px dashed ${C.border}`, borderLeft: `4px solid ${C.accent}`, borderRadius: 10, padding: "10px 14px", marginBottom: 18, color: C.accent, opacity: 0.9 }}>
          <span style={{ fontSize: 20 }}>&#128220;</span>
          <span style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 800 }}>{magName} · Field Report</span>
        </div>
      )}

      {/* summary */}
      {summary && (
        <div style={{ background: C.box, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}`, borderRadius: 10, padding: "18px 20px", marginBottom: 22, fontSize: 17, lineHeight: 1.55, color: C.ink }}>
          {summary}
        </div>
      )}

      {/* AI commentary by the magazine's named agent */}
      <div style={{ border: `1px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: 10, padding: "18px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accent, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>{agentName.trim()[0]?.toUpperCase() || "A"}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.ink }}>{agentName}</div>
            <div style={{ fontSize: 11, color: C.body, letterSpacing: 1, textTransform: "uppercase" }}>Magazine AI commentary</div>
          </div>
        </div>
        {commentary ? (
          <div style={{ fontSize: 15, lineHeight: 1.6, color: C.ink, whiteSpace: "pre-wrap" }}>{commentary}</div>
        ) : (
          <div style={{ fontSize: 14, color: C.body, fontStyle: "italic" }}>No commentary yet — an editor can generate it from the Dispatch Desk.</div>
        )}
      </div>

      {/* rain-drop style link-out — show the REAL publisher (not a Google redirect) */}
      {sourceUrl && (
        <div style={{ margin: "20px 0", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <a href={sourceUrl} target="_blank" rel="noreferrer"
             style={{ background: C.accent, color: "#000", fontWeight: 800, padding: "12px 20px", borderRadius: 10, textDecoration: "none", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
            📌 Read the real article <span style={{ opacity: 0.7 }}>&#8599;</span>
          </a>
          <span style={{ alignSelf: "center", fontSize: 12, color: C.body, opacity: 0.8 }}>
            via {sourceLabel(sourceUrl, undefined, sourceName)} <span style={{ opacity: 0.6 }}>· {sourceName || hostOf(sourceUrl)}</span>
          </span>
        </div>
      )}

      {/* comments */}
      <div style={{ marginTop: 8 }}>
        <ArticleComments articleId={article.id} palette={C} />
      </div>
    </div>
  );
}