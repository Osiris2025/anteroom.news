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

export const metadata: Metadata = {
  title: "Anteroom",
  metadataBase: new URL(SITE_URL),
  description: "Anteroom — a house of rooms. Cross the threshold.",
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
