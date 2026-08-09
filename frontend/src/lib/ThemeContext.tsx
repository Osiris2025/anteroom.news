"use client";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Theme, themes, getTheme, applyTheme, magazineThemes } from "@/lib/themes";

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (id: string) => void;
  availableThemes: Theme[];
  magazineDefault: (magazineId: string) => Theme;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "nexus-theme";

/** Derive a magazine id from the URL path, if we're on a magazine/article page. */
function magazineIdFromPath(pathname: string): string | null {
  if (!pathname) return null;
  // /magazines/<id>/... or /streams/weekly-weird-news/... (a magazine's stream/article)
  const mag = /^\/magazines\/([^/]+)/.exec(pathname);
  if (mag) return mag[1];
  const stream = /^\/streams\/([^/]+)/.exec(pathname);
  if (stream) return stream[1]; // e.g. weekly-weird-news
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const magazineId = useMemo(() => magazineIdFromPath(pathname), [pathname]);

  // currentTheme reflects the EFFECTIVE theme (user choice wins; else magazine default; else linear).
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  // Resolve on mount and whenever the magazine/route or stored user choice changes.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const magDefault = magazineId ? magazineThemes[magazineId] : null;
    const id = saved || magDefault || "linear";
    setCurrentTheme(getTheme(id));
  }, [magazineId]);

  // Keep the active theme's CSS applied.
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // User-driven switch: persisted (this is the ONLY thing that writes to storage).
  const setTheme = (id: string) => {
    const t = getTheme(id);
    localStorage.setItem(STORAGE_KEY, id);
    setCurrentTheme(t);
  };

  const value = useMemo<ThemeContextType>(
    () => ({
      currentTheme,
      setTheme,
      availableThemes: themes,
      magazineDefault: (id) => getTheme(magazineThemes[id] || "linear"),
    }),
    [currentTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}