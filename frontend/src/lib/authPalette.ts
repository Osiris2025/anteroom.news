/** Resolve readable colors for the active theme (dark/light aware). */
export function palette(themeId: string | undefined) {
  const dark = ["linear", "terminal", "crt", "glass", "dashboard", "crawler", "ticker", "board", "audio", "social", "map", "deco"];
  if (themeId && dark.includes(themeId)) {
    const p: Record<string, [string, string, string, string]> = {
      linear:   ["#0f1011", "#f7f8f8", "#aab6c8", "#7170ff"],
      dashboard:["#111826", "#e8edf5", "#aab6c8", "#38bdf8"],
      terminal: ["#001100", "#00ff00", "#00aa00", "#00ff00"],
      glass:    ["rgba(255,255,255,0.08)", "#fff", "#a5b4fc", "#818cf8"],
      audio:    ["#161b22", "#c9d1d9", "#a5b0bd", "#58a6ff"],
    };
    return p[themeId] || ["#1c1e26", "#e7e9ea", "#aab", "#7aa2f7"];
  }
  const l: Record<string, [string, string, string, string]> = {
    tabloid: ["#fbf5e9", "#2a2216", "#6b5b47", "#8B4513"],
  };
  return l[themeId || ""] || ["#f5f5f7", "#1a1a1a", "#666", "#0072f5"];
}

export function authStyles(box: string, ink: string) {
  return {
    card: { background: box, borderColor: "rgba(127,127,127,0.25)", color: ink },
    input: { background: "transparent", border: "1px solid rgba(127,127,127,0.35)", color: ink },
  };
}
