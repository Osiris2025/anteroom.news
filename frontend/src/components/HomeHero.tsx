"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MAGAZINES } from "@/lib/themes";

/**
 * HomeHero — homepage opening composition (Todd spec, 2026-09-06):
 *   1. A banner up top (wordmark + tagline over an accent gradient).
 *   2. Magazine rows: magazine card on the left, its CURRENT TOP STORY
 *      (with picture) as a wide card on the right.
 * Replaces the old "Explore the magazines" mast + static Top Stories filler.
 * Theme-aware via CSS vars; no theme files touched.
 */

type TopStory = {
  id: string;
  title: string;
  headline?: string | null;
  imageUrl?: string | null;
  summary?: string | null;
};

type Magazine = {
  id: string;
  name: string;
  short?: string;
  accent?: string;
  tagline?: string | null;
  description?: string | null;
};

export default function HomeHero({ dbMagazines }: { dbMagazines: Array<{ id: string; name: string; tagline: string | null; description: string | null }> }) {
  const [stories, setStories] = useState<Record<string, TopStory | null>>({});
  const [loading, setLoading] = useState(true);

  // Static catalog carries accent/short/realm; DB rows carry admin-edited names/taglines.
  const mags: Magazine[] = MAGAZINES.map((m: any) => {
    const db = dbMagazines.find((d) => d.id === m.id);
    return { ...m, name: db?.name || m.name, tagline: db?.tagline ?? m.tagline, description: db?.description ?? m.description };
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = mags;
      // Top story per magazine = first result (pins first, then newest).
      const results = await Promise.all(
        list.map(async (m) => {
          try {
            const r = await fetch(`/api/articles?magazine=${encodeURIComponent(m.id)}&limit=1`);
            const j = await r.json();
            const a = (j.articles && j.articles[0]) || null;
            return [m.id, a] as const;
          } catch {
            return [m.id, null] as const;
          }
        })
      );
      if (!cancelled) {
        setStories(Object.fromEntries(results));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dbMagazines]);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Banner */}
      <div style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        padding: "44px 36px",
        marginBottom: 24,
        background: "linear-gradient(120deg, rgba(113,112,255,.25), rgba(56,189,248,.12) 55%, rgba(52,211,153,.14)), var(--card, #13161a)",
        border: "1px solid rgba(150,150,150,.22)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(1200px 300px at 15% -40%, rgba(113,112,255,.28), transparent 60%), radial-gradient(900px 260px at 85% 130%, rgba(52,211,153,.18), transparent 55%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", opacity: 0.75, marginBottom: 8 }}>
            The house of rooms
          </div>
          <h1 style={{
            margin: 0, fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1.05,
            fontWeight: 900, letterSpacing: "-1.5px",
            color: "var(--accent, #7170ff)",
            fontFamily: "inherit",
          }}>
            Pick a room. Read what matters.
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 15, opacity: 0.85, maxWidth: 640, lineHeight: 1.5 }}>
            Seven magazines, analyzed fresh every day. Each room pairs its front page with the one story you shouldn&apos;t miss.
          </p>
        </div>
      </div>

      {/* Magazine rows: card | top story */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {mags.map((m) => {
          const story = stories[m.id];
          const title = story ? (story.headline || story.title) : null;
          const href = story ? `/articles/${story.id}` : `/magazines/${m.id}`;
          return (
            <div key={m.id} style={{
              display: "grid",
              gridTemplateColumns: "minmax(210px, 300px) 1fr",
              gap: 0,
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(150,150,150,.22)",
              background: "var(--card, #13161a)",
              minHeight: 132,
            }}>
              {/* Magazine card (left) */}
              <Link href={`/magazines/${m.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", justifyContent: "center", padding: "18px 20px", borderRight: "1px solid rgba(150,150,150,.18)", position: "relative" }}>
                <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: m.accent || "var(--accent, #7170ff)" }} />
                <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", opacity: 0.65, marginBottom: 6 }}>Magazine</div>
                <div style={{ fontWeight: 800, fontSize: 19, lineHeight: 1.15, marginBottom: 6 }}>{m.name}</div>
                {m.tagline && <div style={{ fontSize: 12, opacity: 0.7, fontStyle: "italic" }}>{m.tagline}</div>}
              </Link>
              {/* Top story card (right) */}
              <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "grid", gridTemplateColumns: story?.imageUrl ? "220px 1fr" : "1fr", minHeight: 132 }}>
                {story?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={story.imageUrl}
                    alt=""
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 132 }}
                  />
                ) : null}
                <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", opacity: 0.65, marginBottom: 6 }}>Top story</div>
                  {loading ? (
                    <div style={{ opacity: 0.5, fontSize: 14 }}>Loading…</div>
                  ) : title ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {title}
                      </div>
                      {story?.summary && (
                        <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {story.summary}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ opacity: 0.5, fontSize: 14 }}>No stories yet — visit the magazine.</div>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
