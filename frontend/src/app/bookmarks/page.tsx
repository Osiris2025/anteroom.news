"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

type BookmarkEntry = {
  id: string;
  articleId: string;
  createdAt: string;
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

export default function BookmarksPage() {
  const { data: session, isPending } = useSession();
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const me = session?.user as any;

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/bookmarks");
      const j = await r.json();
      if (j.bookmarks) setBookmarks(j.bookmarks);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (me?.id) load(); }, [me?.id]);

  const removeBm = async (bmId: string) => {
    try {
      await fetch(`/api/bookmarks/${bmId}`, { method: "DELETE" });
      setBookmarks((prev) => prev.filter((b) => b.id !== bmId));
    } catch {}
  };

  if (isPending) return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading...</div>;

  if (!me) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 20, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Bookmarks</h1>
        <p style={{ color: "#666", marginBottom: 20 }}>Sign in to save and manage your bookmarked articles.</p>
        <Link href="/profile#signin" style={{ 
          background: "#0072f5", color: "#fff", padding: "10px 24px", borderRadius: 8,
          textDecoration: "none", fontWeight: 700, fontSize: 14,
        }}>Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Saved Articles</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>
        {bookmarks.length} {bookmarks.length === 1 ? "article" : "articles"} saved
      </p>

      {loading ? (
        <div style={{ textAlign: "center", color: "#666", padding: 40 }}>Loading...</div>
      ) : bookmarks.length === 0 ? (
        <div style={{ textAlign: "center", color: "#999", padding: 40, border: "2px dashed #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>&#128214;</div>
          <p style={{ fontSize: 15 }}>No saved articles yet.</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>
            Click the <span style={{ fontWeight: 700 }}>&#9734;</span> star on any article to save it here.
          </p>
          <Link href="/" style={{ color: "#0072f5", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Browse articles &rarr;
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bookmarks.map((bm) => (
            <div key={bm.id} style={{
              display: "flex", gap: 14, padding: 14, borderRadius: 12,
              border: "1px solid #e5e7eb", background: "#fff",
              alignItems: "flex-start",
            }}>
              {bm.articleImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bm.articleImageUrl} alt=""
                  style={{ width: 80, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0072f5", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  {bm.magazineName || "News"}
                </div>
                <Link href={`/articles/${bm.articleId}`} style={{
                  fontSize: 16, fontWeight: 700, color: "#1a1a2e", textDecoration: "none",
                  display: "block", lineHeight: 1.3,
                }}>
                  {bm.articleHeadline || bm.articleTitle}
                </Link>
                {bm.articleSummary && (
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4, lineHeight: 1.4,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {bm.articleSummary}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                  {bm.articlePublishedAt ? new Date(bm.articlePublishedAt).toLocaleDateString() : ""}
                </div>
              </div>
              <button onClick={() => removeBm(bm.id)}
                style={{
                  background: "none", border: "1px solid #e5e7eb", borderRadius: 8,
                  padding: "6px 10px", cursor: "pointer", color: "#f87171",
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                  marginTop: 2,
                }}
                title="Remove bookmark"
              >Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
