import StreamCard from "@/components/StreamCard";

const streams = [
  {
    id: "weekly-weird-news",
    name: "Weekly Weird News",
    tagline: "The World's Only Reliable News™",
    description: "Satirical tabloid covering cryptids, UFOs, and the unexplainable.",
    color: "#8B4513",
    accent: "#FFD700",
  },
  {
    id: "tech-pulse",
    name: "Tech Pulse",
    tagline: "Technology. Analyzed.",
    description: "AI, dev tools, hardware, and the future of tech.",
    color: "#1e3a5f",
    accent: "#58a6ff",
  },
  {
    id: "poli-split",
    name: "Poli Split",
    tagline: "Both Sides, One Feed",
    description: "Red. Blue. Facts. Balanced political coverage.",
    color: "#7c3aed",
    accent: "#a78bfa",
  },
  {
    id: "climate-watch",
    name: "Climate Watch",
    tagline: "The Planet's Pulse",
    description: "Climate science, energy transition, environmental policy.",
    color: "#059669",
    accent: "#34d399",
  },
  {
    id: "startup-signal",
    name: "Startup Signal",
    tagline: "Deals, Pivots, Trends",
    description: "VC funding, pivots, and the next big thing.",
    color: "#d97706",
    accent: "#fbbf24",
  },
  {
    id: "oss-report",
    name: "Open Source Report",
    tagline: "Community. Code. Drama.",
    description: "New releases, licensing battles, and dev community pulse.",
    color: "#dc2626",
    accent: "#f87171",
  },
];

export default function Home() {
  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">AI News Nexus</h1>
        <p className="text-xl" style={{ color: "var(--text-secondary)" }}>
          Multiple streams. AI-powered commentary. One community.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streams.map((s) => (
          <StreamCard key={s.id} stream={s} />
        ))}
      </div>
    </div>
  );
}
