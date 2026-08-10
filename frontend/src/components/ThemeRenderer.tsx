"use client";
import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { renderTemplate, MAGAZINES } from "@/lib/themes";
import LiveFeed from "@/components/LiveFeed";

/**
 * ThemeRenderer
 * Renders the shared semantic template for the active theme's structure spec.
 * - Optional `magazineId`: when set (magazine/stream pages), we render the SAME
 *   theme template as the homepage (so every theme's own HTML template + CSS apply)
 *   and the LiveFeed is filtered to that magazine's approved articles.
 * - The app navbar owns the top nav, so the template's internal header is hidden.
 *
 * Magazine URL slug ≠ canonical id (2026-08-10): the static MAGAZINES id for New
 * Frontiers in Science is `weird-and-wild`, so /magazines/new-frontiers-in-science
 * (name-slugified) did NOT resolve. We resolve with a slugify fallback
 * (id match → slugified name → slugified short) and use the RESOLVED mag.id
 * (never the raw URL slug) for the LiveFeed fetch — DB articles are stored under
 * the canonical id. This lives in the component only; themes.ts is untouched.
 */
export default function ThemeRenderer({ magazineId }: { magazineId?: string }) {
  const router = useRouter();
  const { currentTheme, setTheme } = useTheme();
  const shellRef = useRef<HTMLDivElement>(null);

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const magazine = magazineId
    ? MAGAZINES.find((m) => m.id === magazineId) ||
      MAGAZINES.find((m) => slugify(m.name) === magazineId) ||
      MAGAZINES.find((m) => slugify(m.short) === magazineId)
    : undefined;

  // Semantic body for the ACTIVE theme (internal header suppressed; navbar owns top nav).
  // When scoped to a magazine, magScope = magazine name -> template hides the hardcoded
  // "Explore the magazines" hero + full showcase and renders only that magazine's section.
  // No hardcoded magazine count, so this scales to any number of magazines.
  const structure = {
    ...currentTheme.structure,
    hideHeader: true,
    magScope: magazine ? magazine.name : "",
  };
  const html = renderTemplate(structure);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    // theme selector anywhere in the shell (data-theme-select)
    const onShellChange = (e: Event) => {
      const sel = e.target as HTMLSelectElement | null;
      if (sel && sel.matches("select[data-theme-select]")) setTheme(sel.value);
    };
    // card clicks -> data-href
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest("[data-href]") as HTMLElement | null;
      if (t && t.dataset.href) {
        e.preventDefault();
        router.push(t.dataset.href);
      }
    };
    el.addEventListener("change", onShellChange);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("change", onShellChange);
      el.removeEventListener("click", onClick);
    };
  }, [currentTheme.id, setTheme, router, html]);

  return (
    <div>
      {magazine && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "6px 0 2px" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: magazine.accent, display: "inline-block" }} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {magazine.name.toUpperCase()}
          </h1>
          <span style={{ fontSize: 12, opacity: 0.7, fontStyle: "italic" }}>{magazine.tagline}</span>
        </div>
      )}
      <LiveFeed magazine={magazine ? magazine.id : undefined} />
      <div ref={shellRef} data-theme-shell="" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
