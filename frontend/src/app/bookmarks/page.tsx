"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import StoryCard, { StoryArticle } from "@/components/StoryCard";


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
          {bookmarks.map((bm) => {
            const art: StoryArticle = {
              id: bm.articleId, title: bm.articleTitle, headline: bm.articleHeadline || null,
              summary: bm.articleSummary, imageUrl: bm.articleImageUrl || null,
              magazine: bm.magazineId ? { id: bm.magazineId, name: bm.magazineName || "News" } : null,
            };
            return <StoryCard key={bm.id} article={art} onChanged={load} />;
          })}
        </div>
      )}
    </div>
  );
}
