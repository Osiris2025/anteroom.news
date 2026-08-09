import ThemeRenderer from "@/components/ThemeRenderer";

/**
 * Homepage — the shared semantic template body for the active theme.
 * The app navbar (in layout.tsx) owns the top nav; this renders the themed
 * card/sidebar/box layout per the active theme's structure spec.
 */
export default function Home() {
  return <ThemeRenderer />;
}