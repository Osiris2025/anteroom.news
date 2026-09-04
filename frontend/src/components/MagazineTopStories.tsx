"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AdminCardTools from "@/components/AdminCardTools";

type LiveArticle = {
  id: string; title: string; headline?: string | null; summary: string | null;
  sourceUrl: string | null; imageUrl?: string | null; subcategory: string | null;
  featured?: boolean; pinned?: boolean; pinKind?: string | null;
  magazine: { id: string; name: string } | null; publishedAt?: string | null;
  commentary?: string | null;
};

type Cell = {
  key: string;
  article: LiveArticle;
  col: number;   // column start (0-11)
  w: number;     // column span (2/3/4/6)
  r: number;     // row start
  tall: boolean; // spans 2 rows
};

const UID = "_mztopstories";

// Humanize a subcategory slug: "hardware-datacenters" → "Hardware Datacenters".
function label(slug: string): string {
  return slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function pickLeader(arts: LiveArticle[]): LiveArticle | null {
  return arts.find((a) => a.featured === true) || arts[0] || null;
}

// All compositions of 12 using widths {2,3,4,6} = valid single-row recipes.
function* comps(n: number, parts: number[]): Generator<number[]> {
  if (n === 0) { yield []; return; }
  for (const w of parts) {
    if (w <= n) for (const rest of comps(n - w, parts)) yield [w, ...rest];
  }
}
const SINGLE: number[][] = [...comps(12, [2, 3, 4, 6])].filter((c) => c.length <= 4);

// Deterministic PRNG (mulberry32) so layouts vary by magazine but are stable
// within a session rather than reshuffling every render.
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a varied, gap-free grid: mostly double-wide, mixed [6,6]/[3,3,3,3]/
// [6,3,3]/[2,6,4]/[4,4,4]/... plus occasional double-height cards. Every band
// spans exactly a full row (12 cols) — placed top-to-bottom, left-to-right —
// so the grid never leaves an empty slot in the middle.
function buildCells(articles: LiveArticle[], count: number, magazine: string): Cell[] {
  const slice = articles.slice(0, count);
  const rng = mulberry32(magazine.length * 7919 + 13);
  const cells: Cell[] = [];
  let i = 0;
  let row = 0;

  while (i < slice.length) {
    // ~28% chance of a double-height "tall-left" band: a 6-wide card spanning
    // 2 rows, mirrored by two stacked cards in the right half.
    if (i + 3 <= slice.length && rng() < 0.30) {
      const a = slice[i], b = slice[i + 1], c = slice[i + 2];
      cells.push({ key: a.id, article: a, col: 0, w: 6, r: row, tall: true });
      cells.push({ key: b.id, article: b, col: 6, w: 6, r: row, tall: false });
      cells.push({ key: c.id, article: c, col: 6, w: 6, r: row + 1, tall: false });
      row += 2; i += 3;
    } else {
      const pat = SINGLE[Math.floor(rng() * SINGLE.length)];
      const cards = Math.min(pat.length, slice.length - i);
      let col = 0;
      for (let j = 0; j < cards; j++) {
        const w = pat[j];
        cells.push({ key: slice[i + j].id, article: slice[i + j], col, w, r: row, tall: false });
        col += w;
      }
      row += 1; i += cards;
    }
  }
  return cells.filter((c) => c.article);
}

export default function MagazineTopStories({ magazine }: { magazine: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subcatParam = searchParams.get("subcat") || "";
  const [articles, setArticles] = useState<LiveArticle[]>([]);
  const [openTools, setOpenTools] = useState<Record<string, boolean>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [loadingPg, setLoadingPg] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [magazines, setMagazines] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Admin inline-editor hover tools on every magazine; no longer a Dark Matter pilot.
    fetch("/api/admin/session").then((r) => r.json()).then((j) => {
      setIsAdmin(!!j.isAdmin);
      if (j.isAdmin) {
        fetch("/api/magazines").then((r) => r.json()).then((m) => {
          if (m.magazines) setMagazines(m.magazines.map((x: any) => ({ id: x.id, name: x.name })));
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [magazine]);

  const load = useCallback((pg: number, sz: number) => {
    setLoadingPg(true);
    const q = subcatParam && subcatParam !== "all" ? `&subcat=${encodeURIComponent(subcatParam)}` : "";
    fetch(`/api/articles?magazine=${magazine}&limit=${sz}&offset=${pg * sz}${q}`)
      .then((r) => r.json())
      .then((j) => { if (!j.error && Array.isArray(j.articles)) { setArticles(j.articles); setTotal(j.total || 0); } })
      .catch(() => {})
      .finally(() => setLoadingPg(false));
  }, [magazine, subcatParam]);

  // Reset to page 0 whenever the magazine or subcategory changes.
  useEffect(() => { setPage(0); }, [magazine, subcatParam]);

  // Load the current page (also fires on magazine/subcat change via deps).
  useEffect(() => { load(page, size); }, [magazine, subcatParam, page, size, load]);

  // Refresh the grid in place after an admin action (e.g. comment/pin).
  const refresh = useCallback(() => { load(page, size); }, [load, page, size]);

  const leader = page === 0 ? pickLeader(articles) : null;
  const grid = page === 0 ? articles.filter((a) => a.id !== leader?.id) : articles;

  // Derive the magazine's subcategory vocabulary from loaded articles (fallback
  // to a small default set if none are tagged yet).
  const subcats = useMemo(() => {
    const s = new Set<string>();
    for (const a of articles) if (a.subcategory) s.add(a.subcategory);
    return s.size ? [...s] : ["Features", "Analysis", "Explainers", "Briefs"];
  }, [articles]);

  const cells = buildCells(grid, grid.length, magazine);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const canPrev = page > 0;
  const canNext = (page + 1) * size < total;

  if (grid.length === 0) return null;

  const gridCss: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gridAutoRows: "auto",
    gap: 16,
  };

  return (
    <section id={UID} style={{ marginTop: 28 }}>
      <style>{totemCss}</style>
      <div className="mz-ed-head">
        <span className="mz-ed-mark">▼</span>
        <h2 className="mz-ed-h2">
          {subcatParam ? <>“{subcatParam}” stories</> : "From the Desk"}
        </h2>
      </div>

      {subcatParam && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 12px", borderRadius: 999,
            border: "1px solid var(--accent, rgba(255,215,0,.45))",
            background: "rgba(255,215,0,.08)", color: "var(--accent, #ffd700)",
            fontSize: 12, fontWeight: 700,
          }}>
            Filtering: {label(subcatParam)} ({total} stories)
          </span>
          <button
            onClick={() => router.push(`/magazines/${magazine}`)}
            style={{
              background: "transparent", border: "1px solid rgba(150,150,150,.3)",
              borderRadius: 999, color: "inherit", padding: "5px 14px",
              cursor: "pointer", fontSize: 12, fontWeight: 700,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(127,127,127,.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            × Clear filter
          </button>
        </div>
      )}

      {/* ONE continuous grid — all cells share the same container so the packer's
          explicit grid-row placement stays gap-free from top to bottom (splitting
          into two grids earlier is what caused the big void between rows). */}
      <div className="mz-ed-grid">{cells.map((c, i) => renderCell(c, i))}</div>

      <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        <label style={{ fontSize: 12, color: "inherit", opacity: .8, display: "inline-flex", alignItems: "center", gap: 6 }}>
          Per page
          <select value={size} onChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
            style={{ background: "var(--card-bg, rgba(127,127,127,.1))", color: "inherit", border: "1px solid var(--border, rgba(150,150,150,.3))", borderRadius: 6, padding: "6px 8px", fontSize: 13, cursor: "pointer" }}>
            {[20, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!canPrev || loadingPg} style={{ ...pgBtn, opacity: (!canPrev || loadingPg) ? .4 : 1, cursor: (!canPrev || loadingPg) ? "not-allowed" : "pointer" }}>◀ Prev</button>
        <span style={{ fontSize: 13, opacity: .8 }}>{loadingPg ? "Loading…" : `Page ${page + 1} of ${totalPages} · ${total.toLocaleString()} stories`}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={!canNext || loadingPg} style={{ ...pgBtn, opacity: (!canNext || loadingPg) ? .4 : 1, cursor: (!canNext || loadingPg) ? "not-allowed" : "pointer" }}>Next ▶</button>
      </div>
    </section>
  );

  function renderCell(c: Cell, idx: number) {
    const style: React.CSSProperties = {
      gridColumnStart: c.col + 1,
      gridColumnEnd: c.col + 1 + c.w,
      gridRowStart: c.r + 1,
      gridRowEnd: c.tall ? c.r + 3 : c.r + 2,
    };
    const cls = "mz-ed-cell" + (c.w >= 6 ? " mz-ed-cell-wide" : c.w <= 2 ? " mz-ed-cell-narrow" : "") + (c.tall ? " mz-ed-cell-tall" : "");
    const showTools = isAdmin && !!c.article;
    const isOpen = !!openTools[c.key];
    return (
      <div key={c.key} className={"mz-ed-wrap" + (isOpen ? " mz-admin-open" : "")} style={{ position: "relative", ...style }}>
        <a href={`/articles/${c.article.id}`} className={cls} style={cardLink}>
          {c.article.imageUrl ? (
            <div className="mz-ed-thumb"><img src={c.article.imageUrl} alt="" loading="lazy" /></div>
          ) : null}
          <div className="mz-ed-kicker">
            {c.article.pinned && c.article.pinKind ? <span className="mz-ed-pin">{c.article.pinKind}</span> : null}
            <span>{c.article.subcategory || c.article.magazine?.name || "News"}</span>
          </div>
          <div className="mz-ed-title">{c.article.headline || c.article.title}</div>
          {c.article.summary && <div className="mz-ed-summary">{c.article.summary}</div>}
        </a>
        {showTools && (
          <>
            <button
              className="mz-admin-a-btn"
              aria-label="Toggle admin tools"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenTools((o) => ({ ...o, [c.key]: !o[c.key] })); }}
            >A</button>
            <div className="mz-admin-tools">
              <AdminCardTools
                articleId={c.article.id}
                currentMag={c.article.magazine?.id || magazine}
                currentSubcat={c.article.subcategory}
                featured={c.article.featured === true}
                pinned={!!c.article.pinned}
                magazines={magazines}
                subcats={subcats}
                onChanged={refresh}
              />
            </div>
          </>
        )}
      </div>
    );
  }
}

const pgBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--accent, rgba(255,215,0,.4))", borderRadius: 8,
  color: "var(--accent, #ffd700)", padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700,
};

const cardLink: React.CSSProperties = {
  textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", padding: "18px 20px",
  border: "1px solid var(--border, rgba(150,150,150,.2))", borderRadius: 12, background: "var(--card-bg, rgba(255,255,255,.02))",
  transition: "transform .15s ease, border-color .15s ease", minWidth: 0, height: "100%", boxSizing: "border-box",
};

const totemCss = `
#${UID} .mz-ed-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
#${UID} .mz-ed-mark { color: var(--accent, #ffd700); font-size: 11px; }
#${UID} .mz-ed-h2 { margin: 0; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; color: inherit; }
#${UID} .mz-ed-grid { display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: 250px; gap: 16px; }
#${UID} .mz-ed-cell { grid-column: span 4; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
#${UID} .mz-ed-cell-wide { }
#${UID} .mz-ed-cell-narrow .mz-ed-title { font-size: 14px; }
#${UID} .mz-ed-cell-narrow .mz-ed-summary { display: none; }
#${UID} .mz-ed-cell-tall { justify-content: flex-start; }
#${UID} .mz-ed-thumb { position: relative; flex: 1 1 0; min-height: 0; margin: -18px -20px 10px; border-radius: 12px 12px 0 0; overflow: hidden; background: var(--card-bg, rgba(127,127,127,.08)); }
#${UID} .mz-ed-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
#${UID} .mz-ed-pin { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--accent, #ffd700); font-size: 9px; letter-spacing: 1px; }
#${UID} .mz-ed-kicker { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--accent, #ffd700); font-weight: 800; }
#${UID} .mz-ed-title { font-size: 17px; font-weight: 800; line-height: 1.28; letter-spacing: -0.01em; }
#${UID} .mz-ed-cell-wide .mz-ed-title { font-size: 22px; }
#${UID} .mz-ed-summary { margin-top: 8px; font-size: 13px; line-height: 1.5; opacity: .72; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
#${UID} .mz-ed-cell:hover { border-color: var(--accent, #ffd700); transform: translateY(-2px); }
/* "More in" — single wide, attractive thumbnail block, not repeated */
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
  /* override explicit col placement on smaller screens — target the GRID ITEM
     (.mz-ed-wrap) which carries the inline grid-column-start/end, not just the
     inner .mz-ed-cell anchor. */
  #${UID} .mz-ed-wrap, #${UID} .mz-ed-cell, #${UID} .mz-ed-cell-wide, #${UID} .mz-ed-cell-narrow, #${UID} .mz-ed-cell-tall { grid-column: span 3 !important; grid-row: auto !important; }
}
@media (max-width: 560px) {
  #${UID} .mz-ed-grid { grid-template-columns: repeat(1, 1fr); gap: 12px; grid-auto-rows: auto; }
  #${UID} .mz-ed-wrap, #${UID} .mz-ed-cell, #${UID} .mz-ed-cell-wide, #${UID} .mz-ed-cell-narrow, #${UID} .mz-ed-cell-tall { grid-column: span 1 !important; grid-row: auto !important; }
  #${UID} .mz-ed-cell-wide .mz-ed-title, #${UID} .mz-ed-cell-tall .mz-ed-title { font-size: 19px; }
}
/* Admin inline-editor: toolbar revealed on hover of the card (bottom edge) */
#${UID} .mz-admin-tools { position: absolute; left: 0; right: 0; bottom: 0; transform: translateY(0);
  background: rgba(10,12,16,.94); border-top: 1px solid rgba(150,150,150,.25); border-radius: 0 0 12px 12px;
  padding: 6px 8px; opacity: 0; pointer-events: none; transition: opacity .14s ease; z-index: 20;
  box-shadow: 0 -6px 18px rgba(0,0,0,.35); }
#${UID} .mz-ed-wrap:hover .mz-admin-tools { opacity: 1; pointer-events: auto; }
#${UID} .mz-ed-wrap.mz-admin-open .mz-admin-tools { opacity: 1 !important; pointer-events: auto !important; }
/* Touch devices (any width): tapping the card body emulates hover — do NOT reveal
   the toolbar from a tap; only the (A) toggle should open it. */
@media (hover: none) {
  #${UID} .mz-ed-wrap:hover .mz-admin-tools { opacity: 0; pointer-events: none; }
  #${UID} .mz-admin-a-btn { display: flex; }
}
/* Admin "(A)" toggle — touch/tablet only. On desktop the toolbar stays
   hover-revealed (existing behavior) and the (A) button is not shown. */
#${UID} .mz-admin-a-btn { display: none; }
@media (max-width: 760px) {
  #${UID} .mz-ed-wrap.mz-admin-open .mz-admin-tools { opacity: 1 !important; pointer-events: auto !important; }
  /* Touch devices emulate hover on tap — make sure tapping the card body does
     NOT reveal the toolbar; only the (A) toggle should open it. */
  #${UID} .mz-ed-wrap:hover .mz-admin-tools { opacity: 0; pointer-events: none; }
  /* Stack card, then the (A) toggle below it on the lower-left. */
  #${UID} .mz-ed-wrap { display: flex; flex-direction: column; }
  #${UID} .mz-ed-cell { flex: 1 1 auto; }
  /* On mobile the thumbnail must keep a real height so it shows as an image
     band, not collapse to a sliver under the text. */
  #${UID} .mz-ed-thumb { flex: 0 0 170px; min-height: 0; }
  #${UID} .mz-ed-cell-narrow .mz-ed-thumb { flex-basis: 150px; }
  #${UID} .mz-admin-a-btn { display: flex; position: relative; align-self: flex-start; margin: 10px 0 2px;
    width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid var(--accent, rgba(255,215,0,.7));
    background: rgba(10,12,16,.95); color: var(--accent,#ffd700); font-size: 15px; font-weight: 800;
    line-height: 1; cursor: pointer; align-items: center; justify-content: center; padding: 0;
    z-index: 3; -webkit-tap-highlight-color: transparent; }
  /* On mobile the admin toolbar is hidden by default and revealed by the (A) toggle as an overlay. */
  #${UID} .mz-admin-tools { position: absolute; left: 8px; right: 8px; bottom: 44px; opacity: 0; pointer-events: none;
    transform: translateY(0); background: rgba(10,12,16,.97); border: 1px solid rgba(150,150,150,.25); border-radius: 10px; z-index: 24; }
}
`;