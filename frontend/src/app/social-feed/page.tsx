"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

type SocialArticle = {
  id: string;
  title: string;
  headline: string | null;
  sourceUrl: string | null;
  imageUrl: string | null;
  summary: string | null;
  commentary: string | null;
  subcategory: string | null;
  publishedAt: string | null;
  socialPostedAt: string | null;
  magazine: { id: string; name: string } | null;
};

function fmtDate(d: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function SocialFeedPage() {
  const { currentTheme } = useTheme();
  const [articles, setArticles] = useState<SocialArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/articles/social-feed?limit=100");
      const j = await r.json();
      if (j.error) {
        setErr(j.error);
      } else {
        setArticles(j.articles || []);
      }
    } catch (e: any) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accent = currentTheme?.id === "tabloid" ? "#c1121f" : "var(--accent, #ffd700)";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: accent,
            fontWeight: 800,
            marginBottom: 4,
          }}
        >
          Social Feed
        </div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 900,
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: -0.5,
          }}
        >
          📢 Syndicated Stories
        </h1>
        <p
          style={{
            fontSize: 15,
            opacity: 0.7,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Articles approved for social media syndication — each links back to the
          original source.
        </p>
      </div>

      {/* Error */}
      {err && (
        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: "#3a0a0a",
            marginBottom: 14,
            fontSize: 13,
            color: "#f87171",
          }}
        >
          ⚠ {err}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            opacity: 0.5,
            fontSize: 14,
          }}
        >
          Loading syndicated stories…
        </div>
      )}

      {/* Empty state */}
      {!loading && !err && articles.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            opacity: 0.5,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
            No syndicated stories yet
          </div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Admins can flag articles for social syndication from the Dispatch
            Desk.
          </div>
        </div>
      )}

      {/* Feed */}
      {!loading && articles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {articles.map((a) => (
            <div
              key={a.id}
              style={{
                border: "1px solid rgba(150,150,150,.15)",
                borderRadius: 12,
                padding: 0,
                background: "var(--card-bg, rgba(255,255,255,.03))",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 16,
                  padding: 16,
                }}
              >
                {/* Thumbnail */}
                {a.imageUrl && (
                  <div style={{ flexShrink: 0, width: 140 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.imageUrl}
                      alt=""
                      style={{
                        width: 140,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Magazine badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: accent,
                      }}
                    >
                      {a.magazine?.name || "News"}
                    </span>
                    {a.subcategory && (
                      <span
                        style={{
                          fontSize: 10,
                          opacity: 0.5,
                          letterSpacing: 0.5,
                        }}
                      >
                        / {a.subcategory}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 10,
                        opacity: 0.4,
                        marginLeft: "auto",
                      }}
                    >
                      {fmtDate(a.socialPostedAt || a.publishedAt)}
                    </span>
                  </div>

                  {/* Title with link to article reader */}
                  <Link
                    href={`/articles/${a.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        margin: "0 0 6px",
                        cursor: "pointer",
                      }}
                    >
                      {a.headline || a.title}
                    </h2>
                  </Link>

                  {/* Summary */}
                  {a.summary && (
                    <p
                      style={{
                        fontSize: 13,
                        opacity: 0.7,
                        lineHeight: 1.5,
                        margin: "0 0 10px",
                      }}
                    >
                      {a.summary.length > 280
                        ? a.summary.slice(0, 280) + "…"
                        : a.summary}
                    </p>
                  )}

                  {/* Action: commentary snippet + source link */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <Link
                      href={`/articles/${a.id}`}
                      style={{
                        padding: "5px 14px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        border: `1px solid ${accent}`,
                        color: accent,
                        textDecoration: "none",
                      }}
                    >
                      Read AI Analysis →
                    </Link>

                    {a.sourceUrl && (
                      <a
                        href={a.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12,
                          opacity: 0.6,
                          color: "inherit",
                          textDecoration: "underline",
                          textUnderlineOffset: 2,
                        }}
                      >
                        🔗 Original article →
                      </a>
                    )}
                  </div>

                  {/* Commentary preview */}
                  {a.commentary && (
                    <details
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        opacity: 0.65,
                        lineHeight: 1.5,
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 11,
                          letterSpacing: 0.5,
                        }}
                      >
                        AI Commentary
                      </summary>
                      <div
                        style={{ marginTop: 6, paddingLeft: 4 }}
                        dangerouslySetInnerHTML={{
                          __html: a.commentary
                            .replace(/\n/g, "<br/>")
                            .slice(0, 500) + (a.commentary.length > 500 ? "…" : ""),
                        }}
                      />
                    </details>
                  )}
                </div>
              </div>

              {/* Social badge */}
              <div
                style={{
                  borderTop: "1px solid rgba(150,150,150,.08)",
                  padding: "6px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 10,
                  opacity: 0.4,
                }}
              >
                <span>📡</span>
                <span>Approved for social syndication</span>
                {a.socialPostedAt && (
                  <>
                    <span>·</span>
                    <span>Posted {fmtDate(a.socialPostedAt)}</span>
                  </>
                )}
                <span style={{ marginLeft: "auto" }}>
                  <Link
                    href={`/articles/${a.id}#comments`}
                    style={{ color: "inherit", textDecoration: "underline" }}
                  >
                    💬 Discuss
                  </Link>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div
        style={{
          marginTop: 32,
          padding: 20,
          borderRadius: 10,
          border: "1px solid rgba(150,150,150,.1)",
          background: "var(--card-bg, rgba(255,255,255,.02))",
        }}
      >
        <h3
          style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}
        >
          About this feed
        </h3>
        <ol
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            opacity: 0.8,
            margin: 0,
            paddingLeft: 20,
          }}
        >
          <li>
            <strong>Curated</strong> — Each article here was reviewed and approved
            by a human editor
          </li>
          <li>
            <strong>Syndication-ready</strong> — These stories are flagged for
            social media distribution via our AI agents
          </li>
          <li>
            <strong>Link-backs</strong> — Every article links to the original
            source (we never republish full content)
          </li>
          <li>
            <strong>AI-powered</strong> — Summaries and commentary generated on-site
            by our named AI agents per magazine
          </li>
        </ol>
      </div>
    </div>
  );
}