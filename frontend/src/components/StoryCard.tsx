"use client";
import { useEffect, useState } from "react";
import AdminCardTools from "@/components/AdminCardTools";

// Shared, themed article card used across every list surface (LiveFeed "Live"
// strip, Reading History, etc.) so format is consistent everywhere and admin
// inline-editor tools are available on any card when the user is an admin.
export type StoryArticle = {
  id: string;
  title: string;
  headline?: string | null;
  summary?: string | null;
  imageUrl?: string | null;
  magazine?: { id: string; name: string } | null;
  subcategory?: string | null;
  pinned?: boolean;
  pinKind?: string | null;
  readCount?: number;
  readAt?: string | null;
};

const DEFAULT_SUBCATS = ["Features", "Analysis", "Explainers", "Briefs"];

export default function StoryCard({
  article,
  onChanged,
}: {
  article: StoryArticle;
  onChanged?: () => void;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [magazines, setMagazines] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((j) => {
        setIsAdmin(!!j.isAdmin);
        if (j.isAdmin) {
          fetch("/api/magazines")
            .then((r) => r.json())
            .then((m) => {
              if (m.magazines)
                setMagazines(m.magazines.map((x: any) => ({ id: x.id, name: x.name })));
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const title = article.headline || article.title;
  const subcats = article.subcategory ? [article.subcategory] : DEFAULT_SUBCATS;
  const mag = article.magazine?.name || "News";
  const href = `/articles/${article.id}`;

  return (
    <span style={{ display: "block", position: "relative", minWidth: 0 }}>
      <a
        href={href}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          padding: "8px 0",
          borderTop: article.pinned
            ? "2px solid var(--accent, #ffd700)"
            : "1px solid rgba(150,150,150,.12)",
          minWidth: 0,
        }}
      >
        {article.imageUrl ? (
          <span
            style={{
              flex: "0 0 44px",
              width: 44,
              height: 44,
              borderRadius: 8,
              overflow: "hidden",
              background: "var(--card-bg, rgba(127,127,127,.08))",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLSpanElement).style.display = "none";
              }}
            />
          </span>
        ) : null}
        <span style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--accent,#ffd700)",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {article.pinned ? `${article.pinKind || "PINNED"} · ` : ""}
            {mag}
            {article.subcategory ? ` / ${article.subcategory}` : ""}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          {article.summary ? (
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                marginTop: 3,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {article.summary}
            </div>
          ) : null}
          {article.readAt ? (
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>
              Read {article.readCount && article.readCount > 1 ? `${article.readCount} times` : "once"} ·{" "}
              {new Date(article.readAt).toLocaleDateString()}
            </div>
          ) : null}
        </span>
      </a>
      {isAdmin ? (
        <span
          style={{
            display: "block",
            borderTop: "1px solid rgba(150,150,150,.14)",
            marginBottom: 6,
          }}
        >
          <AdminCardTools
            articleId={article.id}
            currentMag={article.magazine?.id || ""}
            currentSubcat={article.subcategory}
            featured={false}
            pinned={!!article.pinned}
            magazines={magazines}
            subcats={subcats}
            onChanged={() => onChanged?.()}
          />
        </span>
      ) : null}
    </span>
  );
}