"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MAGAZINES } from "@/lib/themes";
import TopNavItems from "@/components/TopNavItems";
import MagazineSearch from "@/components/MagazineSearch";

/**
 * Global magazine-switcher — hamburger + left drawer + pinnable rail.
 * Mounted OUTSIDE the navbar (in the root layout) so its fixed elements live at
 * body stacking level. That's what makes open/close reliable: the hamburger is a
 * fixed, always-on-top button, so clicking it always toggles the menu.
 *
 * - Hamburger (top-left) toggles a left slide-in drawer listing every magazine.
 * - Clicking a magazine navigates to /magazines/<id> AND closes.
 * - Pinnable on >=768px: pin turns the list into a persistent left rail and the
 *   page content flows to its right (no overlay). Preference in localStorage.
 * - On <768px: no pin; always a slide-in overlay.
 * - Escape / backdrop / ✕ / clicking the hamburger all close it.
 */

const PIN_KEY = "nexus-magazine-pinned";
const RAIL_W = 264;

export default function MagazineSwitcher() {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    try {
      if (localStorage.getItem(PIN_KEY) === "1") setPinned(true);
    } catch {
      /* ignore */
    }
    return () => mq.removeEventListener("change", sync);
  }, []);

  const railActive = isDesktop && pinned;

  // Make the pinned rail a REAL left edge: shift the page content right so it
  // flows beside the rail instead of being overlapped.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--nexus-rail-w",
      railActive ? RAIL_W + "px" : "0px"
    );
    document.body.classList.toggle("nexus-rail-on", railActive);
    return () => {
      document.documentElement.style.removeProperty("--nexus-rail-w");
      document.body.classList.remove("nexus-rail-on");
    };
  }, [railActive]);

  // Escape closes; also close on history navigation (e.g. a soft nav that didn't remount).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const togglePin = () =>
    setPinned((p) => {
      const next = !p;
      try {
        localStorage.setItem(PIN_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  const closeOverlay = () => setOpen(false);

  // Let TopNavItems close the drawer when tapped (mobile/tablet).
  useEffect(() => {
    (window as any).__nexusCloseDrawer = closeOverlay;
    return () => { delete (window as any).__nexusCloseDrawer; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const list = (onSelect: () => void, showTopItems: boolean) => (
    <>
      {showTopItems && (
        <div className="nexus-switch-top" style={{ padding: "10px 10px 4px", borderBottom: "1px solid rgba(255,255,255,.1)", marginBottom: 4 }}>
          <MagazineSearch vertical />
          <TopNavItems vertical />
        </div>
      )}
      <nav className="nexus-switch-list">
        {MAGAZINES.map((m) => (
          <Link
            key={m.id}
            href={"/magazines/" + m.id}
            onClick={onSelect}
            className="nexus-switch-item"
          >
            <span className="nexus-switch-dot" style={{ background: m.accent }} />
            <span className="nexus-switch-name">{m.name}</span>
          </Link>
        ))}
      </nav>
    </>
  );

  const head = (isRail: boolean) => (
    <div className="nexus-switch-head">
      <span className="nexus-switch-brand">Magazines</span>
      <div className="nexus-switch-head-actions">
        {isDesktop && (
          <button
            type="button"
            onClick={togglePin}
            title={isRail ? "Unpin" : "Pin open"}
            aria-label={isRail ? "Unpin magazine menu" : "Pin magazine menu open"}
            aria-pressed={isRail}
            className={"nexus-switch-pin" + (isRail ? " on" : "")}
          >
            {isRail ? "❌ Unpin" : "📌 Pin open"}
          </button>
        )}
        {!isRail && (
          <button type="button" onClick={closeOverlay} aria-label="Close" className="nexus-switch-ico nexus-switch-close">
            ✕ Close
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Fixed hamburger — always on top & clickable (opens right over the navbar). */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open magazine menu"
        aria-expanded={open}
        className="nexus-switch-btn"
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
        </svg>
      </button>

      {/* Backdrop (overlay mode only) */}
      {!railActive && open && (
        <div className="nexus-switch-backdrop" onClick={closeOverlay} />
      )}

      {/* Pinned rail — a real left edge; page flows right (no overlay). */}
      {railActive && (
        <aside className="nexus-switch nexus-switch-rail" aria-label="Magazines">
          {head(true)}
          {list(() => {}, false)}
        </aside>
      )}

      {/* Slide-in drawer (mobile, or desktop when not pinned) */}
      {!railActive && open && (
        <aside className="nexus-switch nexus-switch-drawer" role="dialog" aria-label="Magazines">
          {head(false)}
          {list(closeOverlay, true)}
        </aside>
      )}

      <style>{`
        /* Global: when the rail is pinned, shift content right so nothing is overlapped. */
        body.nexus-rail-on { padding-left: var(--nexus-rail-w, 264px); }
        body.nexus-rail-on nav, body.nexus-rail-on main { max-width: calc(1160px - 24px); margin-left: 0; }

        .nexus-switch-btn{
          position:fixed;top:14px;left:16px;z-index:120;
          display:inline-flex;align-items:center;justify-content:center;
          width:40px;height:40px;border-radius:10px;
          background:rgba(127,127,127,.12);border:1px solid rgba(127,127,127,.4);
          color:inherit;cursor:pointer;padding:0;box-shadow:0 2px 10px rgba(0,0,0,.25);
          transition:background .15s, transform .12s;
        }
        .nexus-switch-btn:hover{background:rgba(127,127,127,.22);}
        .nexus-switch-btn[aria-expanded="true"]{background:rgba(0,0,0,.55);color:#fff;}

        .nexus-switch{
          position:fixed;top:0;bottom:0;left:0;z-index:110;
          width:min(320px,86vw);height:100vh;
          background:#10131a;color:#e7e9ee;
          border-right:1px solid rgba(255,255,255,.12);
          box-shadow:8px 0 30px rgba(0,0,0,.45);
          display:flex;flex-direction:column;overflow:hidden;
          font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
        }
        .nexus-switch-rail{z-index:105;left:0;width:264px;max-width:100%;animation:none;box-shadow:none;}
        /* Push each row's left edge against the rail by the rail width. */
        body.nexus-rail-on .nexus-switch-rail{left:0;}
        .nexus-switch-drawer{animation:nexusSlide .22s ease;}
        .nexus-switch-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:109;}
        .nexus-switch-head{
          display:flex;align-items:center;justify-content:space-between;
          padding:20px 16px 14px;border-bottom:1px solid rgba(255,255,255,.12);flex:none;
        }
        .nexus-switch-brand{font-weight:800;letter-spacing:1px;font-size:13px;text-transform:uppercase;color:#e7e9ee;}
        .nexus-switch-head-actions{display:flex;align-items:center;gap:6px;}
        .nexus-switch-pin{
          padding:9px 14px;border-radius:9px;cursor:pointer;font-weight:700;font-size:13px;
          line-height:1;color:#ffd75e;background:rgba(255,215,94,.12);
          border:1px solid rgba(255,215,94,.45);transition:background .15s, transform .06s;
          display:inline-flex;align-items:center;gap:6px;min-height:38px;
        }
        .nexus-switch-pin:hover{background:rgba(255,215,94,.22);}
        .nexus-switch-pin:active{transform:scale(.97);}
        .nexus-switch-pin.on{color:#fff;background:rgba(255,120,110,.16);border-color:rgba(255,120,110,.5);}
        .nexus-switch-close{
          padding:9px 14px;border-radius:9px;cursor:pointer;font-weight:700;font-size:13px;
          line-height:1;color:#cdd3dd;background:transparent;border:1px solid rgba(255,255,255,.18);
          display:inline-flex;align-items:center;gap:6px;min-height:38px;
        }
        .nexus-switch-close:hover{background:rgba(255,255,255,.1);}
        .nexus-switch-ico{
          background:transparent;border:1px solid rgba(255,255,255,.14);border-radius:6px;
          cursor:pointer;font-size:14px;line-height:20px;color:#cdd3dd;padding:2px 6px;
        }
        .nexus-switch-ico:hover{background:rgba(255,255,255,.1);}
        .nexus-switch-list{overflow-y:auto;padding:10px;flex:1 1 auto;}
        .nexus-switch-item{
          display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;
          text-decoration:none;color:#e7e9ee;font-weight:600;font-size:14px;line-height:1.3;
          transition:background .12s;
        }
        .nexus-switch-item:hover{background:rgba(255,255,255,.09);}
        .nexus-switch-dot{width:10px;height:10px;border-radius:50%;flex:none;}
        @keyframes nexusSlide{from{transform:translateX(-100%);}to{transform:translateX(0);}}

        /* The app navbar is full-width; keep its brand clear of the fixed hamburger. */
        .nexus-brand-shift{margin-left:44px;}
      `}</style>
    </>
  );
}