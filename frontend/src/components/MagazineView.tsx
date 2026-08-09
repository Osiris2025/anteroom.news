"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";
import { MAGAZINES, ARTICLES, Magazine, themes } from "@/lib/themes";

/**
 * tryImage — probes an image URL; calls onOk(true) once it loads, onOk(false) on error.
 * Used to detect whether a per-magazine masthead image file exists (any format).
 */
function tryImage(src: string, onOk: (ok: boolean) => void) {
  let active = true;
  const img = new window.Image();
  img.onload = () => active && onOk(true);
  img.onerror = () => active && onOk(false);
  img.src = src;
  return () => { active = false; };
}

/** useMasthead — check candidate masthead files (svg/png/webp/jpg) in order; first hit wins. */
function useMasthead(id: string): string | null {
  const exts = ["svg", "png", "webp", "jpg", "jpeg"];
  const candidates = exts.map((e) => `/images/masthead-${id}.${e}`);
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let disposed = false;
    let stops: (() => void)[] = [];
    const tryNext = (i: number) => {
      if (disposed || i >= candidates.length) return;
      stops.push(tryImage(candidates[i], (ok) => {
        if (ok && !disposed) setSrc(candidates[i]);
        else tryNext(i + 1);
      }));
    };
    tryNext(0);
    return () => { disposed = true; stops.forEach((s) => s()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return src;
}

/**
 * MagazineView (client)
 * Renders a magazine page THROUGH the theme system: activates the magazine's
 * mapped theme and shows ALL required blocks — masthead logo, headline/stories,
 * context-driven ancillary cards, and the full set of maintenance blocks
 * (Subscribe/Support/Profile/Company/Legal/Transparency/cookie/theme-selector)
 * as proper cards and sidebars on every page.
 */
export default function MagazineView({ id }: { id: string }) {
  const { currentTheme, setTheme } = useTheme();
  const mag: Magazine | undefined = MAGAZINES.find((m) => m.id === id);

  // NOTE: this page does NOT auto-switch the theme. The ThemeProvider derives the
  // magazine default from the URL path only when the user hasn't chosen one — the
  // user's own selection is always respected and never overwritten. setTheme below
  // is only exposed to the user-facing theme <select> in the footer.

  if (!mag) {
    return (
      <div className="text-center py-24" style={{ color: "var(--text-primary)" }}>
        <h1 className="text-5xl font-black mb-4">404</h1>
        <Link href="/" className="inline-block mt-6 px-6 py-3 rounded font-black text-white" style={{ background: "var(--accent)" }}>Back home</Link>
      </div>
    );
  }

  const nameToId: Record<string, string> = {};
  MAGAZINES.forEach((m) => { nameToId[m.name] = m.id; nameToId[m.short] = m.id; });

  // Live DB articles (approved→live via the intake pipeline) merge on top of static stories.
  type LiveArticle = { id: string; title: string; summary: string | null; sourceUrl: string | null; subcategory: string | null; publishedAt: string | null };
  const [live, setLive] = useState<LiveArticle[]>([]);
  useEffect(() => {
    fetch(`/api/articles?magazine=${id}`)
      .then((r) => r.json())
      .then((j) => { if (!j.error && Array.isArray(j.articles)) setLive(j.articles); })
      .catch(() => {});
  }, [id]);

  const staticStories = ARTICLES.filter((a) => nameToId[a.mag] === id);
  const accent = currentTheme.id === "tabloid" ? "#c1121f" : mag.accent;
  const stories = [
    ...live.map((a) => ({
      k: a.subcategory || mag.short?.toUpperCase() || "NEW",
      title: a.title,
      desc: a.summary || "",
      src: a.sourceUrl || undefined,
      color: accent,
      live: true,
    })),
    ...staticStories,
  ];
  const related = MAGAZINES.filter((m) => m.id !== id).slice(0, 4);

  // Per-magazine masthead image (any format), if one exists; otherwise fall back to the text headliner.
  const mastheadSrc = useMasthead(mag.id);

  return (
    <div className="magazine-view">
      {/* Masthead */}
      <header className="mag-mast">
        <Link href="/" className="mag-back">&larr; All magazines</Link>
        {mastheadSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mastheadSrc} alt={mag.name + " masthead"} className="mag-logo" />
        )}
        <div className="mag-headline">
          <div className="mag-kicker">{mag.short}</div>
          <h1>{mag.name}</h1>
          <p className="mag-tagline">{mag.tagline}</p>
          <p className="mag-desc">{mag.description}</p>
        </div>
      </header>

      <div className="mag-grid">
        {/* Main stories */}
        <section className="mag-main">
          <div className="mag-sec-title">Top Stories</div>
          {stories.length > 0 ? (
            <div className="mag-stories">
              {stories.map((a, i) => {
                const href = a.live ? (a.sourceUrl || ("/magazines/" + id)) : (a.k === "CATBOY" ? "/streams/weekly-weird-news/catboy-episode-1" : "/magazines/" + id);
                const isExt = a.live && a.sourceUrl;
                return isExt ? (
                  <a href={href} target="_blank" rel="noreferrer" key={i} className="mag-story" data-href={href}>
                    <span className="mag-story-kicker" style={{ color: a.color || accent }}>{a.k}</span>
                    <h3>{a.title}</h3>
                    <p>{a.desc}</p>
                  </a>
                ) : (
                  <Link href={href} key={i} className="mag-story" data-href={href}>
                    <span className="mag-story-kicker" style={{ color: a.color || accent }}>{a.k}</span>
                    <h3>{a.title}</h3>
                    <p>{a.desc}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mag-empty">🧪 <strong>Stories coming soon…</strong><span>The AI pipeline is populating {mag.name}.</span></div>
          )}

          {/* Subscribe + Support cards (maintenance, below stories) */}
          <div className="mag-maint-cards">
            <div className="mag-panel">
              <h4>Subscribe</h4>
              <input className="mag-input" placeholder="email" />
              <Link href="/subscribe" className="mag-btn" data-href="/subscribe">Subscribe</Link>
            </div>
            <div className="mag-panel">
              <h4>Support</h4>
              <Link href="/support" className="mag-btn" data-href="/support">Become a Supporter</Link>
            </div>
          </div>
        </section>

        {/* Sidebar: related + context-driven ancillary */}
        <aside className="mag-side">
          <div className="mag-panel">
            <h4>Related Magazines</h4>
            <nav>
              {related.map((r) => (
                <Link key={r.id} href={"/magazines/" + r.id} data-href={"/magazines/" + r.id}><span style={{ background: r.accent }} />{r.name}</Link>
              ))}
            </nav>
          </div>
          {(mag.tags.includes("puzzle") || mag.tags.includes("game")) && (
            <div className="mag-panel mag-puzzle">
              <div className="mag-emoji">🧩</div>
              <h4>Quick Puzzle</h4>
              <p>A {mag.short} brain-teaser.</p>
              <span>Play →</span>
            </div>
          )}
          {(mag.tags.includes("ticker") || mag.tags.includes("alert")) && (
            <div className="mag-panel">
              <h4><span className="mag-dot" style={{ background: mag.accent }} /> Breaking</h4>
              <p>Live updates from {mag.name}, refreshed by the AI pipeline.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Full maintenance footer — every block, as proper columns */}
      <footer className="mag-footer">
        <div className="mag-footer-col">
          <h4>Profile</h4>
          <Link href="/profile" data-href="/profile">Sign In</Link>
          <Link href="/profile" data-href="/profile">Your Settings</Link>
          <Link href="/profile" data-href="/profile">Notifications</Link>
        </div>
        <div className="mag-footer-col">
          <h4>Company</h4>
          <Link href="/about" data-href="/about">About</Link>
          <Link href="/about" data-href="/about">Contact</Link>
          <Link href="/about" data-href="/about">Careers</Link>
        </div>
        <div className="mag-footer-col">
          <h4>Legal</h4>
          <Link href="/legal" data-href="/legal">Terms</Link>
          <Link href="/legal" data-href="/legal">Privacy</Link>
          <Link href="/legal" data-href="/legal">DMCA</Link>
          <Link href="/legal" data-href="/legal">Cookie Policy</Link>
        </div>
        <div className="mag-footer-col">
          <h4>Theme</h4>
          <select className="themesel" data-theme-select value={currentTheme.id}
            onChange={(e) => setTheme(e.target.value)} aria-label="Select theme">
            {themes.map((t) => <option key={t.id} value={t.id}>{t.name.replace(/ \u2014 .*/, "")}</option>)}
          </select>
        </div>
        <div className="mag-footer-col">
          <h4>Transparency</h4>
          <p>All summaries generated by AI. Sources linked. Human editors audit every story.</p>
        </div>
      </footer>

      {/* cookie consent */}
      <div className="mag-cookie">We use cookies to personalize your news. <a href="/legal#cookie-policy" data-href="/legal" onClick={(e)=>{e.preventDefault(); (e.target as HTMLElement).closest(".mag-cookie")?.remove();}}>Accept</a></div>
    </div>
  );
}
