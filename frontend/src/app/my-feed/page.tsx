"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

type FollowEntry = {
  id: string;
  magazineId: string;
  createdAt: string;
  magazineName: string;
  magazineTagline: string | null;
};

type ArticleItem = {
  id: string;
  title: string;
  headline: string | null;
  summary: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  publishedAt: string | null;
  magazineId: string;
  magazineName: string;
};

export default function MyFeedPage() {
  const { data: session, isPending } = useSession();
  const [follows, setFollows] = useState<FollowEntry[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followsLoading, setFollowsLoading] = useState(true);
  const me = session?.user as any;

  const loadFollows = async () => {
    setFollowsLoading(true);
    try {
      const r = await fetch("/api/follows");
      const j = await r.json();
      if (j.follows) setFollows(j.follows);
    } catch {}
    setFollowsLoading(false);
  };

  const loadArticles = async (magIds: string[]) => {
    setLoading(true);
    try {
      // Fetch articles for each followed magazine (limit 5 per magazine, merged)
      const promises = magIds.map(async (mid) => {
        const r = await fetch(`/api/articles?magazine=${mid}&limit=10`);
        const j = await r.json();
        const items: any[] = j.articles || j.results || j.data || j || [];
        return items.map((a: any) => ({
          id: a.id || "",
          title: a.title || "",
          headline: a.headline || null,
          summary: a.summary || null,
          imageUrl: a.imageUrl || null,
          sourceUrl: a.sourceUrl || null,
          sourceName: a.sourceName || null,
          publishedAt: a.publishedAt || null,
          magazineId: mid,
          magazineName: follows.find(f => f.magazineId === mid)?.magazineName || "",
        }));
      });
      const results = await Promise.all(promises);
      // Sort all articles by publishedAt descending
      const all = results.flat().sort((a, b) => {
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return db - da;
      });
      setArticles(all);
    } catch (e) { console.error("Failed to load articles", e); }
    setLoading(false);
  };

  useEffect(() => {
    if (me?.id) {
      loadFollows();
    }
  }, [me?.id]);

  useEffect(() => {
    if (follows.length > 0) {
      loadArticles(follows.map(f => f.magazineId));
    } else {
      setArticles([]);
      setLoading(false);
    }
  }, [follows]);

  const unfollow = async (followId: string) => {
    try {
      await fetch(`/api/follows/${followId}`, { method: "DELETE" });
      setFollows((prev) => prev.filter((f) => f.id !== followId));
    } catch {}
  };

  if (isPending) return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading...</div>;

  if (!me) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 20, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>My Feed</h1>
        <p style={{ color: "#666", marginBottom: 20 }}>Sign in to follow magazines and get a personalized feed.</p>
        <Link href="/profile#signin" style={{
          background: "#0072f5", color: "#fff", padding: "10px 24px", borderRadius: 8,
          textDecoration: "none", fontWeight: 700, fontSize: 14,
        }}>Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>My Feed</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>
        {follows.length} {follows.length === 1 ? "magazine" : "magazines"} followed
        {articles.length > 0 ? ` · ${articles.length} articles` : ""}
      </p>

      {/* Followed magazines strip */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24,
        padding: "12px 16px", borderRadius: 12, background: "#f8f9fa",
        border: "1px solid #e5e7eb",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#666", lineHeight: "32px" }}>
          Following:
        </span>
        {followsLoading ? (
          <span style={{ fontSize: 13, color: "#999", lineHeight: "32px" }}>Loading...</span>
        ) : follows.length === 0 ? (
          <span style={{ fontSize: 13, color: "#999", lineHeight: "32px" }}>
            No magazines followed yet. Browse magazines and click &#9733; Follow.
          </span>
        ) : (
          follows.map((f) => (
            <span key={f.id} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 20, background: "#e8f4fd",
              fontSize: 13, fontWeight: 600, color: "#0072f5",
            }}>
              <Link href={`/magazines/${f.magazineId}`} style={{ textDecoration: "none", color: "inherit" }}>
                {f.magazineName}
              </Link>
              <button onClick={() => unfollow(f.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#999", fontSize: 16, lineHeight: 1, padding: 0,
                }}
                title="Unfollow"
              >&times;</button>
            </span>
          ))
        )}
      </div>

      {/* Articles feed */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#666", padding: 40 }}>Loading articles...</div>
      ) : follows.length === 0 ? (
        <div style={{ textAlign: "center", color: "#999", padding: 40, border: "2px dashed #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>&#128269;</div>
          <p style={{ fontSize: 15 }}>Follow some magazines to see their articles here.</p>
          <Link href="/" style={{ color: "#0072f5", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Browse magazines &rarr;
          </Link>
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: "center", color: "#999", padding: 40 }}>
          No articles found from followed magazines.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {articles.map((art) => (
            <div key={art.id} style={{
              display: "flex", gap: 14, padding: 14, borderRadius: 12,
              border: "1px solid #e5e7eb", background: "#fff",
              alignItems: "flex-start",
            }}>
              {art.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={art.imageUrl} alt=""
                  style={{ width: 100, height: 70, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0072f5", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  {art.magazineName || "News"}
                </div>
                <Link href={`/articles/${art.id}`} style={{
                  fontSize: 16, fontWeight: 700, color: "#1a1a2e", textDecoration: "none",
                  display: "block", lineHeight: 1.3,
                }}>
                  {art.headline || art.title}
                </Link>
                {art.summary && (
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4, lineHeight: 1.4,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {art.summary}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                  {art.sourceName && <span>{art.sourceName} · </span>}
                  {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : ""}
                </div>
              </div>
              <Link href={`/articles/${art.id}`} style={{
                background: "#0072f5", color: "#fff", borderRadius: 8,
                padding: "6px 12px", fontSize: 12, fontWeight: 700,
                textDecoration: "none", flexShrink: 0, marginTop: 2,
              }}>
                Read
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
