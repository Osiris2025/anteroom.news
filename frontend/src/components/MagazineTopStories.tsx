"use client";
import { useEffect, useState } from "react";

type LiveArticle = {
  id: string; title: string; headline?: string | null; summary: string | null;
  sourceUrl: string | null; imageUrl?: string | null; subcategory: string | null;
  featured?: boolean; pinned?: boolean; pinKind?: string | null;
  magazine: { id: string; name: string } | null; publishedAt?: string | null;
  commentary?: string | null;
};

const UID = "_mztopstories";

function makeQuote(a: LiveArticle): string {
  const raw = (a.commentary || a.summary || "").replace(/\s+/g, " ").trim();
  const parts = raw.split(/(?<=[.!?])\s+/).filter(Boolean);
  let line = parts[0] || raw;
  if (line.length > 160) line = line.slice(0, 157).replace(/\s+\S*$/, "") + "…";
  return line;
}

function pickLeader(arts: LiveArticle[]): LiveArticle | null {
  return arts.find((a) => a.featured === true) || arts[0] || null;
}

// Always pad the editorial grid with 2-3 compact "More in [Magazine]" cards so
// grid‑auto‑flow:dense pulls them into any partial gaps — making the layout
// look deliberate at every article count.
export default function MagazineTopStories({ magazine }: { magazine: string }) {
  const [articles, setArticles] = useState<LiveArticle[]>([]);

  useEffect(() => {
    fetch(`/api/articles?magazine=${magazine}`)
      .then((r) => r.json())
      .then((j) => { if (!j.error && Array.isArray(j.articles)) setArticles(j.articles); })
      .catch(() => {});
  }, [magazine]);

  const leader = pickLeader(articles);
  const grid = articles.filter((a) => a.id !== leader?.id);

  if (grid.length === 0) return null;

  // Build the mosaic
  const items: { type: "card" | "quote" | "more"; article?: LiveArticle; articles?: LiveArticle[]; className: string }[] = [];
  const spanPattern = ["", "wide", "tall", "", "", "wide", "", "tall", "", "", "wide", ""];
  const MAX_SHOWN = 12;
  grid.slice(0, MAX_SHOWN).forEach((a, i) => {
    if (i === 5 || i === 10) {
      items.push({ type: "quote", article: grid[i - 1], className: "mz-ed-quote mz-ed-q1" });
    }
    items.push({ type: "card", article: a, className: "mz-ed-card " + spanPattern[i % spanPattern.length] });
  });

  // Always add 2-3 filler "more" cards — they use articles already in the grid
  // so there's no extra fetch. grid‑auto‑flow:dense pulls them into any gaps.
  const fillerArticles = grid.slice(0, 8).filter((_, i) => i < 4 || i  > 3);
  // Create 2-3 filler chunks of 4 headlines each
  for (let c = 0; c < 2; c++) {
    const chunk = grid.slice(c * 4, c * 4 + 4);
    if (chunk.length > 0) {
      items.push({ type: "more", articles: chunk, className: "mz-ed-card mz-ed-more" });
    }
  }

  // Ensure leader?.magazine?.name is available as a fallback title
  const magName = leader?.magazine?.name || magazine;

  return (
    <section id={UID} style={{ marginTop: 28 }}>
      <style>{totemCss}</style>
      <div className="mz-ed-head">
        <span className="mz-ed-mark">▼</span>
        <h2 className="mz-ed-h2">From the Desk</h2>
      </div>
      <div className="mz-ed-grid">
        {items.map((it, idx) =>
          it.type === "quote" && it.article ? (
            <a key={`q-${idx}`} href={`/articles/${it.article.id}`} className={it.className} style={quoteLink}>
              <span className="mz-ed-qmark">“</span>
              <span className="mz-ed-qtext">{makeQuote(it.article)}</span>
              <span className="mz-ed-qby">— {it.article.magazine?.name || it.article.subcategory || "the desk"} · full story →</span>
            </a>
          ) : it.type === "more" && it.articles ? (
            <div key={`m-${idx}`} className={it.className} style={moreCard}>
              <div className="mz-ed-more-head">More in {magName}</div>
              {it.articles.map((a) => (
                <a key={a.id} href={`/articles/${a.id}`} className="mz-ed-more-item">
                  {a.headline || a.title}
                </a>
              ))}
            </div>
          ) : (
            <a key={it.article!.id} href={`/articles/${it.article!.id}`} className={it.className} style={cardLink}>
              {it.article!.imageUrl ? (
                <div className="mz-ed-thumb">
                  <img src={it.article!.imageUrl} alt="" loading="lazy" />
                </div>
              ) : null}
              <div className="mz-ed-kicker">
                {it.article!.pinned && it.article!.pinKind ? (
                  <span className="mz-ed-pin">{it.article!.pinKind}</span>
                ) : null}
                <span>{it.article!.subcategory || it.article!.magazine?.name || "News"}</span>
              </div>
              <div className="mz-ed-title">{it.article!.headline || it.article!.title}</div>
              {it.article!.summary && <div className="mz-ed-summary">{it.article!.summary}</div>}
            </a>
          )
        )}
      </div>
    </section>
  );
}

