"use client";
import Link from "next/link";
import VhsCctv from "@/components/VhsCctv";
import { useTheme } from "@/lib/ThemeContext";
import { Theme } from "@/lib/themes";

/**
 * Per-theme article palette. Drives the article fully from the active theme so
 * switching themes re-skins the WHOLE article (not just the page background).
 * Each entry maps a theme id to readable surface/ink/accent/box colors.
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
      return { bg: "#2c1810", ink: "#d4a574", body: "#c69a6d", box: "#3a2417", boxBorder: "#5c3a22", accent: "#e8b890", hot: "#d59a64", kbar: "#7a4a28" };
    case "audio":
      return { bg: "#0d1117", ink: "#c9d1d9", body: "#a5b0bd", box: "#161b22", boxBorder: "#2d333b", accent: "#58a6ff", hot: "#388bfd", kbar: "#1f3a5f" };
    case "social":
      return { bg: "#000000", ink: "#e7e9ea", body: "#c2c5c9", box: "#16181c", boxBorder: "#2f3336", accent: "#1d9bf0", hot: "#1d9bf0", kbar: "#0c4a6e" };
    case "map":
      return { bg: "#0a0e17", ink: "#c8d6e5", body: "#9fb0c4", box: "#101627", boxBorder: "#1e2a3e", accent: "#00d4aa", hot: "#00b894", kbar: "#065f52" };
    case "water":
      return { bg: "#fef9ef", ink: "#2d2d2d", body: "#555555", box: "#fffdf7", boxBorder: "#e5dccc", accent: "#4a90a4", hot: "#3b7d8c", kbar: "#c9d9d9" };
    case "cardwall":
      return { bg: "#f0f2f5", ink: "#1a1a2e", body: "#555566", box: "#ffffff", boxBorder: "#e2e4ea", accent: "#667eea", hot: "#5a6cf0", kbar: "#c7d0f5" };
    case "spread":
      return { bg: "#faf8f5", ink: "#1a1a1a", body: "#444444", box: "#ffffff", boxBorder: "#e5e0da", accent: "#c1121f", hot: "#c1121f", kbar: "#e5d9cc" };
    case "blog":
      return { bg: "#fafafa", ink: "#333333", body: "#555555", box: "#ffffff", boxBorder: "#e5e5e5", accent: "#111111", hot: "#333333", kbar: "#d8d8d8" };
    default: // generic neutral (light) fallback — never null
      return { bg: "#ffffff", ink: "#1a1a1a", body: "#444444", box: "#f5f5f7", boxBorder: "#dedfe3", accent: "#666666", hot: "#c1121f", kbar: "#e5e2da" };
  }
}

export default function CatboyPage() {
  const s = story;
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
        <div className="text-xs uppercase tracking-widest mb-3 px-3 py-1 inline-block font-black" style={{ background: P.kbar, color: "#1a1a1a", fontFamily: "'Arial Black',Arial,sans-serif" }}>EXCLUSIVE &#8212; Episode 1 of 12</div>
        <h1 className="text-3xl md:text-5xl font-black leading-[0.95] uppercase" style={{ color: P.ink, fontFamily: "'Arial Black','Arial Narrow',Arial,sans-serif", letterSpacing: "-0.5px" }}>{s.title}</h1>
        <div className="flex gap-4 mt-3 text-sm" style={{ color: P.body }}><span>{s.date}</span><span>By {s.author}</span></div>
      </div>

      {/* Reward frame */}
      <div className="mb-6 rounded px-4 py-3 flex items-center gap-3"
        style={{ background: "#1a1a1a", border: "2px solid " + P.kbar, color: "#ffe14d", fontFamily: "'Arial Black',Arial,sans-serif" }}>
        <span style={{ fontSize: 20 }}>&#11088;</span>
        <div>
          <div className="text-sm uppercase tracking-widest font-black" style={{ color: P.kbar === "#003300" ? "#00ff00" : "#ffe14d" }}>$25,000 Reward</div>
          <div className="text-xs font-normal" style={{ color: "#e8d47a", fontFamily: "Georgia, serif" }}>For verifiable, high-resolution footage of CATBOY. This tape is the only copy known to exist.</div>
        </div>
      </div>

      <VhsCctv src="/images/catboy-sighting.jpg" alt="Grainy security camera footage of a half-cat, half-boy figure at a 7-Eleven at 2:47 AM — primary evidence" />
      <p className="text-xs text-center mb-8" style={{ color: P.body }}>Exhibit A — Dr. Meowton rates it &quot;the clearest evidence yet.&quot; Drag the signal slider to tune the tape.</p>

      {/* Secondary exhibit */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: P.kbar }} />
          <h3 className="text-xs uppercase tracking-widest font-black" style={{ color: P.accent }}>Exhibit B &#8212; The Original Still</h3>
        </div>
        <VhsCctv src="/images/catboy-original.jpg" alt="Close-up still of the half-cat, half-boy figure at the 7-Eleven — secondary evidence" />
        <p className="text-xs text-center mt-2" style={{ color: P.body }}>Recorded on the same tape, moments earlier. Authenticity pending independent review.</p>
      </div>

      <div className="p-4 mb-8 border-l-4 text-sm leading-relaxed" style={{ backgroundColor: P.box, borderLeftColor: P.hot, boxShadow: "inset 0 0 0 1px " + P.boxBorder }}>
        <strong className="uppercase text-xs tracking-widest" style={{ color: P.accent }}>The Story:</strong>
        <p className="mt-1" style={{ color: P.body }}>{s.tldr}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: P.accent }}>Key Evidence</h2>
        <ul className="space-y-2">{s.key_points.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm" style={{ color: P.body }}>
            <span style={{ color: P.hot }}>&#x1F43E;</span>
            <span>{p}</span>
          </li>
        ))}</ul>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: P.accent }}>Exclusive Commentary</h2>
        {s.commentary.map((p, i) => (
          <p key={i} className="text-sm mb-2 leading-relaxed" style={{ color: P.body }}>{p}</p>
        ))}
      </div>

      <div className="p-4 mb-8 border" style={{ backgroundColor: P.box, borderColor: P.hot, boxShadow: "inset 0 0 0 1px " + P.boxBorder }}>
        <h3 className="font-bold text-sm uppercase mb-2" style={{ color: P.accent }}>&#x1F9E0; Why This Matters</h3>
        <p className="text-sm leading-relaxed" style={{ color: P.body }}>{s.why_this_matters}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 uppercase" style={{ color: P.accent }}>&#x1F4AC; Join the Discussion</h2>
        <div className="space-y-2">{s.discussion_prompts.map((p, i) => (
          <div key={i} className="p-3 rounded text-sm cursor-pointer hover:opacity-80" style={{ backgroundColor: P.box, boxShadow: "inset 0 0 0 1px " + P.boxBorder, color: P.body }}>{p}</div>
        ))}</div>
      </div>

      <div className="text-center py-6 border-t" style={{ borderColor: P.boxBorder }}>
        <p className="text-sm" style={{ color: P.body }}>Episode 2 of 12 coming soon... &#x1F431;</p>
      </div>
    </article>
  );
}

