import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MagazineSwitcher from "@/components/MagazineSwitcher";
import RightExploreDrawer from "@/components/RightExploreDrawer";
import { ThemeProvider } from "@/lib/ThemeContext";
import TrackPageView from "@/components/TrackPageView";
import { AdminProvider } from "@/components/AdminProvider";

export const metadata: Metadata = {
  title: "Anteroom",
  metadataBase: new URL("https://anteroom.news"),
  description: "Anteroom — a house of rooms. Cross the threshold.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
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