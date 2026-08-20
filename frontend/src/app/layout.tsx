import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MagazineSwitcher from "@/components/MagazineSwitcher";
import { ThemeProvider } from "@/lib/ThemeContext";
import TrackPageView from "@/components/TrackPageView";

export const metadata: Metadata = {
  title: "AI News Nexus",
  metadataBase: new URL("https://nexus.osiris2025.com"),
  description: "Multi-stream AI-powered news platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          {/* Magazine switcher mounted OUTSIDE the navbar so its fixed elements
              (hamburger / drawer / rail) live at body stacking level — reliable open/close. */}
          <MagazineSwitcher />
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
          <TrackPageView />
        </ThemeProvider>
      </body>
    </html>
  );
}