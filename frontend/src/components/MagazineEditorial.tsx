"use client";
import { useEffect, useState } from "react";

type EditorialArticle = {
  id: string;
  title: string;
  headline: string | null;
  imageUrl: string | null;
  summary: string | null;
  subcategory: string | null;
  featured: boolean;
  pinned: boolean;
  pinKind: string | null;
  magazine: { id: string; name: string } | null;
  publishedAt?: string | null;
};

// LEADER / FEATURED hero for magazine pages — the newest featured article if one
// exists (article.featured == true), else the newest live article for the mag.
// Big, full-width, image-on-top with a gradient scrim so it looks editorial and
// unmistakable. All theming uses CSS vars so it inherits every theme.
export default function MagazineEditorial({
  magazine,
  magazineName,
  accent,
}: {
  magazine: string;
  magazineName?: string;
  accent?: string;
}) {
  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [leader, setLeader] = useState<EditorialArticle | null>(null);

  useEffect(() => {
    fetch(`/api/articles?magazine=${magazine}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.error && Array.isArray(j.articles)) {
          setArticles(j.articles);
          // Prefer a featured article; else the newest live (dates desc).
          const featured = j.articles.find((a: any) => a.featured === true);
          setLeader(featured || j.articles[0] || null);
        }
      })
      .catch(() => {});
  }, [magazine]);

  if (!leader) return null;

  const tagColor = accent || "var(--accent, #ffd700)";
  const kicker = leader.subcategory || magazineName || leader.magazine?.name || "Featured";
  const hasImage = !!leader.imageUrl;

  return (
    <a
      href={`/articles/${leader.id}`}
      className="mz-leader"
      style={leaderLink}
    >
      {/* Media / placeholder */}
      <div style={leaderMedia}>
        {hasImage ? (
          <img
            src={leader.imageUrl!}
            alt=""
            style={leaderImg}
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div
            style={{
              ...leaderPlaceholder,
              background: `linear-gradient(135deg, ${tagColor}33 0%, var(--card-bg, rgba(255,255,255,.04)) 60%)`,
            }}
          >
            <span style={{ ...placeholderGlyph, color: tagColor }}>“</span>
            <span style={placeholderLabel}>FEATURED</span>
          </div>
        )}
        <div style={leaderScrim} />
        <div style={leaderBody}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ ...tagPill, background: tagColor }}>{kicker.toUpperCase()}</span>
            {leader.featured && (
              <span style={{ ...featuredPill }}>★ FEATURED</span>
            )}
          </div>
          <h2 style={leaderTitle}>{leader.headline || leader.title}</h2>
          {leader.summary && <p style={leaderSummary}>{leader.summary}</p>}
          <span style={{ ...readLink, borderColor: tagColor, color: tagColor }}>
            Read story →
          </span>
        </div>
      </div>
    </a>
  );
}

const leaderLink: React.CSSProperties = {
  display: "block",
  color: "inherit",
  textDecoration: "none",
  marginTop: 20,
  borderRadius: 16,
  overflow: "hidden",
  border: "1px solid var(--border, rgba(150,150,150,.25))",
  boxShadow: "0 20px 60px rgba(0,0,0,.25)",
  background: "var(--card-bg, rgba(255,255,255,.02))",
};

const leaderMedia: React.CSSProperties = {
  position: "relative",
  minHeight: 300,
  maxHeight: 460,
  width: "100%",
  display: "flex",
  alignItems: "flex-end",
  overflow: "hidden",
};

const leaderImg: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const leaderPlaceholder: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: 4,
};

const placeholderGlyph: React.CSSProperties = {
  fontSize: 140,
  lineHeight: 1,
  fontWeight: 900,
  fontFamily: "Georgia, serif",
  opacity: 0.55,
};

const placeholderLabel: React.CSSProperties = {
  letterSpacing: 6,
  fontSize: 14,
  fontWeight: 800,
  opacity: 0.6,
};

const leaderScrim: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.35) 45%, rgba(0,0,0,.05) 100%)",
};

const leaderBody: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "22px 26px 26px",
  color: "#fff",
};

const tagPill: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.2,
  color: "#111",
};

const featuredPill: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.2,
  border: "1px solid var(--accent, #ffd700)",
  color: "var(--accent, #ffd700)",
};

const leaderTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(22px, 3.6vw, 38px)",
  lineHeight: 1.1,
  fontWeight: 900,
  letterSpacing: "-0.02em",
  maxWidth: 850,
};

const leaderSummary: React.CSSProperties = {
  margin: "12px 0 16px",
  fontSize: "clamp(13px, 1.4vw, 15px)",
  lineHeight: 1.55,
  color: "rgba(255,255,255,.82)",
  maxWidth: 720,
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const readLink: React.CSSProperties = {
  display: "inline-block",
  padding: "9px 18px",
  borderRadius: 999,
  border: "1px solid",
  fontWeight: 800,
  fontSize: 13,
  background: "rgba(0,0,0,.25)",
};