"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ArticleComments from "./ArticleComments";
import ArticleEfx from "./ArticleEfx";
import ThreadModal from "./ThreadModal";
import ShareButton from "./ShareButton";
import AdminCardTools from "./AdminCardTools";
import { useAdmin } from "./AdminProvider";
import { hostOf, sourceLabel } from "@/lib/sourceUtil";
import { palette } from "@/lib/themePalette";

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

const DEFAULT_SUBCATS = ["Features", "Analysis", "Explainers", "Briefs"];

// Admin-only bar shown right under the summary: the same editorial tools that
// appear on article cards, themed to match the page.
function ArticleAdminBar({ article, magazine, C, backFallback }: { article: ReaderArticle; magazine: ReaderMag; C: ReturnType<typeof palette>; backFallback: string }) {
  const { isAdmin, magazines } = useAdmin();
  const router = useRouter();
  const [info, setInfo] = useState<{ status?: string; featured?: boolean; socialRepeat?: boolean; magazineId?: string | null; subcategory?: string | null } | null>(null);
  const [pinned, setPinned] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`/api/admin/article/${article.id}`).then(async (r) => {
      if (r.status === 404) { router.push(backFallback); return; }
      const j = await r.json();
      if (j.article) setInfo(j.article);
    }).catch(() => {});
    fetch("/api/admin/pins").then((r) => r.json()).then((j) => {
      setPinned(!!(j.pins || []).find((x: any) => x.article?.id === article.id));
    }).catch(() => {});
  }, [isAdmin, article.id, version]);

  if (!isAdmin || !info) return null;
  return (
    <div style={{ background: C.box, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}`, borderRadius: 10, padding: "8px 12px 6px", marginBottom: 22 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 800, color: C.accent, padding: "2px 0 0 10px" }}>
        Admin tools{info.status ? ` · ${info.status}` : ""}
      </div>
      <AdminCardTools
        key={version}
        articleId={article.id}
        currentMag={info.magazineId || magazine?.id || ""}
        currentSubcat={info.subcategory || article.subcategory}
        featured={info.featured === true}
        socialRepeat={info.socialRepeat === true}
        pinned={pinned}
        magazines={magazines}
        subcats={article.subcategory ? [article.subcategory, ...DEFAULT_SUBCATS.filter((x) => x !== article.subcategory)] : DEFAULT_SUBCATS}
        pal={C}
        onChanged={() => { setVersion((v) => v + 1); router.refresh(); }}
      />
    </div>
  );
}

export default function ArticleReader({ article, magazine, themeId }: { article: ReaderArticle; magazine: ReaderMag; themeId: string }) {
  const C = palette(themeId);
  const router = useRouter();
  const { title, headline, sourceUrl, sourceName, imageUrl, efx, summary, commentary, subcategory, publishedAt } = article;
  const magName = magazine?.name || "Anteroom";
  const agentName = magazine?.agentName || "The Desk";
  const displayTitle = headline || title;
  // Deeper history than the app root means the reader was reached by navigation
  // (e.g. from a magazine page or AI model page) — so "Back" should pop history.
  const backFallback = magazine?.id ? `/magazines/${magazine.id}` : "/";

  // Bookmark state
  const [bookmarked, setBookmarked] = useState(false);
  const [bmId, setBmId] = useState<string | null>(null);
  const [bmLoading, setBmLoading] = useState(false);
  // Thread modal state
  const [showThread, setShowThread] = useState(false);

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

  // Reading-history: auto-track when article is viewed
  useEffect(() => {
    // Fire-and-forget: record this article as read
    fetch("/api/reading-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: article.id }),
    }).catch(() => {});
  }, [article.id]);

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

      <ArticleAdminBar article={article} magazine={magazine} C={C} backFallback={backFallback} />

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

      {/* Share Quote button — opens quote image in new tab */}
      <div style={{ marginTop: 20, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => window.open(`/api/quote?articleId=${article.id}`, "_blank")}
          style={{
            background: C.accent,
            color: "#000",
            fontWeight: 800,
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          💬 Share Quote
        </button>
        <button
          onClick={() => setShowThread(true)}
          style={{
            background: "transparent",
            border: `1px solid ${C.border}`,
            color: C.ink,
            fontWeight: 800,
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          🧵 Share as Thread
        </button>
      </div>

      {/* rain-drop style link-out — show the REAL publisher (not a Google redirect) */}
      {sourceUrl && (
        <div style={{ margin: "20px 0", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <a href={sourceUrl} target="_blank" rel="noreferrer"
             style={{ background: C.accent, color: "#000", fontWeight: 800, padding: "12px 20px", borderRadius: 10, textDecoration: "none", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
            📌 Read the real article <span style={{ opacity: 0.7 }}>&#8599;</span>
          </a>
          <button
            onClick={() => window.open(`https://x.com/intent/post?text=${encodeURIComponent(displayTitle + " https://anteroom.news/articles/" + article.id + "?utm_source=x&utm_medium=social&utm_campaign=share-button")}`, "_blank")}
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.body,
              fontWeight: 700,
              padding: "12px 20px",
              borderRadius: 10,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ⌗ Share on X
          </button>
          <ShareButton
            title={displayTitle}
            text={summary}
            url={`https://anteroom.news/articles/${article.id}?utm_source=share&utm_medium=social&utm_campaign=share-button`}
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.body,
              fontWeight: 700,
              padding: "12px 20px",
              borderRadius: 10,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          />
          <span style={{ alignSelf: "center", fontSize: 12, color: C.body, opacity: 0.8 }}>
            via {sourceLabel(sourceUrl, undefined, sourceName)} <span style={{ opacity: 0.6 }}>· {sourceName || hostOf(sourceUrl)}</span>
          </span>
        </div>
      )}

      {/* comments */}
      <div style={{ marginTop: 8 }}>
        <ArticleComments articleId={article.id} palette={C} />
      </div>

      {/* Thread modal */}
      {showThread && (
        <ThreadModal articleId={article.id} palette={C} onClose={() => setShowThread(false)} />
      )}
    </div>
  );
}