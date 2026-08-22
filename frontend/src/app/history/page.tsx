"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

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
      <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>
        {history.length} {history.length === 1 ? "article" : "articles"} read
      </p>

      {loading ? (
        <div style={{ textAlign: "center", color: "#666", padding: 40 }}>Loading...</div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: "center", color: "#999", padding: 40, border: "2px dashed #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📖</div>
          <p style={{ fontSize: 15 }}>No reading history yet.</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>
            Articles you read will appear here automatically.
          </p>
          <Link href="/" style={{ color: "#0072f5", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Browse articles &rarr;
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {history.map((entry) => (
            <div key={entry.id} style={{
              display: "flex", gap: 14, padding: 14, borderRadius: 12,
              border: "1px solid #e5e7eb", background: "#fff",
              alignItems: "flex-start",
            }}>
              {entry.articleImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.articleImageUrl} alt=""
                  style={{ width: 80, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0072f5", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  {entry.magazineName || "News"}
                </div>
                <Link href={"/articles/" + entry.articleId} style={{
                  fontSize: 16, fontWeight: 700, color: "#1a1a2e", textDecoration: "none",
                  display: "block", lineHeight: 1.3,
                }}>
                  {entry.articleHeadline || entry.articleTitle}
                </Link>
                {entry.articleSummary && (
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4, lineHeight: 1.4,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.articleSummary}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                  {"Read " + (entry.readCount > 1 ? entry.readCount + " times" : "once") + " \u00b7 " + (entry.readAt ? new Date(entry.readAt).toLocaleDateString() : "")}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#aaa", flexShrink: 0, marginTop: 2, textAlign: "right" }}>
                {entry.readAt ? (
                  <span title={new Date(entry.readAt).toLocaleString()}>
                    {formatTimeAgo(entry.readAt)}
                  </span>
                ) : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + "d ago";
  return new Date(dateStr).toLocaleDateString();
}
