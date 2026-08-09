"use client";
import { useTheme } from "@/lib/ThemeContext";

/**
 * ThemeSelector — compact native dropdown for switching among the 20 themes.
 * Styled to sit in the app navbar; adapts to the site's light/dark via CSS vars.
 */
export default function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentTheme.id}
        onChange={(e) => setTheme(e.target.value)}
        aria-label="Select theme"
        className="cursor-pointer rounded-lg border border-gray-300 bg-white/80 px-2 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-200"
      >
        {availableThemes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}