// Concrete colours per theme, shared by the article reader and the top bar.
// palette(themeId) — concrete colors per theme so the reader re-skins cleanly for
// EVERY theme (dark + light). Never returns null (avoids TS style-prop rejects).
export function palette(themeId: string) {
  const dark: Record<string, { box: string; border: string; ink: string; body: string; accent: string; img: string }> = {
    linear:    { box: "#0f1011", border: "#26282c", ink: "#f7f8f8", body: "#c9cdd4", accent: "#7170ff", img: "linear-gradient(135deg,#1a1a2e,#0f1011)" },
    terminal:  { box: "#001100", border: "#00ff40", ink: "#00ff00", body: "#00cc00", accent: "#00ff00", img: "linear-gradient(135deg,#002200,#000)" },
    crt:       { box: "#001100", border: "#00ff40", ink: "#00ff00", body: "#00cc00", accent: "#00ff00", img: "linear-gradient(135deg,#002200,#000)" },
    glass:     { box: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)", ink: "#fff", body: "#d6d3f0", accent: "#a5b4fc", img: "linear-gradient(135deg,#302b63,#0f0c29)" },
    dashboard: { box: "#111826", border: "#1f2a3d", ink: "#e8edf5", body: "#aab6c8", accent: "#38bdf8", img: "linear-gradient(135deg,#0a0e17,#1a2438)" },
    crawler:   { box: "#1c1c1c", border: "#333", ink: "#eee", body: "#c9c9c9", accent: "#f87171", img: "linear-gradient(135deg,#2a0000,#111)" },
    ticker:    { box: "#111826", border: "#1f2a3d", ink: "#e8edf5", body: "#aab6c8", accent: "#fbbf24", img: "linear-gradient(135deg,#1a1a3e,#16213e)" },
    board:     { box: "#3a2417", border: "#5c3a22", ink: "#d4a574", body: "#c69a6d", accent: "#e8b890", img: "linear-gradient(135deg,#2c1810,#4a2f1a)" },
    audio:     { box: "#161b22", border: "#2d333b", ink: "#c9d1d9", body: "#a5b0bd", accent: "#58a6ff", img: "linear-gradient(135deg,#0d1117,#1f2937)" },
    social:    { box: "#16181c", border: "#2f3336", ink: "#e7e9ea", body: "#c2c5c9", accent: "#1d9bf0", img: "linear-gradient(135deg,#000,#101418)" },
    map:       { box: "#101627", border: "#1e2a3e", ink: "#c8d6e5", body: "#9fb0c4", accent: "#00d4aa", img: "linear-gradient(135deg,#0a0e17,#16213e)" },
    deco:      { box: "#241f38", border: "#4a3f63", ink: "#e8d5b7", body: "#d4c3a8", accent: "#e6b96a", img: "linear-gradient(135deg,#1a1a2e,#3a2f52)" },
  };
  if (dark[themeId]) return dark[themeId];

  const light: Record<string, { box: string; border: string; ink: string; body: string; accent: string; img: string }> = {
    tabloid:   { box: "#fbf5e9", border: "#d0c4a8", ink: "#1a1a1a", body: "#4a4038", accent: "#c1121f", img: "linear-gradient(135deg,#ffe14d,#f6efe0)" },
    vercel:    { box: "#ffffff", border: "#e0e0e0", ink: "#171717", body: "#666", accent: "#0072f5", img: "linear-gradient(135deg,#f0f0f0,#fff)" },
    magazine:  { box: "#f8f9fa", border: "#e6e6e6", ink: "#1a1a1a", body: "#666", accent: "#667eea", img: "linear-gradient(135deg,#e9edfd,#fff)" },
    blog:      { box: "#ffffff", border: "#eee", ink: "#333", body: "#777", accent: "#333", img: "linear-gradient(135deg,#f5f5f5,#fff)" },
    spread:    { box: "#f0ece4", border: "#d8ccb8", ink: "#1a1a1a", body: "#5a5242", accent: "#8a1d24", img: "linear-gradient(135deg,#f0ece4,#faf8f5)" },
    water:     { box: "rgba(255,255,255,0.7)", border: "#e6dcc8", ink: "#2d2d2d", body: "#6a5a4a", accent: "#60a5fa", img: "linear-gradient(135deg,#fef9ef,#e8f0fe)" },
    cardwall:  { box: "#ffffff", border: "#e5e7eb", ink: "#1a1a2e", body: "#5a5a6a", accent: "#667eea", img: "linear-gradient(135deg,#eef1fb,#fff)" },
    split:     { box: "#ffffff", border: "#e0e0e0", ink: "#1a1a1a", body: "#555", accent: "#fbbf24", img: "linear-gradient(135deg,#fcf8ec,#fff)" },
  };
  return light[themeId] || { box: "#f5f5f7", border: "#dedfe3", ink: "#1a1a1a", body: "#444", accent: "#666", img: "linear-gradient(135deg,#eee,#fff)" };
}

export const DARK_THEMES = ["linear","terminal","crt","glass","dashboard","crawler","ticker","board","audio","social","map","deco"];
export function isDarkTheme(themeId: string) { return DARK_THEMES.includes(themeId); }
