"use client";
import { useEffect, useState } from "react";

type LiveArticle = {
  id: string; title: string; summary: string | null; sourceUrl: string | null;
  subcategory: string | null; magazine: { id: string; name: string } | null;
};

// Homepage live-feed strip: shows articles approved→live through the intake pipeline
// (from /api/articles). Theme-aware via CSS vars, sits above the template's Top Stories.
export default function LiveFeed() {
  const [articles, setArticles] = useState<LiveArticle[]>([]);

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((j) => { if (!j.error && Array.isArray(j.articles)) setArticles(j.articles.slice(0, 6)); })
      .catch(() => {});
  }, []);

  if (articles.length === 0) return null;

  return (
    <div
      style={{
        borderLeft: "3px solid var(--accent, #ffd700)",
        background: "var(--card-bg, rgba(255,255,255,.03))",
        margin: "14px 0 4px",
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 800, textTransform: "uppercase", color: "var(--accent, #ffd700)", marginBottom: 8 }}>● Live · from the pipeline</div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
        {articles.map((a) => (
          <a key={a.id} href={a.sourceUrl || "#"} target={a.sourceUrl ? "_blank" : undefined} rel={a.sourceUrl ? "noreferrer" : undefined}
             style={{ textDecoration: "none", color: "inherit", display: "block", padding: "8px 0", borderTop: "1px solid rgba(150,150,150,.12)" }}>
            <div style={{ fontSize: 10, color: "var(--accent,#ffd700)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
              {a.magazine?.name || "News"}{a.subcategory ? ` / ${a.subcategory}` : ""}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{a.title}</div>
            {a.summary && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 3, lineHeight: 1.4 }}>{a.summary}</div>}
          </a>
        ))}
      </div>
    </div>
  );
}