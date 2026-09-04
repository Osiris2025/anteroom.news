"use client";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

/** Data-driven static content shell for About / Support / Legal. */
const pages: Record<string, { title: string; intro: string; sections: { h: string; p: string; id: string }[] }> = {
  about: {
    title: "About Anteroom",
    intro: "What we're building and why.",
    sections: [
      { id: "our-mission", h: "Our Mission", p: "Anteroom is a multi-magazine news platform where AI does the heavy lifting and human editors keep it honest. Seven magazines, one community." },
      { id: "contact", h: "Contact", p: "Reach the team at hello@osiris2025.com. We reply to every note." },
      { id: "careers", h: "Careers", p: "We're always looking for editors, engineers, and cryptid skeptics. Write to careers@osiris2025.com." },
    ],
  },
  support: {
    title: "Support Anteroom",
    intro: "Help keep independent, AI-verified news sustainable.",
    sections: [
      { id: "become-a-member", h: "Become a Member", p: "Members get ad-free reading, full-length summaries, and early access to new features." },
      { id: "gift-a-subscription", h: "Gift a Subscription", p: "Share the weird with a friend — gift a monthly or annual membership." },
      { id: "advertise", h: "Advertise", p: "Reach our curious, tech-forward audience. Contact advertising@osiris2025.com." },
    ],
  },
  legal: {
    title: "Legal",
    intro: "Terms, privacy, DMCA, and cookies.",
    sections: [
      { id: "terms", h: "Terms", p: "By using Anteroom you agree to these terms. Summaries are AI-generated and linked to sources." },
      { id: "privacy", h: "Privacy", p: "We store only what's needed to personalize your experience. No PCI data is ever collected." },
      { id: "dmca", h: "DMCA", p: "To report copyright concerns, email dmca@osiris2025.com." },
      { id: "cookie-policy", h: "Cookie Policy", p: "We use cookies to personalize your news experience." },
    ],
  },
};

/** Resolve readable colors for the active theme (dark/light aware). */
function contentColors(themeId: string | undefined) {
  // Dark-background themes: use dark surfaces + light text.
  const dark = ["linear", "terminal", "crt", "glass", "dashboard", "crawler", "ticker", "board", "audio", "social", "map", "deco"];
  if (themeId && dark.includes(themeId)) {
    const palettes: Record<string, { box: string; border: string; ink: string; body: string; accent: string }> = {
      linear:  { box: "#0f1011", border: "#26282c", ink: "#f7f8f8", body: "#c9cdd4", accent: "#7170ff" },
      terminal:{ box: "#001100", border: "#00ff40", ink: "#00ff00", body: "#00cc00", accent: "#00ff00" },
      crt:     { box: "#001100", border: "#00ff40", ink: "#00ff00", body: "#00cc00", accent: "#00ff00" },
      glass:   { box: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)", ink: "#fff", body: "#d6d3f0", accent: "#a5b4fc" },
      dashboard:{ box: "#111826", border: "#1f2a3d", ink: "#e8edf5", body: "#aab6c8", accent: "#38bdf8" },
      crawler: { box: "#1c1c1c", border: "#333", ink: "#eee", body: "#c9c9c9", accent: "#f87171" },
      ticker:  { box: "#111826", border: "#1f2a3d", ink: "#e8edf5", body: "#aab6c8", accent: "#fbbf24" },
      board:   { box: "#3a2417", border: "#5c3a22", ink: "#d4a574", body: "#c69a6d", accent: "#e8b890" },
      audio:   { box: "#161b22", border: "#2d333b", ink: "#c9d1d9", body: "#a5b0bd", accent: "#58a6ff" },
      social:  { box: "#16181c", border: "#2f3336", ink: "#e7e9ea", body: "#c2c5c9", accent: "#1d9bf0" },
      map:     { box: "#101627", border: "#1e2a3e", ink: "#c8d6e5", body: "#9fb0c4", accent: "#00d4aa" },
      deco:    { box: "#241f38", border: "#4a3f63", ink: "#e8d5b7", body: "#d4c3a8", accent: "#e6b96a" },
    };
    return palettes[themeId] || { box: "#16181c", border: "#2f3336", ink: "#e7e9ea", body: "#c2c5c9", accent: "#58a6ff" };
  }
  // Light themes
  const light: Record<string, { box: string; border: string; ink: string; body: string; accent: string }> = {
    tabloid: { box: "#fbf5e9", border: "#d8cfbb", ink: "#1a1a1a", body: "#4a4038", accent: "#8B4513" },
  };
  return light[themeId || ""] || { box: "#f5f5f7", border: "#dedfe3", ink: "#1a1a1a", body: "#444", accent: "#666" };
}

export function ContentPage({ id }: { id: string }) {
  const { currentTheme } = useTheme();
  const C = contentColors(currentTheme && currentTheme.id);
  const page = pages[id];

  if (!page) {
    return (
      <div className="text-center py-20" style={{ color: C.body }}>
        <h1 className="text-4xl font-bold mb-4" style={{ color: C.ink }}>404</h1>
        <p>Page not found</p>
        <Link href="/" className="inline-block mt-6 px-6 py-2 rounded-lg text-white" style={{ background: C.accent }}>Back home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="text-sm mb-6 inline-block" style={{ color: C.accent }}>&larr; Home</Link>
      <h1 className="text-4xl font-black mb-2" style={{ color: C.ink }}>{page.title}</h1>
      <p className="mb-8" style={{ color: C.body }}>{page.intro}</p>
      <div className="space-y-4">
        {page.sections.map((s) => (
          <section key={s.id} id={s.id} className="rounded-xl p-5 border" style={{ background: C.box, borderColor: C.border }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: C.ink }}>{s.h}</h2>
            <p style={{ color: C.body }}>{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}