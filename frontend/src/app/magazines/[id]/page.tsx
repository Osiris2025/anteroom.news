import ThemeRenderer from "@/components/ThemeRenderer";

/**
 * Magazine page — renders through the SAME theme engine as the homepage
 * (ThemeRenderer -> renderTemplate + applyTheme), so EVERY theme's own HTML
 * template + CSS applies. LiveFeed is filtered to this magazine's articles.
 * This is what makes each theme follow on magazine pages.
 */
export default async function MagazinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThemeRenderer magazineId={id} />;
}