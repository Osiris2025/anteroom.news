"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * "Window shade" for the top of the slide-out sidebar (profile, Messages,
 * Notifications, Search, Theme). On phones (< 768px) a little pull-cord with a
 * ring hangs from the bottom edge of that section; tap it (or drag it up/down)
 * to roll the section up or down so the magazine list gets the room.
 * On >= 768px the handle is hidden and the section is always fully shown.
 * State is remembered in localStorage.
 */

const KEY = "nexus-sidebar-top-collapsed";
const DRAG_THRESHOLD = 14; // px of vertical drag that counts as a pull

export default function SidebarShade({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragY, setDragY] = useState(0);
  const start = useRef<{ y: number; id: number } | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const set = (next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    start.current = { y: e.clientY, id: e.pointerId };
    dragged.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    const dy = e.clientY - start.current.y;
    if (Math.abs(dy) > 4) dragged.current = true;
    setDragY(Math.max(-8, Math.min(14, dy)));
  };
  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    const dy = e.clientY - start.current.y;
    start.current = null;
    setDragY(0);
    if (e.type === "pointercancel") return;
    if (dy > DRAG_THRESHOLD && collapsed) set(false);
    else if (dy < -DRAG_THRESHOLD && !collapsed) set(true);
  };
  const onClick = () => {
    // A drag already handled its own action; only plain taps / keyboard toggle.
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    set(!collapsed);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") { e.preventDefault(); set(true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); set(false); }
  };

  return (
    <div className={"nexus-shade" + (collapsed ? " is-collapsed" : "")}>
      <div className="nexus-shade-clip" id="nexus-shade-body">
        <div className="nexus-shade-inner">{children}</div>
      </div>
      <div className="nexus-shade-pull">
        <span className="nexus-shade-rail" aria-hidden />
        <button
          type="button"
          className="nexus-shade-btn"
          aria-expanded={!collapsed}
          aria-controls="nexus-shade-body"
          aria-label={collapsed ? "Expand top menu" : "Collapse top menu"}
          title={collapsed ? "Pull down to show the menu" : "Pull up to hide the menu"}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span className="nexus-shade-cord" aria-hidden style={{ height: 8 + Math.max(0, dragY) }} />
          <span className="nexus-shade-ring" aria-hidden style={{ transform: `translateY(${dragY > 0 ? 0 : dragY}px)` }}>
            <span className="nexus-shade-chev">{collapsed ? "▾" : "▴"}</span>
          </span>
        </button>
      </div>
      <style>{`
        .nexus-shade{flex:none;}
        .nexus-shade-clip{
          display:grid;grid-template-rows:1fr;
          transition:grid-template-rows .28s cubic-bezier(.4,0,.2,1);
        }
        .nexus-shade-inner{min-height:0;overflow:hidden;transition:opacity .22s ease, visibility 0s;}
        /* the pull handle only exists on phones */
        .nexus-shade-pull{display:none;}
        @media (max-width:767px){
          .nexus-shade.is-collapsed .nexus-shade-clip{grid-template-rows:0fr;}
          .nexus-shade.is-collapsed .nexus-shade-inner{
            opacity:0;visibility:hidden;transition:opacity .2s ease, visibility 0s .28s;
          }
          .nexus-shade-pull{
            display:flex;justify-content:center;position:relative;
            height:42px;margin-bottom:2px;
          }
          /* the bottom slat of the shade */
          .nexus-shade-rail{
            position:absolute;left:10px;right:10px;top:0;height:4px;border-radius:0 0 4px 4px;
            background:linear-gradient(to bottom,rgba(255,255,255,.32),rgba(255,255,255,.12));
            box-shadow:0 1px 3px rgba(0,0,0,.5);
          }
          .nexus-shade-btn{
            position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;
            width:64px;height:42px;padding:0;margin:0;border:none;background:none;cursor:grab;
            color:#ffd75e;touch-action:none;-webkit-tap-highlight-color:transparent;
            font-family:inherit;
          }
          .nexus-shade-btn:active{cursor:grabbing;}
          .nexus-shade-cord{
            display:block;width:2px;margin-top:4px;background:rgba(255,255,255,.4);
            border-radius:1px;transition:height .12s ease;flex:none;
          }
          .nexus-shade-ring{
            display:inline-flex;align-items:center;justify-content:center;
            width:24px;height:24px;border-radius:50%;box-sizing:border-box;
            border:2px solid #ffd75e;background:rgba(255,215,94,.14);
            box-shadow:0 2px 5px rgba(0,0,0,.5), inset 0 0 0 2px rgba(0,0,0,.25);
            transition:transform .15s ease, background .15s;flex:none;
          }
          .nexus-shade-btn:hover .nexus-shade-ring{background:rgba(255,215,94,.26);}
          .nexus-shade-btn:focus-visible{outline:none;}
          .nexus-shade-btn:focus-visible .nexus-shade-ring{outline:2px solid #fff;outline-offset:2px;}
          .nexus-shade-chev{font-size:11px;line-height:1;}
        }
        @media (prefers-reduced-motion:reduce){
          .nexus-shade-clip,.nexus-shade-inner,.nexus-shade-cord,.nexus-shade-ring{transition:none !important;}
        }
      `}</style>
    </div>
  );
}
