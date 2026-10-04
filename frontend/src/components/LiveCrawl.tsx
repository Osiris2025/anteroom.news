"use client";
import { useEffect, useState } from "react";

type Item = { id: string; text: string; mag: string; breaking: boolean };

/**
 * A cable-news style scrolling bar of the latest top stories (real, live articles).
 * Pinned "FLASH"/"IMPORTANT" stories come first (the API already orders them that
 * way) and are tagged BREAKING. Hover pauses it; "reduce motion" users get a
 * plain scrollable strip instead of animation.
 */
export default function LiveCrawl({ label = "TOP STORIES" }: { label?: string }) {
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
          {it.breaking && <b className="nx-crawl-brk">BREAKING</b>}
          {it.mag && <span className="nx-crawl-mag">{it.mag}</span>}
          <span>{it.text}</span>
          <i className="nx-crawl-sep" />
        </a>
      ))}
    </div>
  );

  return (
    <div className="nx-crawl" role="region" aria-label="Top stories">
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
