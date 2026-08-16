"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SubcategoryRail from "@/components/SubcategoryRail";
import FrontierRail from "@/components/FrontierRail";

type Release = { id: string; title: string; headline?: string | null; publishedAt?: string | null };

// Cross-platform "Explore" popover. One consistent control (bottom-right FAB on
// mobile, a header/eyebrow button on desktop) that slides a panel in from the
// RIGHT containing the magazine's Browse subcategories + the AI Frontier rail.
// Gives subcategory access on every screen without a persistent sidebar, so the
// full page width stays dedicated to articles.
export default function MobileExploreDrawer({ magazine, showFrontier }: { magazine: string; showFrontier?: boolean }) {
  const [open, setOpen] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [hasSubcats, setHasSubcats] = useState(false);

  useEffect(() => {
    if (!magazine) { setHasSubcats(false); return; }
    fetch(`/api/articles/subcats?magazine=${magazine}`)
      .then((r) => r.json())
      .then((j) => { const arr = Array.isArray(j?.subcats) ? j.subcats : []; setHasSubcats(arr.length > 0); })
      .catch(() => setHasSubcats(false));
  }, [magazine]);

  // Open from elsewhere (e.g. a header "Explore" pill) via a custom event.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("nexus-explore-open", onOpen);
    return () => window.removeEventListener("nexus-explore-open", onOpen);
  }, []);

  useEffect(() => {
    if (!open || !magazine) return;
    fetch(`/api/articles?magazine=${magazine}&releases=1&limit=25`)
      .then((r) => r.json())
      .then((j) => { if (!j.error && Array.isArray(j.articles)) setReleases(j.articles); })
      .catch(() => {});
  }, [open, magazine]);

  // Lock body scroll while open.
  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Always renderable: the popover is valid if there's anything to show
  // (subcategories OR the AI Frontier OR releases). Button hidden only if the
  // magazine has none of those — then there's genuinely nothing to explore.
  const hasAnything = hasSubcats || !!showFrontier;

  return (
    <>
      {/* Explore control — visible on ALL breakpoints (desktop: header eyebrow; mobile: FAB) */}
      <button
        className="nexus-explore-toggle"
        onClick={() => setOpen(true)}
        aria-label="Explore this magazine"
        style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "var(--accent,#ffd700)", color: "#000", fontWeight: 800,
          border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,.35)", fontSize: 12.5, lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 14 }}>⤢</span> Explore
      </button>

      {/* desktop: eyebrow button floats top-right of the main column; mobile: fixed FAB */}
      <style>{`
        .nexus-explore-toggle { display: inline-flex; }
        @media (max-width: 920px) {
          .nexus-explore-toggle { position: fixed; right: 16px; bottom: 16px; z-index: 60; padding: 13px 19px; }
          .nexus-explore-drawer { width: 86%; max-width: 380px; }
        }
        @media (min-width: 921px) {
          .nexus-explore-toggle { margin: 2px 0 14px; }
        }
        .nexus-explore-drawer { position: fixed; top: 0; right: 0; bottom: 0;
          transform: translateX(105%); transition: transform .22s ease; z-index: 95;
          background: var(--page-bg, #0b0e11); overflow-y: auto; padding: 68px 18px 60px;
          box-shadow: -12px 0 40px rgba(0,0,0,.5); border-left: 1px solid var(--border, rgba(150,150,150,.2)); }
        .nexus-explore-drawer.open { transform: translateX(0); }
        .nexus-explore-toggle.open { visibility: hidden; }
        .nexus-explore-scrim { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.55);
          opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .nexus-explore-scrim.open { opacity: 1; pointer-events: auto; }
        .nexus-explore-close { position: absolute; top: 14px; right: 14px; background: transparent;
          border: 1px solid rgba(150,150,150,.3); color: inherit; border-radius: 8px;
          width: 32px; height: 32px; font-size: 16px; cursor: pointer; }
        .nexus-explore-drawer .nexus-subcat-rail, .nexus-explore-drawer .nexus-fr { position: static !important; border: 1px solid rgba(150,150,150,.15); }
        .nexus-explore-drawer .nexus-subcat-rail { display: block !important; }
        .nexus-explore-label { font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 1.5px; opacity: .55; margin: 4px 0 10px; }
        .nexus-explore-release { display: flex; align-items: baseline; gap: 8; padding: 7px 2px;
          border-bottom: 1px solid rgba(150,150,150,.08); font-size: 12.5px; color: inherit;
          text-decoration: none; line-height: 1.35; }
      `}</style>

      {hasAnything && (
        <>
          <div className={`nexus-explore-drawer ${open ? "open" : ""}`}>
            <button className="nexus-explore-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Explore</div>
            {hasSubcats && (
              <>
                <div className="nexus-explore-label">Browse by topic</div>
                <SubcategoryRail magazine={magazine} />
              </>
            )}
            {showFrontier && (
              <>
                <div className="nexus-explore-label" style={{ marginTop: 20 }}>AI Frontier</div>
                <FrontierRail compact />
              </>
            )}
            {releases.length > 0 && (
              <>
                <div className="nexus-explore-label" style={{ marginTop: 20 }}>Software releases</div>
                {releases.map((r) => (
                  <Link key={r.id} href={`/articles/${r.id}`} className="nexus-explore-release" onClick={() => setOpen(false)}>
                    <span style={{ flex: "0 0 auto", color: "var(--accent,#ffd700)", fontSize: 11, fontFamily: "var(--mono,monospace)" }}>
                      {(r.publishedAt || "").slice(0, 10)}
                    </span>
                    <span>{r.headline || r.title}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
          <div className={`nexus-explore-scrim ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
        </>
      )}
    </>
  );
}