"use client";
import { useEffect, useState } from "react";
import SubcategoryRail from "@/components/SubcategoryRail";
import FrontierRail from "@/components/FrontierRail";

type Release = { id: string; title: string; headline?: string | null; publishedAt?: string | null };
type CardRef = { cardId: string; position: number; params?: any | null };

// Fallback (identity-in-data stage 3): if the data-driven card fetch returns
// nothing, rely on the legacy SHOW_FRONTIER map so behavior is identical to today.
// Once all magazines have magazine_card rows, this fallback is retired.
const SHOW_FRONTIER: Record<string, boolean> = {
  "neural-hardware": true,
};

// Global right-side "Explore" drawer — the mirror of the left magazine hamburger.
// The top-LEFT hamburger switches magazines; the top-RIGHT hamburger opens this
// drawer (slides in from the RIGHT) holding the CURRENT magazine's extras:
// Browse/Subcategory chips, the AI Frontier rail, and software Releases.
// Both buttons live in the navbar so they never move and are always reachable.
export default function RightExploreDrawer() {
  const [open, setOpen] = useState(false);
  const [magazine, setMagazine] = useState<string>("");
  const [releases, setReleases] = useState<Release[]>([]);
  const [cards, setCards] = useState<CardRef[]>([]);

  // Detect the current magazine from the URL: /magazines/<id>
  useEffect(() => {
    const sync = () => {
      const m = window.location.pathname.match(/^\/magazines\/([^/]+)/);
      setMagazine(m ? decodeURIComponent(m[1]) : "");
    };
    sync();
    window.addEventListener("popstate", sync);
    // generic hook for client navigations
    window.addEventListener("nexus-route-change", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("nexus-route-change", sync);
    };
  }, []);

  // Load the magazine's cards from DATA (magazine_card table). Falls back to the
  // legacy SHOW_FRONTIER map below if no rows exist (behavior identical to today).
  useEffect(() => {
    if (!magazine) { setCards([]); return; }
    fetch(`/api/cards?magazine=${encodeURIComponent(magazine)}`)
      .then((r) => r.json())
      .then((j) => {
        const arr = Array.isArray(j?.cards) ? j.cards : [];
        if (arr.length) setCards(arr);
        else setCards([]); // fallback path retains SHOW_FRONTIER behavior
      })
      .catch(() => setCards([]));
  }, [magazine]);

  // The model-watchlist card renders if present via data OR via legacy fallback.
  function hasModelCard(): boolean {
    if (cards.some((c) => c.cardId === "ai_model_watchlist")) return true;
    return !!SHOW_FRONTIER[magazine];
  }

  // Load releases only when opened (lightweight).
  useEffect(() => {
    if (!open || !magazine) return;
    fetch(`/api/articles?magazine=${magazine}&releases=1&limit=25`)
      .then((r) => r.json())
      .then((j) => { if (!j.error && Array.isArray(j.articles)) setReleases(j.articles); })
      .catch(() => {});
  }, [open, magazine]);

  // Lock body scroll while open + close on Escape.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  // Broadcast a route change so the drawer picks up parent navigation.
  useEffect(() => {
    if (!magazine) return;
    const patch = () => window.dispatchEvent(new Event("nexus-route-change"));
    // minimal: re-check after clicks to links (SPA nav) via popstate + a poll
    const id = window.setInterval(patch, 800);
    return () => window.clearInterval(id);
  }, [magazine]);

  return (
    <>
      {/* Fixed hamburger — top-right, symmetric with the left magazine hamburger. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open explore panel"
        aria-expanded={open}
        className="nexus-explore-nav-btn"
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open && <div className="nexus-explore-nav-backdrop" onClick={() => setOpen(false)} />}

      <aside className={`nexus-explore-nav-drawer ${open ? "open" : ""}`} role="dialog" aria-label="Explore">
        <div className="nexus-explore-nav-head">
          <span className="nexus-explore-nav-title">Explore</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="nexus-explore-nav-close">✕</button>
        </div>

        <div className="nexus-explore-nav-scroll">
          {!magazine ? (
            <p style={{ fontSize: 13, opacity: .7, padding: "0 6px" }}>Open a magazine to see its topics & frontier.</p>
          ) : (
            <>
              <div className="nexus-explore-nav-label" style={{ marginTop: 22 }}>Browse by topic</div>
                            <SubcategoryRail magazine={magazine} />

                            {hasModelCard() && (
                                                            <>
                                                              <div className="nexus-explore-nav-label" style={{ marginTop: 22 }}>AI Model Watchlist</div>
                                                              <FrontierRail compact />
                                                            </>
                                                          )}

              {releases.length > 0 && (
                <>
                  <div className="nexus-explore-nav-label" style={{ marginTop: 22 }}>Releases</div>
                  {releases.map((r) => (
                    <a key={r.id} href={`/articles/${r.id}`} onClick={() => setOpen(false)} className="nexus-explore-nav-release">
                      <span className="nexus-explore-nav-date">{(r.publishedAt || "").slice(0, 10)}</span>
                      <span className="nexus-explore-nav-rtext">{r.headline || r.title}</span>
                    </a>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </aside>

      <style>{`
        .nexus-explore-nav-btn{
          position:fixed;top:14px;right:16px;z-index:120;
          display:inline-flex;align-items:center;justify-content:center;
          width:40px;height:40px;border-radius:10px;
          background:rgba(127,127,127,.12);border:1px solid rgba(127,127,127,.4);
          color:inherit;cursor:pointer;
        }
        .nexus-explore-nav-btn:hover{background:rgba(127,127,127,.22)}
        .nexus-explore-nav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:119}
        .nexus-explore-nav-drawer{
          position:fixed;top:0;right:0;bottom:0;width:min(340px,88vw);z-index:125;
          background:var(--page-bg,#0b0e11);color:inherit;
          border-left:1px solid rgba(150,150,150,.2);
          box-shadow:-18px 0 44px rgba(0,0,0,.5);
          display:flex;flex-direction:column;overflow:hidden;
          transform:translateX(105%);transition:transform .22s ease;pointer-events:none;
        }
        .nexus-explore-nav-drawer.open{transform:none;pointer-events:auto}
        .nexus-explore-nav-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(150,150,150,.15)}
        .nexus-explore-nav-title{font-size:15px;font-weight:800;letter-spacing:.5px}
        .nexus-explore-nav-close{background:transparent;border:1px solid rgba(150,150,150,.3);color:inherit;border-radius:8px;width:32px;height:32px;font-size:15px;cursor:pointer}
        .nexus-explore-nav-scroll{overflow-y:auto;padding:18px;flex:1}
        .nexus-explore-nav-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;opacity:.55;margin:4px 0 10px}
        .nexus-explore-nav-drawer .nexus-subcat-rail, .nexus-explore-nav-drawer .nexus-fr{position:static!important;border:1px solid rgba(150,150,150,.15)}
        .nexus-explore-nav-drawer .nexus-subcat-rail{display:block!important}
        .nexus-explore-nav-release{display:flex;align-items:baseline;gap:8px;padding:7px 2px;border-bottom:1px solid rgba(150,150,150,.08);font-size:12.5px;color:inherit;text-decoration:none;line-height:1.35}
        .nexus-explore-nav-release:hover{color:var(--accent,#ffd700)}
        .nexus-explore-nav-rtext{opacity:.9}
        /* If the left hamburger pins a rail on desktop, avoid overlap on the right nav brand */
        .nexus-explore-nav-btn{right:16px}
        @media(min-width:768px){
          /* keep both buttons visible in the navbar on all sizes */
        }
      `}</style>
    </>
  );
}