const cardLink: React.CSSProperties = {
  textDecoration: "none", color: "inherit", display: "flex",
  flexDirection: "column", padding: "18px 20px",
  border: "1px solid var(--border, rgba(150,150,150,.2))", borderRadius: 12,
  background: "var(--card-bg, rgba(255,255,255,.02))",
  transition: "transform .15s ease, border-color .15s ease", minWidth: 0,
};

const quoteLink: React.CSSProperties = {
  textDecoration: "none", color: "inherit", display: "flex",
  flexDirection: "column", padding: "20px 22px", borderRadius: 12,
  background: "var(--card-bg, rgba(255,255,255,.03))",
  borderLeft: "4px solid var(--accent, #ffd700)", minWidth: 0,
};

const moreCard: React.CSSProperties = {
  textDecoration: "none", color: "inherit", display: "flex",
  flexDirection: "column", padding: "14px 16px",
  border: "1px solid var(--border, rgba(150,150,150,.2))", borderRadius: 12,
  background: "var(--card-bg, rgba(255,255,255,.02))",
  minWidth: 0, gap: 6,
};

const totemCss = `
#${UID} .mz-ed-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
#${UID} .mz-ed-mark { color: var(--accent, #ffd700); font-size: 11px; }
#${UID} .mz-ed-h2 { margin: 0; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; color: inherit; }

#${UID} .mz-ed-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-flow: dense;
  gap: 16px;
}
#${UID} .mz-ed-card { grid-column: span 4; }
#${UID} .mz-ed-card.wide { grid-column: span 6; }
#${UID} .mz-ed-card.tall { grid-column: span 6; grid-row: span 2; display: flex; flex-direction: column; justify-content: space-between; }
#${UID} .mz-ed-quote { grid-column: span 6; justify-content: center; }
#${UID} .mz-ed-card.mz-ed-more { grid-column: span 3; gap: 0; }

#${UID} .mz-ed-kicker { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--accent, #ffd700); font-weight: 800; }
#${UID} .mz-ed-thumb { margin: -18px -20px 14px; border-radius: 12px 12px 0 0; overflow: hidden; background: var(--card-bg, rgba(127,127,127,.08)); }
#${UID} .mz-ed-thumb img { display: block; width: 100%; height: 130px; object-fit: cover; }
#${UID} .mz-ed-card.tall .mz-ed-thumb img { height: 180px; }
#${UID} .mz-ed-pin { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--accent, #ffd700); font-size: 9px; letter-spacing: 1px; }
#${UID} .mz-ed-title { font-size: 17px; font-weight: 800; line-height: 1.28; letter-spacing: -0.01em; }
#${UID} .mz-ed-card.wide .mz-ed-title { font-size: 20px; }
#${UID} .mz-ed-card.tall .mz-ed-title { font-size: 22px; }
#${UID} .mz-ed-summary { margin-top: 8px; font-size: 13px; line-height: 1.5; opacity: .72; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
#${UID} .mz-ed-card.tall .mz-ed-summary { -webkit-line-clamp: 6; }

#${UID} .mz-ed-more-head { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 800; color: var(--accent, #ffd700); margin-bottom: 4px; padding-bottom: 6px; border-bottom: 1px solid var(--border, rgba(150,150,150,.2)); }
#${UID} .mz-ed-more-item { display: block; padding: 5px 0; font-size: 12px; font-weight: 600; line-height: 1.3; color: inherit; text-decoration: none; border-bottom: 1px solid var(--border, rgba(150,150,150,.08)); transition: color .12s; }
#${UID} .mz-ed-more-item:last-child { border-bottom: none; }
#${UID} .mz-ed-more-item:hover { color: var(--accent, #ffd700); }

#${UID} .mz-ed-qmark { font-family: Georgia, serif; font-size: 64px; line-height: .8; color: var(--accent, #ffd700); margin-bottom: 6px; opacity: .85; }
#${UID} .mz-ed-qtext { font-size: 19px; font-weight: 700; line-height: 1.35; font-family: Georgia, serif; font-style: italic; letter-spacing: -0.01em; }
#${UID} .mz-ed-qby { margin-top: 12px; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--accent, #ffd700); font-weight: 800; }
#${UID} .mz-ed-card:hover, #${UID} .mz-ed-quote:hover, #${UID} .mz-ed-card.mz-ed-more:hover { border-color: var(--accent, #ffd700); }

@media (max-width: 900px) {
  #${UID} .mz-ed-card, #${UID} .mz-ed-card.wide, #${UID} .mz-ed-card.tall, #${UID} .mz-ed-quote { grid-column: span 6; }
  #${UID} .mz-ed-card.mz-ed-more { grid-column: span 6; }
}
@media (max-width: 560px) {
  #${UID} .mz-ed-grid { gap: 12px; }
  #${UID} .mz-ed-card, #${UID} .mz-ed-card.wide, #${UID} .mz-ed-card.tall, #${UID} .mz-ed-quote { grid-column: span 12; }
  #${UID} .mz-ed-card.mz-ed-more { grid-column: span 12; }
  #${UID} .mz-ed-card.tall .mz-ed-summary { -webkit-line-clamp: 3; }
}
`;