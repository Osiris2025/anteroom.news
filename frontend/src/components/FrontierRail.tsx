"use client";
import { useEffect, useState } from "react";

type Notice = {
  slug: string; name: string; vendor: string; color: string; desc: string; count: number;
  latest?: { id: string; title: string; headline?: string | null; publishedAt?: string | null } | null;
};

// Right-side "AI Frontier" column for the Neural Hardware magazine. Lists the
// freshest release per tracked model; each row links to a curated per-model page.
export default function FrontierRail() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/ai/notices")
      .then((r) => r.json())
      .then((j) => { if (!j.error) { setNotices(j.notices || []); setTotal(j.totalLive || 0); } else setErr(j.error); })
      .catch(() => setErr("couldn't load frontier"));
  }, []);

  if (err) return null;
  if (!notices.length) return null;

  return (
    <aside
      className="nexus-fr"
      style={{
        border: "1px solid var(--border, rgba(150,150,150,.2))",
        borderRadius: 14, padding: "16px 16px 12px",
        background: "var(--card-bg, rgba(255,255,255,.02))",
        alignSelf: "start",
      }}
    >
      <style>{`.nexus-fr{position:static;width:100%;z-index:10}.nexus-fr > *{width:100%}@media(min-width:921px){.nexus-fr{position:sticky;top:76px}}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent,#ffd700)" }} />
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>AI Frontier</h3>
        <span style={{ marginLeft: "auto", fontSize: 10, opacity: .6 }}>{total} live</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {notices.map((n) => {
          const hasStory = !!n.latest;
          return (
            <a
              key={n.slug}
              href={`/ai/${n.slug}`}
              style={{
                textDecoration: "none", color: "inherit", display: "flex", gap: 8,
                alignItems: "center", padding: "8px 6px", borderRadius: 8,
                borderBottom: "1px solid var(--border, rgba(150,150,150,.08))",
                transition: "background .12s", minWidth: 0, opacity: hasStory ? 1 : .55,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(127,127,127,.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ flex: "0 0 8px", width: 8, height: 8, borderRadius: "50%", background: n.color }} />
              <span style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>{n.name}</div>
                {hasStory ? (
                  <div style={{ fontSize: 11, opacity: .55, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.latest?.headline || n.latest?.title}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, opacity: .5, fontStyle: "italic" }}>{n.count ? `${n.count} stories` : "awaiting coverage"}</div>
                )}
                {n.count > 1 && <div style={{ fontSize: 9, opacity: .5, marginTop: 2 }}>{n.count} stories →</div>}
              </span>
            </a>
          );
        })}
      </div>
    </aside>
  );
}