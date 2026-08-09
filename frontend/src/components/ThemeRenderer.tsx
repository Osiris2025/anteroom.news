"use client";
import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { renderTemplate } from "@/lib/themes";
import LiveFeed from "@/components/LiveFeed";

/**
 * ThemeRenderer
 * Renders the shared semantic template for the active theme's structure spec.
 * - The app navbar owns the top nav, so the template's internal header is hidden.
 * - Card elements carry data-href -> forwarded to client-side router.
 * - Maintenance + context boxes come from the structure/footer templates.
 */
export default function ThemeRenderer() {
  const router = useRouter();
  const { currentTheme, setTheme } = useTheme();
  const shellRef = useRef<HTMLDivElement>(null);

  // Semantic body for the ACTIVE theme, with the internal header suppressed
  // (the app navbar mounting above handles top navigation).
  const structure = { ...currentTheme.structure, hideHeader: true };
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
      <LiveFeed />
      <div ref={shellRef} data-theme-shell="" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}