"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import StoryCard, { StoryArticle } from "@/components/StoryCard";

type HistoryEntry = {
  id: string;
  articleId: string;
  readAt: string;
  readCount: number;
  articleTitle: string;
  articleHeadline: string | null;
  articleSummary: string | null;
  articleImageUrl: string | null;
  articleSourceUrl: string | null;
  articleSourceName: string | null;
  articlePublishedAt: string | null;
  magazineId: string | null;
  magazineName: string | null;
  subcategory: string | null;
};

export default function HistoryPage() {
  const { data: session, isPending } = useSession();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const me = session?.user as any;

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/reading-history");
      const j = await r.json();
      if (j.history) setHistory(j.history);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (me?.id) load(); }, [me?.id]);

  if (isPending) return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading...</div>;

  if (!me) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 20, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Reading History</h1>
        <p style={{ color: "#666", marginBottom: 20 }}>Sign in to see your reading history.</p>
        <Link href="/profile#signin" style={{
          background: "#0072f5", color: "#fff", padding: "10px 24px", borderRadius: 8,
          textDecoration: "none", fontWeight: 700, fontSize: 14,
        }}>Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Reading History</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>
        {history.length} {history.length === 1 ? "article" : "articles"} read
      </p>

      {loading ? (
        <div style={{ textAlign: "center", color: "#666", padding: 40 }}>Loading...</div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: "center", color: "#999", padding: 40, border: "2px dashed #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📖</div>
          <p style={{ fontSize: 15 }}>No reading history yet.</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Articles you read will appear here automatically.</p>
          <Link href="/" style={{ color: "#0072f5", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Browse articles &rarr;
          </Link>
        </div>
      ) : (
        <div
          style={{
            borderLeft: "3px solid var(--accent, #ffd700)",
            background: "var(--card-bg, rgba(255,255,255,.03))",
            margin: "14px 0 4px",
            padding: "6px 16px 12px",
          }}
        >
          {history.map((entry) => {
            const art: StoryArticle = {
              id: entry.articleId,
              title: entry.articleTitle,
              headline: entry.articleHeadline,
              summary: entry.articleSummary,
              imageUrl: entry.articleImageUrl,
              magazine: entry.magazineId
                ? { id: entry.magazineId, name: entry.magazineName || "News" }
                : null,
              subcategory: entry.subcategory,
              readCount: entry.readCount,
              readAt: entry.readAt,
            };
            return <StoryCard key={entry.id} article={art} onChanged={load} />;
          })}
        </div>
      )}
    </div>
  );
}