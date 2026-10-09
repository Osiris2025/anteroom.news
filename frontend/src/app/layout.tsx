import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MagazineSwitcher from "@/components/MagazineSwitcher";
import RightExploreDrawer from "@/components/RightExploreDrawer";
import { ThemeProvider } from "@/lib/ThemeContext";
import TrackPageView from "@/components/TrackPageView";
import UmamiScript from "@/components/UmamiScript";
import { AdminProvider } from "@/components/AdminProvider";
import { SITE_URL } from "@/lib/site";

const ICON_V = "2";

export const metadata: Metadata = {
  title: "Anteroom",
  metadataBase: new URL(SITE_URL),
  description: "Anteroom — a house of rooms. Cross the threshold.",
  // Icons are declared explicitly (files live in /public) so every browser
  // finds a PNG it can use for bookmarks/Favorites. Safari ignores SVG icons
  // for Favorites and asks for /apple-touch-icon.png directly. Bump ICON_V to
  // force browsers to drop a cached old/blank icon.
  icons: {
    icon: [
      { url: `/favicon.ico?v=${ICON_V}`, sizes: "48x48" },
      { url: `/favicon-32x32.png?v=${ICON_V}`, type: "image/png", sizes: "32x32" },
      { url: `/icon-192.png?v=${ICON_V}`, type: "image/png", sizes: "192x192" },
      { url: `/icon.svg?v=${ICON_V}`, type: "image/svg+xml" },
    ],
    shortcut: [`/favicon.ico?v=${ICON_V}`],
    apple: [{ url: `/apple-touch-icon.png?v=${ICON_V}`, type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: { title: "Anteroom" },
};

export const viewport: Viewport = {
  themeColor: "#0f1011",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <UmamiScript />
        <ThemeProvider>
          <AdminProvider>
            <Navbar />
            <MagazineSwitcher />
            <RightExploreDrawer />
            <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
            <TrackPageView />
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
