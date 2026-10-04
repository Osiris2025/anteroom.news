// Concrete colours per theme, shared by the article reader and the top bar.
// palette(themeId) — concrete colors per theme so the reader re-skins cleanly for
// EVERY theme (dark + light). Never returns null (avoids TS style-prop rejects).
export function palette(themeId: string) {
  const dark: Record<string, { box: string; border: string; ink: string; body: string; accent: string; img: string }> = {
    linear:    { box: "#0f1011", border: "#26282c", ink: "#f7f8f8", body: "#c9cdd4", accent: "#7170ff", img: "linear-gradient(135deg,#1a1a2e,#0f1011)" },
    terminal:  { box: "#001100", border: "#00ff40", ink: "#00ff00", body: "#00cc00", accent: "#00ff00", img: "linear-gradient(135deg,#002200,#000)" },
    crt: { box: "#140c00", border: "#7a5400", ink: "#ffb000", body: "#cc8d00", accent: "#ffb000", img: "linear-gradient(135deg,#1a1000,#000)" },
    glass: { box: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.3)", ink: "#fff", body: "#e6e2ff", accent: "#7ef0d4", img: "linear-gradient(135deg,#3b2f8f,#0b0a1f)" },
    dashboard: { box: "#161c24", border: "#26303c", ink: "#ffffff", body: "#a9b6c4", accent: "#19e3a0", img: "linear-gradient(135deg,#0e1218,#1b232d)" },
    crawler:   { box: "#0f0f12", border: "#2a2a2e", ink: "#f4f4f5", body: "#c9c9cf", accent: "#e11d2e", img: "linear-gradient(135deg,#2a0000,#111)" },
    ticker:    { box: "#111826", border: "#1f2a3d", ink: "#e8edf5", body: "#aab6c8", accent: "#fbbf24", img: "linear-gradient(135deg,#1a1a3e,#16213e)" },
    board:     { box: "#3d2819", border: "#6e4a2e", ink: "#f6e7cc", body: "#e0cba6", accent: "#ff8a6b", img: "linear-gradient(135deg,#2c1810,#4a2f1a)" },
    audio: { box: "#1b1620", border: "#2e2535", ink: "#ffffff", body: "#cdbfd0", accent: "#ff6a3d", img: "linear-gradient(135deg,#0e0a12,#2a1a2e)" },
    social:    { box: "#16181c", border: "#2f3336", ink: "#e7e9ea", body: "#c2c5c9", accent: "#1d9bf0", img: "linear-gradient(135deg,#000,#101418)" },
    map: { box: "#0f2a2c", border: "#1f4a4c", ink: "#ffffff", body: "#a8cfc9", accent: "#ff9f1c", img: "linear-gradient(135deg,#0a1f21,#143437)" },
    deco:      { box: "#1b1636", border: "#6b5a2f", ink: "#efe2c4", body: "#d9c9a3", accent: "#d9b25f", img: "linear-gradient(135deg,#1a1a2e,#3a2f52)" },
  };
  if (dark[themeId]) return dark[themeId];

  const light: Record<string, { box: string; border: string; ink: string; body: string; accent: string; img: string }> = {
    tabloid:   { box: "#fbf5e9", border: "#d0c4a8", ink: "#1a1a1a", body: "#4a4038", accent: "#c1121f", img: "linear-gradient(135deg,#ffe14d,#f6efe0)" },
    vercel:    { box: "#ffffff", border: "#e0e0e0", ink: "#171717", body: "#666", accent: "#0072f5", img: "linear-gradient(135deg,#f0f0f0,#fff)" },
    magazine:  { box: "#f8f9fa", border: "#e6e6e6", ink: "#1a1a1a", body: "#666", accent: "#667eea", img: "linear-gradient(135deg,#e9edfd,#fff)" },
    blog:      { box: "#ffffff", border: "#eee", ink: "#333", body: "#777", accent: "#333", img: "linear-gradient(135deg,#f5f5f5,#fff)" },
    spread:    { box: "#f4eee2", border: "#1b1b1b", ink: "#1b1b1b", body: "#4a4338", accent: "#8a1d24", img: "linear-gradient(135deg,#f0ece4,#faf8f5)" },
    hemp:      { box: "#f3ead6", border: "#a99a73", ink: "#3e3322", body: "#5f503a", accent: "#6f8450", img: "linear-gradient(135deg,#e2d6bc,#f7f1e3)" },
    water:     { box: "rgba(255,255,255,0.78)", border: "#d9def0", ink: "#2f2a48", body: "#5d5877", accent: "#6b8fd6", img: "linear-gradient(135deg,#fef9ef,#e8f0fe)" },
    cardwall:  { box: "#ffffff", border: "#e5e7eb", ink: "#1a1a2e", body: "#5a5a6a", accent: "#667eea", img: "linear-gradient(135deg,#eef1fb,#fff)" },
    split: { box: "#ffffff", border: "#e3e7ee", ink: "#1c2330", body: "#5b6577", accent: "#1a73e8", img: "linear-gradient(135deg,#e8f0fe,#fff)" },
  };
  return light[themeId] || { box: "#f5f5f7", border: "#dedfe3", ink: "#1a1a1a", body: "#444", accent: "#666", img: "linear-gradient(135deg,#eee,#fff)" };
}

export const DARK_THEMES = ["linear","terminal","crt","glass","dashboard","crawler","ticker","board","audio","social","map","deco"];
export function isDarkTheme(themeId: string) { return DARK_THEMES.includes(themeId); }
