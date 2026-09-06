"use client";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

/**
 * CATBOY Episode 2 — the Bicycle Rainstorm Sighting (2026-09-06).
 * Same per-theme palette approach as episode 1. Exhibit A: catboy-rainy-street.jpg
 */

function articlePalette(themeId: string | undefined) {
  switch (themeId) {
    case "tabloid":
      return { bg: "#f6efe0", ink: "#1a1a1a", body: "#3d3527", box: "#f6efe0", boxBorder: "#d8cfbb", accent: "#8B4513", hot: "#c1121f", kbar: "#ffe14d" };
    case "linear":
      return { bg: "#08090a", ink: "#f7f8f8", body: "#c9cdd4", box: "#0f1011", boxBorder: "#26282c", accent: "#7170ff", hot: "#7170ff", kbar: "#7170ff" };
    case "vercel":
      return { bg: "#ffffff", ink: "#111111", body: "#444444", box: "#f6f7f8", boxBorder: "#e5e6e8", accent: "#0072f5", hot: "#0072f5", kbar: "#0072f5" };
    case "terminal":
      return { bg: "#000000", ink: "#00ff00", body: "#00cc00", box: "#001100", boxBorder: "#00ff40", accent: "#00ff00", hot: "#00ff00", kbar: "#003300" };
    case "crt":
      return { bg: "#000000", ink: "#00ff00", body: "#00cc00", box: "#001100", boxBorder: "#00ff40", accent: "#00ff00", hot: "#00ff00", kbar: "#003300" };
    case "glass":
      return { bg: "#0f0c29", ink: "#ffffff", body: "#d6d3f0", box: "rgba(255,255,255,0.08)", boxBorder: "rgba(255,255,255,0.18)", accent: "#a5b4fc", hot: "#818cf8", kbar: "#818cf8" };
    case "magazine":
      return { bg: "#ffffff", ink: "#1a1a1a", body: "#444444", box: "#f5f5f7", boxBorder: "#e5e5e7", accent: "#667eea", hot: "#764ba2", kbar: "#667eea" };
    case "dashboard":
      return { bg: "#0a0e17", ink: "#e8edf5", body: "#aab6c8", box: "#111826", boxBorder: "#1f2a3d", accent: "#38bdf8", hot: "#38bdf8", kbar: "#0ea5c4" };
    case "crawler":
      return { bg: "#111111", ink: "#eeeeee", body: "#c9c9c9", box: "#1c1c1c", boxBorder: "#333333", accent: "#f87171", hot: "#ef4444", kbar: "#7f1d1d" };
    case "deco":
      return { bg: "#1a1a2e", ink: "#e8d5b7", body: "#d4c3a8", box: "#241f38", boxBorder: "#4a3f63", accent: "#e6b96a", hot: "#c9a24b", kbar: "#e6b96a" };
    case "ticker":
      return { bg: "#0a0e17", ink: "#e8edf5", body: "#aab6c8", box: "#111826", boxBorder: "#1f2a3d", accent: "#fbbf24", hot: "#f59e0b", kbar: "#78350f" };
    case "board":
      return { bg: "#2c1810", ink: "#d4a574", body: "#b89868", box: "#1f120b", boxBorder: "#4a3520", accent: "#e08c3a", hot: "#ff6b35", kbar: "#ff9c5b" };
    default:
      return { bg: "#08090a", ink: "#f7f8f8", body: "#c9cdd4", box: "#0f1011", boxBorder: "#26282c", accent: "#7170ff", hot: "#7170ff", kbar: "#7170ff" };
  }
}

