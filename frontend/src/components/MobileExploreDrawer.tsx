"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SubcategoryRail from "@/components/SubcategoryRail";
import FrontierRail from "@/components/FrontierRail";

type Release = { id: string; title: string; headline?: string | null; publishedAt?: string | null };

// Mobile-only "Explore" drawer: a floating button (bottom-right) that slides a
// panel in from the RIGHT containing the magazine's Browse subcategories, the
// AI Frontier rail, and software Releases. This keeps subcategory/rail content
// reachable on phones without dumping it full-width at the bottom of the feed.
export default function MobileExploreDrawer({ magazine, showFrontier }: { magazine: string; showFrontier?: boolean }) {
  const [open, setOpen] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);

  // Open from elsewhere (e.g. a header "Explore" pill) via a custom event.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("nexus-explore-open", onOpen);
    return () => window.removeEventListener("nexus-explore-open", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
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

  return (
    <>
      {/* Floating Explore button — mobile only */}
      <button
        className="nexus-explore-fab"
        onClick={() => setOpen(true)}
        aria-label="Explore this magazine"
        style={{
          position: "fixed", right: 16, bottom: 16, zIndex: 60,
          display: "none", alignItems: "center", gap: 8,
          background: "var(--accent,#ffd700)", color: "#000", fontWeight: 800,
          border: "none", borderRadius: 999, padding: "12px 18px", cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,0,0,.4)", fontSize: 13,
        }}
      >
        <span style={{ fontSize: 16 }}>⤢</span> Explore
      </button>
      <style>{`
        @media (max-width: 920px) {
          .nexus-explore-fab { display: inline-flex !important; }
        }
        @media (min-width: 921px) {
          .nexus-explore-drawer { display: none !important; }
        }
        .nexus-explore-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 82%;
          max-width: 380px; z-index: 90; transform: translateX(105%); transition: transform .22s ease;
          background: var(--page-bg, #0b0e11); overflow-y: auto; padding: 68px 18px 60px;
          box-shadow: -12px 0 40px rgba(0,0,0,.5); border-left: 1px solid var(--border, rgba(150,150,150,.2)); }
        .nexus-explore-fab.open { display: none; }
        .nexus-explore-drawer.open { transform: translateX(0); }
        .nexus-explore-scrim { position: fixed; inset: 0; z-index: 80; background: rgba(0,0,0,.55);
          opacity: 0; pointer-events: none; transition: opacity .2s ease; }
        .nexus-explore-scrim.open { opacity: 1; pointer-events: auto; }
        .nexus-explore-close { position: absolute; top: 14px; right: 14px; background: transparent;
          border: 1px solid rgba(150,150,150,.3); color: inherit; border-radius: 8px;
          width: 32px; height: 32px; font-size: 16px; cursor: pointer; }
        .nexus-explore-drawer .nexus-subcat-rail, .nexus-explore-drawer .nexus-fr { position: static !important; border: 1px solid rgba(150,150,150,.15); }
        .nexus-explore-label { font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 1.5px; opacity: .55; margin: 4px 0 10px; }
        .nexus-explore-release { display: flex; align-items: baseline; gap: 8; padding: 7px 2px;
          border-bottom: 1px solid rgba(150,150,150,.08); font-size: 12.5px; color: inherit;
          text-decoration: none; line-height: 1.35; }
      `}</style>

      <div className={`nexus-explore-drawer ${open ? "open" : ""}`}>
        <button className="nexus-explore-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Explore</div>
        <div className="nexus-explore-label">Browse by topic</div>
        <SubcategoryRail magazine={magazine} />
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
  );
}