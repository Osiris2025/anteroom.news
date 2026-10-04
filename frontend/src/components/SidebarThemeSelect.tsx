"use client";
import { useTheme } from "@/lib/ThemeContext";

// Theme picker for the slide-out sidebar (sits right under Search).
export default function SidebarThemeSelect() {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 6px", fontSize: 13, fontWeight: 600, color: "#e7e9ee" }}>
      <span aria-hidden>🎨</span>
      <span style={{ flexShrink: 0 }}>Theme</span>
      <select
        value={currentTheme.id}
        onChange={(e) => setTheme(e.target.value)}
        aria-label="Select theme"
        style={{
          flex: 1, minWidth: 0, padding: "6px 8px", borderRadius: 8, fontSize: 13, cursor: "pointer",
          background: "rgba(255,255,255,.06)", color: "#e7e9ee", border: "1px solid rgba(150,150,150,.35)",
        }}
      >
        {availableThemes.map((t) => (
          <option key={t.id} value={t.id} style={{ color: "#111" }}>{t.name}</option>
        ))}
      </select>
    </label>
  );
}
