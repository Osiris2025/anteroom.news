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
  wide?: boolean;
  className: string;
  style?: React.CSSProperties;
};

const UID = "_mztopstories";

function pickLeader(arts: LiveArticle[]): LiveArticle | null {
  return arts.find((a) => a.featured === true) || arts[0] || null;
}

// Row-complete span plans: every plan sums to exactly 12 columns (no gaps).
//   A = [6,6]         2 double-wide cards
//   B = [4,4,4]       3 one-third cards (adds rhythm)
// We alternate A, B, A, B... so the grid is mostly double-wide with periodic
// one-third breaks, and NEVER has an empty slot.
const ROW_PLANS: number[][] = [
  [6, 6],
  [4, 4, 4],
  [6, 6],
  [4, 4, 4],
];

function buildItems(articles: LiveArticle[], count: number): GridItem[] {
  const items: GridItem[] = [];
  const slice = articles.slice(0, count);

  let ai = 0;
  let planIdx = 0;
  while (ai < slice.length) {
    const plan = ROW_PLANS[planIdx % ROW_PLANS.length];
    const rowItems = slice.slice(ai, ai + plan.length);
    rowItems.forEach((a, j) => {
      const w = plan[j] ?? 4;
      items.push({ type: "card", article: a, wide: w === 6, className: "mz-ed-card", style: { gridColumnEnd: `span ${w}` } });
    });
    ai += plan.length;
    planIdx++;
  }

  return items;
}

