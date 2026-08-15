"use client";
import { useEffect, useState } from "react";

type Subcat = { subcategory: string; n: number };

// Sidebar "Browse" chip list — shows a magazine's subcategories ONLY when they
// have content. Hidden entirely if the magazine has no tagged subcategories.
export default function SubcategoryRail({ magazine }: { magazine: string }) {
  const [subcats, setSubcats] = useState<Subcat[]>([]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/articles/subcats?magazine=${magazine}`)
      .then((r) => r.json())
      .then((j) => { if (alive && !j.error && Array.isArray(j.subcats)) setSubcats(j.subcats); })
      .catch(() => {});
    return () => { alive = false; };
  }, [magazine]);

  // Nothing to show until a magazine actually has subcategory-tagged content.
  if (!subcats.length) return null;

  const label = (s: string) => s
    .split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    .replace(/\bReleases\b/, "Releases");

  return (
    <aside
      className="nexus-subcat-rail"
      style={{
        border: "1px solid var(--border, rgba(150,150,150,.2))",
        borderRadius: 14, padding: "16px 16px 12px",
        background: "var(--card-bg, rgba(255,255,255,.02))",
        alignSelf: "start",
      }}
    >
      <style>{`.nexus-subcat-rail{position:static;width:100%;z-index:10}
        .nexus-subcat-rail > *{width:100%}
        @media(min-width:921px){.nexus-subcat-rail{position:sticky;top:76px}}
        .nexus-subcat-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;
          border:1px solid rgba(150,150,150,.25);font-size:11px;font-weight:600;color:inherit;
          text-decoration:none;transition:background .12s}
        .nexus-subcat-chip:hover{background:rgba(127,127,127,.12)}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent,#ffd700)" }} />
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>Browse</h3>
        <span style={{ marginLeft: "auto", fontSize: 10, opacity: .6 }}>{subcats.length} topics</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {subcats.map((s) => (
          <a
            key={s.subcategory}
            href={`/magazines/${magazine}?subcat=${s.subcategory}`}
            className="nexus-subcat-chip"
          >
            {label(s.subcategory)}
            <span style={{ opacity: .55, fontSize: 10 }}>{s.n}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
