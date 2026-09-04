"use client";
import { useEffect, useState } from "react";
import StoryCard, { StoryArticle } from "@/components/StoryCard";

type LiveArticle = {
  id: string; title: string; summary: string | null; sourceUrl: string | null;
  subcategory: string | null; magazine: { id: string; name: string } | null;
  imageUrl?: string | null; pinned?: boolean; pinKind?: string | null;
};

function rowCount(width: number): number {
  if (width >= 1200) return 4;
  if (width >= 900) return 3;
  if (width >= 600) return 2;
  return 1;
}

export default function LiveFeed({ magazine }: { magazine?: string }) {
  const [articles, setArticles] = useState<LiveArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(4);

  useEffect(() => {
    const onResize = () => setCount(rowCount(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const load = async (newOffset: number) => {
    setLoading(true);
    const q = magazine ? `?magazine=${magazine}&offset=${newOffset}&limit=150` : `?offset=${newOffset}&limit=150`;
    try {
      const r = await fetch(`/api/articles${q}`);
      const j = await r.json();
      if (!j.error && Array.isArray(j.articles)) {
        if (newOffset === 0) {
          setArticles(j.articles);
        } else {
          setArticles((prev) => [...prev, ...j.articles]);
        }
        setTotal(j.total || 0);
        setOffset(newOffset + j.articles.length);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load(0);
  }, [magazine]);

  if (articles.length === 0) return null;
  const shown = articles.slice(0, count);
  const hasMore = offset < total;

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
      {shown.length > 0 && (
        <div style={{ display: "grid", gap: 4, gridTemplateColumns: `repeat(${shown.length}, minmax(0,1fr))` }}>
          {shown.map((a) => {
            const art: StoryArticle = {
              id: a.id,
              title: a.title,
              summary: a.summary,
              imageUrl: a.imageUrl,
              magazine: a.magazine,
              subcategory: a.subcategory,
              pinned: a.pinned,
              pinKind: a.pinKind,
            };
            return <StoryCard key={a.id} article={art} onChanged={() => load(0)} />;
          })}
        </div>
      )}
      {hasMore && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button onClick={() => load(offset)} disabled={loading}
            style={{
              background: "transparent", border: "1px solid var(--accent, rgba(255,215,0,.4))",
              borderRadius: 8, color: "var(--accent, #ffd700)", padding: "8px 24px",
              cursor: "pointer", fontSize: 13, fontWeight: 700,
            }}>
            {loading ? "⏳ Loading…" : `Load more (${offset} / ${total})`}
          </button>
        </div>
      )}
    </div>
  );
}