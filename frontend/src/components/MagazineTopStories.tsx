"use client";
import { useEffect, useState } from "react";

type LiveArticle = {
  id: string; title: string; headline?: string | null; summary: string | null;
  sourceUrl: string | null; imageUrl?: string | null; subcategory: string | null;
  featured?: boolean; pinned?: boolean; pinKind?: string | null;
  magazine: { id: string; name: string } | null; publishedAt?: string | null;
  commentary?: string | null;
};

type GridItem = {
  type: "card" | "more";
  article?: LiveArticle;
  articles?: LiveArticle[];
  className: string;
  style?: React.CSSProperties;
};

const UID = "_mztopstories";

function pickLeader(arts: LiveArticle[]): LiveArticle | null {
  return arts.find((a) => a.featured === true) || arts[0] || null;
}

// Card widths: each article card is span 4 (1/3) or span 6 (1/2) — NO row-span
// (row-span is what created the unfillable gaps). We greedily place cards and
// close every row with a "More in [Magazine]" filler spanning the EXACT leftover
// (2,4,6,8). Since every row sums to exactly 12, there are no gaps at ANY count.
const spanSequence = [4, 6, 4, 6, 4, 4, 6, 4, 6, 4, 4, 6, 4, 6, 4];

function buildItems(articles: LiveArticle[], count: number, magName: string, fillerPool: LiveArticle[]): GridItem[] {
  const items: GridItem[] = [];
  const slice = articles.slice(0, count);
  let row = 0;          // columns used in current row
  let fillIdx = 0;
  let quotePending: LiveArticle | null = null;

  const pushFiller = (cols: number) => {
    if (cols < 2 || cols > 8) return;
    const n = Math.max(1, Math.round(cols / 2));
    const chunk = fillerPool.slice(fillIdx, fillIdx + n);
    fillIdx += chunk.length;
    if (chunk.length) items.push({ type: "more", articles: chunk, className: "mz-ed-card mz-ed-more", style: { gridColumnEnd: `span ${cols}` } });
  };

  slice.forEach((a, i) => {
    // A pull-quote card (span 6) every ~7 items, using the previous article.
    if (i % 7 === 6) {
      if (row + 6 > 12) { pushFiller(12 - row); row = 0; }
      items.push({ type: "card", article: a, className: "mz-ed-quote", style: { gridColumnEnd: "span 6" } });
      row += 6;
    }
    const w = spanSequence[i % spanSequence.length];
    if (row + w > 12) { pushFiller(12 - row); row = 0; }
    const wide = w === 6;
    items.push({ type: "card", article: a, className: "mz-ed-card" + (wide ? " wide" : ""), style: { gridColumnEnd: `span ${w}` } });
    row += w;
    if (row === 12) row = 0;
  });
  if (row > 0 && row < 12) pushFiller(12 - row);

  return items;
}

export default function MagazineTopStories({ magazine }: { magazine: string }) {
  const [articles, setArticles] = useState<LiveArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    fetch(`/api/articles?magazine=${magazine}&limit=200`)
      .then((r) => r.json())
      .then((j) => { if (!j.error && Array.isArray(j.articles)) { setArticles(j.articles); setTotal(j.total || 0); } })
      .catch(() => {});
  }, [magazine]);

  const leader = pickLeader(articles);
  const grid = articles.filter((a) => a.id !== leader?.id);
  const magName = leader?.magazine?.name || magazine;
  const fillerPool = articles.slice(visibleCount).length ? articles.slice(visibleCount) : grid;
  const items = buildItems(grid, visibleCount + 1, magName, fillerPool);
  const hasMore = visibleCount < total;

  if (grid.length === 0) return null;

  return (
    <section id={UID} style={{ marginTop: 28 }}>
      <style>{totemCss}</style>
      <div className="mz-ed-head">
        <span className="mz-ed-mark">▼</span>
        <h2 className="mz-ed-h2">From the Desk</h2>
      </div>
      <div className="mz-ed-grid">
        {items.map((it, idx) =>
          it.type === "more" && it.articles ? (
            <div key={`m-${idx}`} className={it.className} style={{ ...moreCard, ...it.style }}>
              <div className="mz-ed-more-head">More in {magName}</div>
              {it.articles.map((m, mi) => (
                <a key={m.id} href={`/articles/${m.id}`} className="mz-ed-more-item">{m.headline || m.title}</a>
              ))}
            </div>
          ) : it.className.includes("quote") ? (
            <a key={`q-${idx}`} href={`/articles/${it.article!.id}`} className={it.className} style={{ ...quoteLink, ...it.style }}>
              <span className="mz-ed-qmark">“</span>
              <span className="mz-ed-qtext">{it.article!.headline || it.article!.title}</span>
              <span className="mz-ed-qby">— {it.article!.magazine?.name || it.article!.subcategory || "the desk"} · full story →</span>
            </a>
          ) : (
            <a key={it.article!.id} href={`/articles/${it.article!.id}`} className={it.className} style={{ ...cardLink, ...it.style }}>
              {it.article!.imageUrl ? (
                <div className="mz-ed-thumb"><img src={it.article!.imageUrl} alt="" loading="lazy" /></div>
              ) : null}
              <div className="mz-ed-kicker">
                {it.article!.pinned && it.article!.pinKind ? <span className="mz-ed-pin">{it.article!.pinKind}</span> : null}
                <span>{it.article!.subcategory || it.article!.magazine?.name || "News"}</span>
              </div>
              <div className="mz-ed-title">{it.article!.headline || it.article!.title}</div>
              {it.article!.summary && <div className="mz-ed-summary">{it.article!.summary}</div>}
            </a>
          )
        )}
      </div>
      {hasMore && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <button onClick={() => setVisibleCount((c) => c + 15)}
            style={{ background: "transparent", border: "1px solid var(--accent, rgba(255,215,0,.4))", borderRadius: 8, color: "var(--accent, #ffd700)", padding: "8px 24px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            Load more ({visibleCount} / {total})
          </button>
        </div>
      )}
    </section>
  );
}