export default function MagazineTopStories({ magazine }: { magazine: string }) {
  const [articles, setArticles] = useState<LiveArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [visibleCount, setVisibleCount] = useState(18);

  useEffect(() => {
    fetch(`/api/articles?magazine=${magazine}&limit=200`)
      .then((r) => r.json())
      .then((j) => { if (!j.error && Array.isArray(j.articles)) { setArticles(j.articles); setTotal(j.total || 0); } })
      .catch(() => {});
  }, [magazine]);

  const leader = pickLeader(articles);
  const grid = articles.filter((a) => a.id !== leader?.id);
  const magName = leader?.magazine?.name || magazine;

  // Main mosaic: fill rows naturally with real article cards (mostly double-wide).
  const main = buildItems(grid, visibleCount);

  // "More in" — a SINGLE wide, appealing block with thumbnails, placed after the
  // first N cards. It reflects articles NOT already shown near the top, and is
  // NOT repeated on every row.
  const morePool = articles.slice(visibleCount).length ? articles.slice(visibleCount) : grid.slice(visibleCount);
  const moreItems = morePool.slice(0, 4);

  const hasMore = visibleCount < total;

  if (grid.length === 0) return null;

  // Split the main grid in two parts: cards up to index 9, then the more-block,
  // then the rest — so the big full-width "More in" block sits in the middle.
  const head = main.slice(0, 9);
  const tail = main.slice(9);

  return (
    <section id={UID} style={{ marginTop: 28 }}>
      <style>{totemCss}</style>
      <div className="mz-ed-head">
        <span className="mz-ed-mark">▼</span>
        <h2 className="mz-ed-h2">From the Desk</h2>
      </div>

      {head.length > 0 && (
        <div className="mz-ed-grid">{head.map(renderCard)}</div>
      )}

      {moreItems.length > 0 && (
        <div className="mz-ed-moreblock" style={{ marginTop: 20 }}>
          <div className="mz-ed-moreblock-head">
            <span className="mz-ed-mark">▸</span> More in {magName}
          </div>
          <div className="mz-ed-moreblock-grid">
            {moreItems.map((m) => (
              <a key={m.id} href={`/articles/${m.id}`} className="mz-ed-moreblock-card">
                {m.imageUrl ? (
                  <span className="mz-ed-moreblock-thumb"><img src={m.imageUrl} alt="" loading="lazy" /></span>
                ) : null}
                <span className="mz-ed-moreblock-title">{m.headline || m.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {tail.length > 0 && (
        <div className="mz-ed-grid" style={{ marginTop: 20 }}>{tail.map(renderCard)}</div>
      )}

      {hasMore && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <button onClick={() => setVisibleCount((c) => c + 18)}
            style={{ background: "transparent", border: "1px solid var(--accent, rgba(255,215,0,.4))", borderRadius: 8, color: "var(--accent, #ffd700)", padding: "8px 24px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            Load more ({visibleCount} / {total})
          </button>
        </div>
      )}
    </section>
  );

  function renderCard(it: GridItem, idx: number) {
    if (it.type !== "card" || !it.article) return null;
    return (
      <a key={it.article.id} href={`/articles/${it.article.id}`} className={it.className} style={{ ...cardLink, ...it.style }}>
        {it.article.imageUrl ? (
          <div className="mz-ed-thumb"><img src={it.article.imageUrl} alt="" loading="lazy" /></div>
        ) : null}
        <div className="mz-ed-kicker">
          {it.article.pinned && it.article.pinKind ? <span className="mz-ed-pin">{it.article.pinKind}</span> : null}
          <span>{it.article.subcategory || it.article.magazine?.name || "News"}</span>
        </div>
        <div className={`mz-ed-title${it.wide ? " wide" : ""}`}>{it.article.headline || it.article.title}</div>
        {it.article.summary && <div className="mz-ed-summary">{it.article.summary}</div>}
      </a>
    );
  }
}

const cardLink: React.CSSProperties = {
  textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", padding: "18px 20px",
  border: "1px solid var(--border, rgba(150,150,150,.2))", borderRadius: 12, background: "var(--card-bg, rgba(255,255,255,.02))",
  transition: "transform .15s ease, border-color .15s ease", minWidth: 0,
};

const totemCss = `
#${UID} .mz-ed-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
#${UID} .mz-ed-mark { color: var(--accent, #ffd700); font-size: 11px; }
#${UID} .mz-ed-h2 { margin: 0; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; color: inherit; }
#${UID} .mz-ed-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
#${UID} .mz-ed-card { grid-column: span 4; min-width: 0; }
#${UID} .mz-ed-kicker { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--accent, #ffd700); font-weight: 800; }
#${UID} .mz-ed-thumb { margin: -18px -20px 14px; border-radius: 12px 12px 0 0; overflow: hidden; background: var(--card-bg, rgba(127,127,127,.08)); }
#${UID} .mz-ed-thumb img { display: block; width: 100%; height: 150px; object-fit: cover; }
#${UID} .mz-ed-pin { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--accent, #ffd700); font-size: 9px; letter-spacing: 1px; }
#${UID} .mz-ed-title { font-size: 17px; font-weight: 800; line-height: 1.28; letter-spacing: -0.01em; }
#${UID} .mz-ed-title.wide { font-size: 22px; }
#${UID} .mz-ed-summary { margin-top: 8px; font-size: 13px; line-height: 1.5; opacity: .72; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

/* "More in" — one wide, attractive block with thumbnails, not repeated */
#${UID} .mz-ed-moreblock { border: 1px solid var(--border, rgba(150,150,150,.2)); border-radius: 14px; padding: 18px 20px; background: linear-gradient(180deg, var(--card-bg, rgba(255,255,255,.03)), transparent); }
#${UID} .mz-ed-moreblock-head { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; color: var(--accent, #ffd700); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
#${UID} .mz-ed-moreblock-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
#${UID} .mz-ed-moreblock-card { display: flex; flex-direction: column; gap: 8px; text-decoration: none; color: inherit; border: 1px solid var(--border, rgba(150,150,150,.12)); border-radius: 10px; overflow: hidden; background: var(--card-bg, rgba(255,255,255,.02)); transition: transform .15s ease, border-color .15s ease; padding: 10px; }
#${UID} .mz-ed-moreblock-card:hover { border-color: var(--accent, #ffd700); transform: translateY(-2px); }
#${UID} .mz-ed-moreblock-thumb { display: block; width: 100%; height: 96px; border-radius: 8px; overflow: hidden; background: var(--card-bg, rgba(127,127,127,.08)); }
#${UID} .mz-ed-moreblock-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
#${UID} .mz-ed-moreblock-title { font-size: 13px; font-weight: 700; line-height: 1.3; }

@media (max-width: 900px) {
  #${UID} .mz-ed-grid { grid-template-columns: repeat(6, 1fr); }
  #${UID} .mz-ed-card { grid-column: span 3 !important; }
}
@media (max-width: 560px) {
  #${UID} .mz-ed-grid { grid-template-columns: repeat(1, 1fr); gap: 12px; }
  #${UID} .mz-ed-card { grid-column: span 1 !important; }
  #${UID} .mz-ed-title.wide { font-size: 19px; }
}
`;