'use client';

import Link from 'next/link';
import TopNavItems from '@/components/TopNavItems';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1 shrink-0">
            {/* The magazine hamburger is mounted globally in layout.tsx (fixed, top-left);
                the brand is shifted right to clear it. */}
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-tech dark:hover:text-tech-light transition-colors shrink-0" style={{ marginLeft: 44 }}>
              AI News Nexus
            </Link>
          </div>
          {/* Top-level site actions: visible on desktop; on mobile/tablet they live inside
              the global magazine drawer instead (see MagazineSwitcher). */}
          <div className="hidden lg:flex items-center">
            <TopNavItems />
          </div>
        </div>
      </div>
    </nav>
  );
}