const cardLink: React.CSSProperties = {
  textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", padding: "18px 20px",
  border: "1px solid var(--border, rgba(150,150,150,.2))", borderRadius: 12, background: "var(--card-bg, rgba(255,255,255,.02))",
  transition: "transform .15s ease, border-color .15s ease", minWidth: 0,
};
const quoteLink: React.CSSProperties = {
  textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", padding: "20px 22px", borderRadius: 12,
  background: "var(--card-bg, rgba(255,255,255,.03))", borderLeft: "4px solid var(--accent, #ffd700)", minWidth: 0,
};
const moreCard: React.CSSProperties = {
  textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", padding: "14px 16px",
  border: "1px solid var(--border, rgba(150,150,150,.2))", borderRadius: 12, background: "var(--card-bg, rgba(255,255,255,.02))",
  minWidth: 0, gap: 6,
};

const totemCss = `
#${UID} .mz-ed-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
#${UID} .mz-ed-mark { color: var(--accent, #ffd700); font-size: 11px; }
#${UID} .mz-ed-h2 { margin: 0; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; color: inherit; }
#${UID} .mz-ed-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
#${UID} .mz-ed-card { grid-column: span 4; min-width: 0; }
#${UID} .mz-ed-card.wide {}
#${UID} .mz-ed-more { gap: 0; }
#${UID} .mz-ed-kicker { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--accent, #ffd700); font-weight: 800; }
#${UID} .mz-ed-thumb { margin: -18px -20px 14px; border-radius: 12px 12px 0 0; overflow: hidden; background: var(--card-bg, rgba(127,127,127,.08)); }
#${UID} .mz-ed-thumb img { display: block; width: 100%; height: 130px; object-fit: cover; }
#${UID} .mz-ed-pin { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--accent, #ffd700); font-size: 9px; letter-spacing: 1px; }
#${UID} .mz-ed-title { font-size: 17px; font-weight: 800; line-height: 1.28; letter-spacing: -0.01em; }
#${UID} .mz-ed-card.wide .mz-ed-title { font-size: 20px; }
#${UID} .mz-ed-summary { margin-top: 8px; font-size: 13px; line-height: 1.5; opacity: .72; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
#${UID} .mz-ed-more-head { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 800; color: var(--accent, #ffd700); margin-bottom: 4px; padding-bottom: 6px; border-bottom: 1px solid var(--border, rgba(150,150,150,.2)); }
#${UID} .mz-ed-more-item { display: block; padding: 5px 0; font-size: 12px; font-weight: 600; line-height: 1.3; color: inherit; text-decoration: none; border-bottom: 1px solid var(--border, rgba(150,150,150,.08)); transition: color .12s; }
#${UID} .mz-ed-more-item:last-child { border-bottom: none; }
#${UID} .mz-ed-more-item:hover { color: var(--accent, #ffd700); }
#${UID} .mz-ed-qmark { font-family: Georgia, serif; font-size: 56px; line-height: .8; color: var(--accent, #ffd700); margin-bottom: 6px; opacity: .85; }
#${UID} .mz-ed-qtext { font-size: 19px; font-weight: 700; line-height: 1.35; font-family: Georgia, serif; font-style: italic; letter-spacing: -0.01em; }
#${UID} .mz-ed-qby { margin-top: 12px; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--accent, #ffd700); font-weight: 800; }
#${UID} .mz-ed-card:hover, #${UID} .mz-ed-quote:hover, #${UID} .mz-ed-card.mz-ed-more:hover { border-color: var(--accent, #ffd700); }
@media (max-width: 900px) {
  #${UID} .mz-ed-grid { grid-template-columns: repeat(6, 1fr); }
  #${UID} .mz-ed-card, #${UID} .mz-ed-card.wide, #${UID} .mz-ed-more, #${UID} .mz-ed-quote { grid-column: span 3; }
}
@media (max-width: 560px) {
  #${UID} .mz-ed-grid { gap: 12px; grid-template-columns: repeat(1, 1fr); }
  #${UID} .mz-ed-card, #${UID} .mz-ed-card.wide, #${UID} .mz-ed-more, #${UID} .mz-ed-quote { grid-column: span 1; }
}
`;