export default function CatboyEpisode2Page() {
  const { currentTheme } = useTheme();
  const P = articlePalette(currentTheme && currentTheme.id);

  return (
    <article className="max-w-3xl mx-auto article-frame"
      style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <Link href="/magazines/weekly-weird-news" className="text-sm inline-block" style={{ color: P.accent }}>&larr; Weekly Weird News</Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/ww-headliner.svg" alt="Weekly Weird News masthead" className="w-56 h-auto" />
      </div>

      <div className="pb-4 mb-6" style={{ borderBottom: "5px solid " + P.hot }}>
        <div className="text-xs uppercase tracking-widest mb-3 px-3 py-1 inline-block font-black" style={{ background: P.kbar, color: "#1a1a1a", fontFamily: "'Arial Black',Arial,sans-serif" }}>EXCLUSIVE &#8212; Episode 2 of 12</div>
        <h1 className="text-3xl md:text-5xl font-black leading-[0.95] uppercase" style={{ color: P.ink, fontFamily: "'Arial Black','Arial Narrow',Arial,sans-serif", letterSpacing: "-0.5px" }}>
          CATBOY OUTRACES RAINDROPS IN BIZARRE BICYCLE SPECTACLE
        </h1>
        <div className="flex gap-4 mt-3 text-sm" style={{ color: P.body }}><span>September 6, 2026</span><span>By Max the Cryptid Reporter</span></div>
      </div>

      {/* Reward frame */}
      <div className="mb-6 rounded px-4 py-3 flex items-center gap-3"
        style={{ background: "#1a1a1a", border: "2px solid " + P.kbar, color: "#ffe14d", fontFamily: "'Arial Black',Arial,sans-serif" }}>
        <span style={{ fontSize: 20 }}>&#11088;</span>
        <div>
          <div className="text-sm uppercase tracking-widest font-black" style={{ color: P.kbar === "#003300" ? "#00ff00" : "#ffe14d" }}>Reward Doubled: $50,000</div>
          <div className="text-xs font-normal" style={{ color: "#e8d47a", fontFamily: "Georgia, serif" }}>For verifiable footage of CATBOY pedaling. The rainstorm tape shows his tail acting as a stabilizer — analysis pending.</div>
        </div>
      </div>

      {/* Exhibit A — the rain ride */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: P.kbar }} />
          <h3 className="text-xs uppercase tracking-widest font-black" style={{ color: P.accent }}>Exhibit A &#8212; The Deluge Ride</h3>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/catboy/catboy-rainy-street.jpg"
          alt="The half-cat, half-boy figure riding a bicycle down a rain-soaked street at night — entire scene drenched except the rider"
          style={{ width: "100%", borderRadius: 8, border: "1px solid " + P.boxBorder }} />
        <p className="text-xs text-center mt-2" style={{ color: P.body }}>
          Tuesday, 3:47 PM. Note the visible cone of dryness and the tail streaming like a pennant. Everything in frame is soaked &#8212; except him.
        </p>
      </div>

      <div className="p-4 mb-8 border-l-4 text-sm leading-relaxed" style={{ backgroundColor: P.box, borderLeftColor: P.hot, boxShadow: "inset 0 0 0 1px " + P.boxBorder }}>
        <strong className="uppercase text-xs tracking-widest" style={{ color: P.accent }}>The Story:</strong>
        <p className="mt-1" style={{ color: P.body }}>
          While the National Weather Service issued flash flood warnings and sensible citizens hunkered down, one enigmatic figure chose to make a spectacle of the storm. At approximately 3:47 PM on Tuesday, the legendary Catboy was observed riding a vintage Schwinn through the heart of Tuscaloosa&rsquo;s worst deluge in a decade, pedaling with such ferocity that rain appeared to curve around him in a visible aerodynamic cone of dryness.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: P.accent }}>Key Evidence</h2>
        <ul className="space-y-2">
          {[
            "Estimated 40 mph uphill, against the wind — on a vintage Schwinn (eyewitness Grady Whitfield, retired pharmacist and noted skeptic).",
            "Fur completely dry in a flash-flood warning zone. Rain visibly curved around the rider in a cone.",
            "Tail used as a stabilizer through turns — Dr. Meowton suspects a hydrokinetic device of interdimensional origin.",
            "Rang a small brass bell at the eyewitness before vanishing toward the old water tower.",
            "A trail of evaporating puddles followed his route for six blocks (Meowton field survey).",
          ].map((p, i) => (
            <li key={i} className="flex gap-2 text-sm" style={{ color: P.body }}>
              <span style={{ color: P.hot }}>&#x1F43E;</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: P.accent }}>The Weird-o-Meter</h2>
        <p className="text-sm leading-relaxed" style={{ color: P.body }}>
          &ldquo;On a standard wetness scale, I&rsquo;d give this a <b>9.7</b> on the Weird-o-Meter,&rdquo; said Dr. Patricia Meowton during an impromptu press conference held under a beach umbrella. &ldquo;The combination of impossible pedaling cadence, rain-repelling fur, and the sheer audacity to ride a bicycle with a tail that long? It defies aerodynamic convention. It&rsquo;s as if he was toweling the street as he rode. This is not a cat. This is a phenomenon with a heartbeat and questionable taste in bicycle accessories.&rdquo;
        </p>
      </div>

      <div className="p-4 mb-8 border" style={{ backgroundColor: P.box, borderColor: P.hot, boxShadow: "inset 0 0 0 1px " + P.boxBorder }}>
        <h3 className="font-bold text-sm uppercase mb-2" style={{ color: P.accent }}>&#x1F9E0; Why This Matters</h3>
        <p className="text-sm leading-relaxed" style={{ color: P.body }}>
          The Tuscaloosa Department of Transportation issued a terse statement about &ldquo;working with federal partners,&rdquo; and a new ordinance quietly requires all city bicycles to carry &ldquo;weather-shielding devices.&rdquo; Independent analysts note the phrase &ldquo;federal partners&rdquo; is doing a lot of heavy lifting. If Catboy is commuting by bicycle now, the question is no longer whether he exists &mdash; it&rsquo;s where he&rsquo;s going, and why the city is suddenly so interested in bicycle safety.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: P.accent }}>&#x1F4AC; Join the Discussion</h2>
        <div className="space-y-2">
          {[
            "Tiny bicycle clips: practical solution or calculated taunt?",
            "Is the brass bell a signature, a warning, or an invitation?",
            "The water tower: portal, hideout, or just a fixer-upper?",
            "Should the city's 'weather-shielding' ordinance be treated as a confession?",
          ].map((p, i) => (
            <div key={i} className="p-3 rounded text-sm cursor-pointer hover:opacity-80" style={{ backgroundColor: P.box, boxShadow: "inset 0 0 0 1px " + P.boxBorder, color: P.body }}>{p}</div>
          ))}
        </div>
      </div>

      <div className="text-center py-6 border-t" style={{ borderColor: P.boxBorder }}>
        <p className="text-xs" style={{ color: P.body }}>
          Episode 2 of 12 &#8212; Weekly Weird News. <Link href="/streams/weekly-weird-news/catboy-episode-1" style={{ color: P.accent }}>Revisit Episode 1: The 7-Eleven Return</Link>.
        </p>
      </div>
    </article>
  );
}
