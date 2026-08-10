"use client";
import { useEffect, useState } from "react";

type LiveArticle = {
  id: string; title: string; summary: string | null; sourceUrl: string | null;
  subcategory: string | null; magazine: { id: string; name: string } | null;
  publishedAt?: string | null;
};

// "Top stories" grid rendered below the pipeline strip on magazine/stream pages.
// Populated with the magazine's real approved articles (links to the internal reader),
// themed via CSS vars so it inherits the active theme. Grid is responsive (auto-fit).
export default function MagazineTopStories({ magazine }: { magazine: string }) {
  const [articles, setArticles] = useState<LiveArticle[]>([]);

  useEffect(() => {
    fetch(`/api/articles?magazine=${magazine}`)
      .then((r) => r.json())
      .then((j) => { if (!j.error && Array.isArray(j.articles)) setArticles(j.articles); })
      .catch(() => {});
  }, [magazine]);

  if (articles.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent, #ffd700)", display: "inline-block" }} />
        <h2 style={{ margin: 0, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 800, color: "inherit" }}>Top Stories</h2>
      </div>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {articles.slice(0, 9).map((a) => (
          <a key={a.id} href={`/articles/${a.id}`}
             style={{ textDecoration: "none", color: "inherit", display: "block", padding: "16px 18px", border: "1px solid var(--border, rgba(150,150,150,.2))", borderRadius: 10, background: "var(--card-bg, rgba(255,255,255,.02))" }}>
            <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "var(--accent, #ffd700)", marginBottom: 6 }}>
              {a.subcategory || a.magazine?.name || "News"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>{a.title}</div>
            {a.summary && <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.summary}</div>}
          </a>
        ))}
      </div>
    </div>
  );
}