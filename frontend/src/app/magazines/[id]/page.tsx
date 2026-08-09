import ThemeRenderer from "@/components/ThemeRenderer";

/**
 * Magazine page — renders through the SAME theme engine as the homepage
 * (ThemeRenderer -> renderTemplate + applyTheme), so every theme's own
 * HTML template + CSS applies. This is the path that renders themes correctly.
 */
export default async function MagazinePage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  return <ThemeRenderer />;
}