const story = {
  episode: 1,
  title: "THE RETURN OF CATBOY: Grainy Photo Confirms Half-Cat, Half-Boy Cryptid Spotted at 7-Eleven in Tuscaloosa",
  date: "August 8, 2026",
  author: "Weekly Weird News Staff",
  tldr: "A grainy security camera image from a Tuscaloosa 7-Eleven has captured what experts call the clearest evidence yet that CATBOY has returned.",
  key_points: [
    "Security footage at 2:47 AM shows a bipedal cat-like figure purchasing snacks",
    "Three witnesses described the creature as definitely part cat, definitely part boy",
    "Cryptozoologist Dr. Meowton rates the sighting 9.5/10 on the Weird-o-Meter",
    "The creature was last seen heading toward the interstate clutching its Slurpee",
  ],
  commentary: [
    "In an exclusive interview, Dr. Meowton stated: This is not a man in a costume. A man in a costume would not purchase a Slurpee.",
    "Skeptics claim the image is a viral marketing stunt. But they said the same about Batboy in 1992.",
    "CATBOY is back, and he appears to be in the mood for a snack.",
  ],
  why_this_matters: "If CATBOY is real, everything we thought about cryptid migration patterns is wrong. His return suggests a breeding population in the southeastern US.",
  discussion_prompts: [
    "Have YOU seen CATBOY? Share your sighting!",
    "Cryptid or marketing stunt? What is your theory?",
    "What is the weirdest thing you have ever bought at a 7-Eleven?",
  ],
};
