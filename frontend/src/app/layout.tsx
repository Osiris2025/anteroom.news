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
          {/* Magazine switcher mounted OUTSIDE the navbar so its fixed elements
              (hamburger / drawer / rail) live at body stacking level — reliable open/close. */}
          <MagazineSwitcher />
          <RightExploreDrawer />
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}