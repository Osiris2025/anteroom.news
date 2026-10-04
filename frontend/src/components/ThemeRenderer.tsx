"use client";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { renderTemplate, MAGAZINES } from "@/lib/themes";
import LiveFeed from "@/components/LiveFeed";
import MagazineTopStories from "@/components/MagazineTopStories";
import HomeHero from "@/components/HomeHero";
import LiveCrawl from "@/components/LiveCrawl";
import MagazineEditorial from "@/components/MagazineEditorial";
import FollowButton from "@/components/FollowButton";
import DefaultMagazineButton from "@/components/DefaultMagazineButton";

/**
 * ThemeRenderer
 * Renders the shared semantic template for the active theme's structure spec.
 * - Optional `magazineId`: when set (magazine/stream pages), we render the SAME
 *   theme template as the homepage (so every theme's own HTML template + CSS apply)
 *   and the LiveFeed is filtered to that magazine's approved articles.
 *   Magazine pages additionally get an editorial composition: a LEADER hero, the
 *   LiveFeed pipeline strip, and an asymmetric magazine grid (double-span cards +
 *   pull-quotes). The homepage (no magazineId) stays as the plain themed shell.
 * - The app navbar owns the top nav, so the template's internal header is hidden.
 *
 * Magazine URL slug ≠ canonical id (2026-08-10): the static MAGAZINES id for New
 * Frontiers in Science is `weird-and-wild`, so /magazines/new-frontiers-in-science
 * (name-slugified) did NOT resolve. We resolve with a slugify fallback
 * (id match → slugified name → slugified short) and use the RESOLVED mag.id
 * (never the raw URL slug) for the LiveFeed fetch — DB articles are stored under
 * the canonical id. This lives in the component only; themes.ts is untouched.
 */
export default function ThemeRenderer({ magazineId, dbMagazine, dbMagazines }: {
  magazineId?: string;
  dbMagazine?: { id: string; name: string | null; tagline: string | null; description: string | null } | null;
  dbMagazines?: Array<{ id: string; name: string; tagline: string | null; description: string | null }>;
}) {
  const router = useRouter();
  const { currentTheme, setTheme } = useTheme();
  const shellRef = useRef<HTMLDivElement>(null);
  // For the News-Map theme: real live articles (magazine-aware) instead of the
  // hardcoded placeholder ARTICLES. Loaded once; used only when layout === "map".
  const [mapStories, setMapStories] = useState<any[] | null>(null);

  useEffect(() => {
    const q = magazine ? `?magazine=${magazine}` : "?offset=0&limit=40";
    fetch(`/api/articles${q}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.error && Array.isArray(j.articles)) {
          setMapStories(j.articles.map((a: any) => ({
            title: a.headline || a.title,
            subcategory: a.subcategory || a.magazine?.name || "Pinned",
            href: `/articles/${a.id}`,
          })));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magazineId]);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const staticMag = magazineId
    ? MAGAZINES.find((m) => m.id === magazineId) ||
      MAGAZINES.find((m) => slugify(m.name) === magazineId) ||
      MAGAZINES.find((m) => slugify(m.short) === magazineId)
    : undefined;

  // Build DB-first lookup maps for tagline/name/description (DB is the source of
  // truth for customer-facing text; the static MAGAZINES array only supplies
  // theme/accent/color + fallbacks). dbMagazine covers the scoped single page;
  // dbMagazines is the full list (homepage showcase + footer).
  const dbList = dbMagazines && dbMagazines.length
    ? dbMagazines
    : (dbMagazine ? [dbMagazine] : []);
  const dbByName: Record<string, any> = {};
  const taglines: Record<string, string> = {};
  const names: Record<string, string> = {};
  const descs: Record<string, string> = {};
  for (const d of dbList) {
    dbByName[d.id] = d;
    if (d.tagline) taglines[d.id] = d.tagline;
    if (d.name) names[d.id] = d.name;
    if (d.description) descs[d.id] = d.description;
  }

  const dbForMag = dbMagazine || (magazineId ? dbByName[magazineId] : undefined);
  const magazine = magazineId
    ? {
        ...(staticMag || {}),
        id: dbForMag?.id || staticMag?.id || magazineId,
        name: (dbForMag?.name || staticMag?.name || ""),
        tagline: (dbForMag?.tagline || staticMag?.tagline || ""),
      }
    : undefined;

  // Semantic body for the ACTIVE theme (internal header suppressed; navbar owns top nav).
  const structure = {
    ...currentTheme.structure,
    hideHeader: true,
    magScope: magazine ? magazine.name : "",
    // Catboy poll is a Weekly Weird News feature (Todd, 2026-09-06): only render
    // on the WWN magazine page, never on the homepage or other magazines, even
    // if the active theme's structure has showPoll:true.
    showPoll: magazine?.id === "weekly-weird-news" ? currentTheme.structure.showPoll : false,
    taglines,
    names,
    descs,
    mapStories: mapStories || undefined,
  };
  // Homepage composition (2026-09-06): HomeHero replaces the old mast + magazine
  // showcase + static "Top stories" filler. magScope is the theme engine's own
  // suppression flag (scoped pages use it) — set it ONLY for the homepage so the
  // theme chrome (crawl/footer/CSS) still applies. themes.ts is NOT modified.
  if (!magazine) {
    structure.magScope = "homepage";
  }
  const html = renderTemplate(structure);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    // theme selector anywhere in the shell (data-theme-select)
    const onShellChange = (e: Event) => {
      const sel = e.target as HTMLSelectElement | null;
      if (sel && sel.matches("select[data-theme-select]")) setTheme(sel.value);
    };
    // card clicks -> data-href
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest("[data-href]") as HTMLElement | null;
      if (t && t.dataset.href) {
        e.preventDefault();
        router.push(t.dataset.href);
      }
    };
    el.addEventListener("change", onShellChange);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("change", onShellChange);
      el.removeEventListener("click", onClick);
    };
  }, [currentTheme.id, setTheme, router, html]);

  return (
    <div>
      {currentTheme.id === "crawler" && <LiveCrawl />}
      {currentTheme.id === "ticker" && <LiveCrawl variant="ticker" label="NEWS WIRE" />}
      {/* Magazine/stream pages: header row with the Explore control (opens the
          right-side popover with Browse subcats + AI Frontier on every screen),
          then full-width editorial content. No persistent sidebar — all width
          is for articles. */}
      {magazine ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "6px 0 2px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: magazine.accent, display: "inline-block" }} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: "inherit" }}>
              {magazine.name.toUpperCase()}
            </h1>
            <span style={{ fontSize: 12, opacity: 0.7, fontStyle: "italic" }}>{magazine.tagline}</span>
            <FollowButton magazineId={magazine.id} magazineName={magazine.name} />
            <DefaultMagazineButton magazineId={magazine.id} magazineName={magazine.name} accent={magazine.accent} />
          </div>
          <MagazineEditorial magazine={magazine.id} magazineName={magazine.name} accent={magazine.accent} />
          <LiveFeed magazine={magazine.id} />
          <MagazineTopStories magazine={magazine.id} />
          <div ref={shellRef} data-theme-shell="" dangerouslySetInnerHTML={{ __html: html }} />
        </>
      ) : (
        <>
          <HomeHero dbMagazines={dbMagazines || []} />
          <div ref={shellRef} data-theme-shell="" dangerouslySetInnerHTML={{ __html: html }} />
        </>
      )}
    </div>
  );
}