import MagazineView from "@/components/MagazineView";

/** Stream page — themed via the theme system (MagazineView uses the theme's own .mag-* CSS). */
export default async function StreamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MagazineView id={id} />;
}
