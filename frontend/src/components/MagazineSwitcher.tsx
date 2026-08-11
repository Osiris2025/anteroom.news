"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MAGAZINES } from "@/lib/themes";

/**
 * Global magazine-switcher (hamburger + left drawer + pinnable rail).
 * Replaces ALL the scattered magazine menus (theme header .nav / sidebar nav /
 * footer columns / navbar inline rows) with a single app-level switcher.
 *
 * - Hamburger (top-left, inside the Navbar row) opens a slide-in overlay drawer.
 * - Clicking a magazine navigates to /magazines/<id> AND closes the overlay.
 * - Pinnable on >=768px: pin keeps the list open as a persistent left rail
 *   (body padding shifts content right); the ❌ unpins it. Preference persisted
 *   in localStorage. On <768px no pin control and it's overlay-only.
 * - Theme-independent neutral styling (scoped `.nexus-switch-*`, one <style>).
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

  // When the pinned rail is active, shift the page right so it never covers content.
  useEffect(() => {
    document.body.style.paddingLeft = railActive ? RAIL_W + "px" : "";
    return () => {
      document.body.style.paddingLeft = "";
    };
  }, [railActive]);

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

  const list = (onSelect: () => void) => (
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
            className="nexus-switch-ico"
          >
            {isRail ? "❌" : "📌"}
          </button>
        )}
        {!isRail && (
          <button
            type="button"
            onClick={closeOverlay}
            aria-label="Close"
            className="nexus-switch-ico"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Hamburger — always visible on every page/theme unless the pinned rail is open. */}
      {!railActive && (
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
      )}

      {/* Persistent pinned rail (desktop only) */}
      {railActive && (
        <aside className="nexus-switch nexus-switch-rail" aria-label="Magazines">
          {head(true)}
          {list(() => {})}
        </aside>
      )}

      {/* Slide-in overlay drawer (mobile, or desktop when not pinned) */}
      {!railActive && open && (
        <>
          <div className="nexus-switch-backdrop" onClick={closeOverlay} />
          <aside className="nexus-switch nexus-switch-drawer" role="dialog" aria-label="Magazines">
            {head(false)}
            {list(closeOverlay)}
          </aside>
        </>
      )}

      <style>{`
        /* Neutral, theme-independent magazine-switcher styles (scoped). */
        .nexus-switch-btn{
          display:inline-flex;align-items:center;justify-content:center;
          width:36px;height:36px;border-radius:8px;flex:none;
          background:transparent;border:1px solid rgba(127,127,127,.28);
          color:inherit;cursor:pointer;margin-right:4px;padding:0;
          transition:background .15s;
        }
        .nexus-switch-btn:hover{background:rgba(127,127,127,.12);}
        .nexus-switch{
          position:fixed;top:0;bottom:0;left:0;z-index:95;
          width:min(320px,86vw);height:100vh;
          background:#10131a;color:#e7e9ee;
          border-right:1px solid rgba(255,255,255,.12);
          box-shadow:8px 0 30px rgba(0,0,0,.45);
          display:flex;flex-direction:column;overflow:hidden;
          font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
        }
        .nexus-switch-rail{z-index:80;width:264px;max-width:100%;animation:none;}
        .nexus-switch-drawer{animation:nexusSlide .22s ease;}
        .nexus-switch-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:90;}
        .nexus-switch-head{
          display:flex;align-items:center;justify-content:space-between;
          padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12);flex:none;
        }
        .nexus-switch-brand{font-weight:800;letter-spacing:1px;font-size:13px;text-transform:uppercase;color:#e7e9ee;}
        .nexus-switch-head-actions{display:flex;align-items:center;gap:4px;}
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
      `}</style>
    </>
  );
}