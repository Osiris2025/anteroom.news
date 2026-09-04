import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MagazineSwitcher from "@/components/MagazineSwitcher";
import RightExploreDrawer from "@/components/RightExploreDrawer";
import { ThemeProvider } from "@/lib/ThemeContext";

export const metadata: Metadata = {
  title: "Anteroom",
  description: "Anteroom — a house of rooms. Cross the threshold.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          {/* Navbar first, then the two fixed hamburgers AFTER it in the DOM so
              Safari paints/their compositing layer above the sticky navbar — the
              buttons keep a fixed on-screen position but reliably receive taps.
              (Both hamburgers are `position:fixed`; reordering changes only
              stacking order on Safari/WebKit, not their visual placement.) */}
          <Navbar />
          <MagazineSwitcher />
          <RightExploreDrawer />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}