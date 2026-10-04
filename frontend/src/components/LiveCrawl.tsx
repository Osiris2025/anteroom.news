"use client";
import { useEffect, useState } from "react";

type Item = { id: string; text: string; mag: string; breaking: boolean; img?: string };

/**
 * A cable-news style scrolling bar of the latest top stories (real, live articles).
 * Pinned "FLASH"/"IMPORTANT" stories come first (the API already orders them that
 * way) and are tagged BREAKING. Hover pauses it; "reduce motion" users get a
 * plain scrollable strip instead of animation.
 */
export default function LiveCrawl({ label = "TOP STORIES", variant = "crawler" }: { label?: string; variant?: "crawler" | "ticker" }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let off = false;
    const load = () =>
      fetch("/api/articles?magazine=all&limit=24")
        .then((r) => r.json())
        .then((j) => {
          if (off || !Array.isArray(j.articles)) return;
          const list: Item[] = j.articles
            .filter((a: any) => a.headline || a.title)
            .map((a: any) => ({
              id: a.id,
              text: String(a.headline || a.title).replace(/\s+/g, " ").trim(),
              mag: a.magazine?.name || "",
              breaking: !!a.pinned,
              img: a.imageUrl || undefined,
            }));
          setItems(list);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => { off = true; clearInterval(t); };
  }, []);

  if (!items.length) return null;
  // Roughly 6 seconds per story keeps the speed readable whatever the count.
  const secs = Math.max(60, items.length * 6);
  const track = (dup: boolean) => (
    <div className="nx-crawl-set" aria-hidden={dup || undefined}>
      {items.map((it) => (
        <a key={(dup ? "d" : "") + it.id} href={`/articles/${it.id}`} className="nx-crawl-item">
          {variant === "ticker" && (it.img ? <img className="nx-crawl-th" src={it.img} alt="" loading="lazy" /> : <span className="nx-crawl-th nx-crawl-th0" />)}
          {it.breaking && <b className="nx-crawl-brk">{variant === "ticker" ? "ALERT" : "BREAKING"}</b>}
          {it.mag && <span className="nx-crawl-mag">{it.mag}</span>}
          <span>{it.text}</span>
          <i className="nx-crawl-sep" />
        </a>
      ))}
    </div>
  );

  return (
    <div className={"nx-crawl" + (variant === "ticker" ? " nx-crawl--ticker" : "")} role="region" aria-label="Top stories">
      <style>{`
        .nx-crawl{display:flex;align-items:stretch;background:#000;border-top:3px solid #e11d2e;border-bottom:1px solid #2a2a2e;margin:0 0 18px;overflow:hidden;height:42px}
        .nx-crawl-label{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:0 16px;background:#e11d2e;color:#fff;font-family:'Oswald','Arial Narrow',Impact,sans-serif;font-weight:700;letter-spacing:.08em;font-size:15px;text-transform:uppercase;position:relative;z-index:2}
        .nx-crawl-label::after{content:"";position:absolute;right:-12px;top:0;border-left:12px solid #e11d2e;border-top:21px solid transparent;border-bottom:21px solid transparent}
        .nx-crawl-dot{width:9px;height:9px;border-radius:50%;background:#fff;animation:nxpulse 1.4s ease-in-out infinite}
        @keyframes nxpulse{0%,100%{opacity:1}50%{opacity:.25}}
        .nx-crawl-view{flex:1 1 auto;min-width:0;overflow:hidden;position:relative;padding-left:12px}
        .nx-crawl-track{display:inline-flex;white-space:nowrap;height:100%;align-items:center;animation:nxcrawl ${secs}s linear infinite;will-change:transform}
        .nx-crawl:hover .nx-crawl-track{animation-play-state:paused}
        @keyframes nxcrawl{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .nx-crawl-set{display:inline-flex;align-items:center}
        .nx-crawl-item{display:inline-flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-family:'Oswald','Arial Narrow',Impact,sans-serif;font-size:16px;letter-spacing:.02em;text-transform:uppercase}
        .nx-crawl-item:hover{color:#ffd400}
        .nx-crawl-brk{background:#ffd400;color:#000;padding:1px 7px;font-size:12px;letter-spacing:.08em}
        .nx-crawl-mag{color:#ff6b78;font-size:12px;letter-spacing:.1em}
        .nx-crawl-sep{display:inline-block;width:8px;height:8px;background:#e11d2e;margin:0 26px;transform:rotate(45deg)}
        .nx-crawl--ticker{background:#060b14;border-top:1px solid #0a3d5c;border-bottom:2px solid #00c2ff;height:46px;box-shadow:0 0 18px rgba(0,194,255,.18)}
        .nx-crawl--ticker .nx-crawl-label{background:#00c2ff;color:#04101c;font-family:'Chakra Petch','IBM Plex Mono',monospace;letter-spacing:.14em;font-size:13px}
        .nx-crawl--ticker .nx-crawl-label::after{border-left-color:#00c2ff;border-top-width:23px;border-bottom-width:23px}
        .nx-crawl--ticker .nx-crawl-dot{background:#04101c}
        .nx-crawl--ticker .nx-crawl-item{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;text-transform:none;letter-spacing:0;color:#dbe8f5;gap:9px}
        .nx-crawl--ticker .nx-crawl-item:hover{color:#00c2ff}
        .nx-crawl--ticker .nx-crawl-th{width:30px;height:30px;border-radius:4px;object-fit:cover;border:1px solid #14507a;flex:0 0 auto;display:block}
        .nx-crawl--ticker .nx-crawl-th0{background:linear-gradient(135deg,#0b3a5c,#0a2238)}
        .nx-crawl--ticker .nx-crawl-brk{background:#ffb020;color:#1a1000;font-size:10px;padding:2px 6px;border-radius:2px}
        .nx-crawl--ticker .nx-crawl-mag{color:#00c2ff;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
        .nx-crawl--ticker .nx-crawl-mag::before{content:"\\25B2 ";color:#2ee59d}
        .nx-crawl--ticker .nx-crawl-sep{background:#14507a;width:1px;height:20px;transform:none;margin:0 22px}
        @media (prefers-reduced-motion:reduce){.nx-crawl-track{animation:none}.nx-crawl-view{overflow-x:auto}}
      `}</style>
      <div className="nx-crawl-label"><span className="nx-crawl-dot" />{label}</div>
      <div className="nx-crawl-view">
        <div className="nx-crawl-track">
          {track(false)}
          {track(true)}
        </div>
      </div>
    </div>
  );
}
