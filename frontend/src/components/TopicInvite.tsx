"use client";
import { useEffect, useState } from "react";
import { subcatLabel } from "@/lib/subcategories";

type Subcat = { subcategory: string; n: number };

// A quiet one-line invitation under a magazine's title: "Explore AI Frontier by
// topic: Tools & Agents · Models & Research · Security & Attacks +6 more →".
// Clicking it opens the right-side Explore drawer, where the topic list lives
// (topics are deliberately NOT rendered as chips on the page itself).
// Renders nothing for magazines without subcategories. Theme-aware: it only uses
// the active theme's CSS variables (--accent, --card-bg, --border) and inherits
// the page's text colour and font.
export default function TopicInvite({ magazine, magazineName, accent, initial }: {
  magazine: string;
  magazineName: string;
  accent?: string;
  /** Pre-loaded topics (skips the fetch; used by previews/tests). */
  initial?: Subcat[];
}) {
  const [subcats, setSubcats] = useState<Subcat[]>(initial || []);

  useEffect(() => {
    if (initial) return;
    let alive = true;
    fetch(`/api/articles/subcats?magazine=${encodeURIComponent(magazine)}`)
      .then((r) => r.json())
      .then((j) => { if (alive && Array.isArray(j?.subcats)) setSubcats(j.subcats); })
      .catch(() => {});
    return () => { alive = false; };
  }, [magazine, initial]);

  const topics = subcats.filter((s) => s.subcategory && s.subcategory !== "Releases");
  if (!topics.length) return null;

  const shown = topics.slice(0, 3);
  const more = topics.length - shown.length;
  const tint = accent ? `var(--accent, ${accent})` : "var(--accent, #7c5cff)";

  const open = () => {
    try { window.dispatchEvent(new CustomEvent("nexus:open-explore")); } catch {}
  };

  return (
    <button type="button" className="nx-topic-invite" onClick={open}
      aria-label={`Explore ${magazineName} by topic`} title="Open the Explore menu">
      <style>{`
        .nx-topic-invite{display:inline-flex;align-items:center;gap:8px;max-width:100%;margin:6px 0 4px;
          padding:6px 14px 6px 10px;border-radius:999px;cursor:pointer;font:inherit;font-size:13px;line-height:1.35;
          color:inherit;text-align:left;background:var(--card-bg, rgba(127,127,127,.06));
          border:1px solid var(--border, rgba(127,127,127,.25));transition:border-color .15s, background .15s}
        .nx-topic-invite:hover{border-color:${tint};background:color-mix(in srgb, ${tint} 10%, transparent)}
        .nx-topic-invite:focus-visible{outline:2px solid ${tint};outline-offset:2px}
        .nx-topic-invite .nx-ti-dot{flex:none;width:18px;height:18px;border-radius:50%;display:inline-flex;
          align-items:center;justify-content:center;font-size:11px;color:${tint};
          border:1px solid color-mix(in srgb, ${tint} 55%, transparent)}
        .nx-topic-invite .nx-ti-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.88}
        .nx-topic-invite .nx-ti-topic{color:${tint};font-weight:650}
        .nx-topic-invite .nx-ti-sep{opacity:.45;margin:0 5px}
        .nx-topic-invite .nx-ti-more{opacity:.6;margin-left:6px}
        .nx-topic-invite .nx-ti-arrow{flex:none;color:${tint};font-weight:700;transition:transform .15s}
        .nx-topic-invite:hover .nx-ti-arrow{transform:translateX(3px)}
        @media(max-width:640px){.nx-topic-invite{font-size:12px}.nx-topic-invite .nx-ti-lead{display:none}}
      `}</style>
      <span className="nx-ti-dot" aria-hidden>◇</span>
      <span className="nx-ti-text">
        <span className="nx-ti-lead">Explore {magazineName} by topic: </span>
        {shown.map((s, i) => (
          <span key={s.subcategory}>
            {i > 0 && <span className="nx-ti-sep">·</span>}
            <span className="nx-ti-topic">{subcatLabel(s.subcategory, magazine)}</span>
          </span>
        ))}
        {more > 0 && <span className="nx-ti-more">+{more} more</span>}
      </span>
      <span className="nx-ti-arrow" aria-hidden>→</span>
    </button>
  );
}
