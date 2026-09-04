"use client";
import StoryCard, { StoryArticle } from "@/components/StoryCard";

import { useEffect, useState } from "react";

type HighlightArticle = {
  id: string;
  title: string;
  summary: string;
  commentary: string;
  imageUrl: string | null;
  publishedAt: string;
  subcategory: string | null;
  featured: boolean;
  sourceName: string | null;
  articleUrl: string;
};

type MagazineGroup = {
  id: string;
  name: string;
  tagline: string;
  agentName: string;
  accent: string;
  articleCount: number;
  articles: HighlightArticle[];
};

type HighlightsData = {
  generatedAt: string;
  weekRange: { start: string; end: string };
  magazines: MagazineGroup[];
  totalArticles: number;
  totalMagazines: number;
};

export default function HighlightsPage() {
  const [data, setData] = useState<HighlightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/weekly-highlights")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) {
          setError(j.error);
        } else {
          setData(j);
        }
      })
      .catch(() => setError("Failed to load highlights"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "#888" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div>Loading weekly highlights…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "#e74c3c" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!data || data.magazines.length === 0) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "#888" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
        <div>No highlights this week — check back soon!</div>
      </div>
    );
  }

  const weekStart = new Date(data.weekRange.start);
  const weekEnd = new Date(data.weekRange.end);
  const dateFormat: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 800, textTransform: "uppercase", color: "#ffd700", marginBottom: 6 }}>
          Tier 3 · Social-First Content
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
          📊 This Week in Anteroom
        </h1>
        <p style={{ fontSize: 14, color: "#888", margin: 0 }}>
          {weekStart.toLocaleDateString("en-US", dateFormat)} — {weekEnd.toLocaleDateString("en-US", dateFormat)}
        </p>
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, background: "rgba(255,215,0,.1)", padding: "4px 12px", borderRadius: 20, color: "#ffd700" }}>
            {data.totalMagazines} magazines
          </span>
          <span style={{ fontSize: 13, background: "rgba(100,200,255,.1)", padding: "4px 12px", borderRadius: 20, color: "#64c8ff" }}>
            {data.totalArticles} articles
          </span>
        </div>
      </div>

      {/* Magazine Sections */}
      {data.magazines.map((mag) => (
        <section key={mag.id} style={{ marginBottom: 36, borderTop: `3px solid ${mag.accent}`, paddingTop: 16 }}>
          {/* Magazine header */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: mag.accent, display: "inline-block", flexShrink: 0 }} />
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>
                <a href={"/magazines/" + mag.id} style={{ color: "inherit", textDecoration: "none" }}>
                  {mag.name.toUpperCase()}
                </a>
              </h2>
              {mag.tagline && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888", fontStyle: "italic" }}>
                  {mag.tagline}
                </p>
              )}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>
              {mag.articleCount} article{mag.articleCount !== 1 ? "s" : ""} · by {mag.agentName}
            </span>
          </div>

          {/* Article cards */}
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {mag.articles.map((a) => {
              const art: StoryArticle = {
                id: a.id, title: a.title, headline: null, summary: a.summary, imageUrl: a.imageUrl || null,
                magazine: { id: mag.id, name: mag.name }, subcategory: a.subcategory || null,
              };
              return <StoryCard key={a.id} article={art} onChanged={() => window.location.reload()} />;
            })}
          </div>

          {/* Link to full magazine */}
          <div style={{ marginTop: 10 }}>
            <a
              href={"/magazines/" + mag.id}
              style={{
                fontSize: 13,
                color: mag.accent,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              → View all in {mag.name}
            </a>
          </div>
        </section>
      ))}

      {/* Footer */}
      <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid rgba(127,127,127,.15)", fontSize: 12, color: "#666", textAlign: "center" }}>
        <p style={{ margin: 0 }}>
          Generated by AI · All articles reviewed by human editors ·{" "}
          <a href={"/subscribe"} style={{ color: "#888" }}>Subscribe to get this by email</a>
        </p>
        <p style={{ margin: "4px 0 0", opacity: 0.6 }}>
          Anteroom — {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}
