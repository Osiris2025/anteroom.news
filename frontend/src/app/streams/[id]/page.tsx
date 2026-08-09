import ThemeRenderer from "@/components/ThemeRenderer";

/**
 * Stream page — renders through the SAME theme engine as the homepage
 * (ThemeRenderer -> renderTemplate + applyTheme), so EVERY theme's own HTML
 * template + CSS applies. LiveFeed is filtered to this magazine's articles.
 */
export default async function StreamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThemeRenderer magazineId={id} />;
}