'use client';

import Link from 'next/link';
import TopNavItems from '@/components/TopNavItems';
import MagazineSearch from '@/components/MagazineSearch';
import NotificationBell from '@/components/NotificationBell';
import { useSession } from '@/lib/auth-client';

// The two hamburger triggers live INSIDE the navbar as normal in-flow elements
// (never `position:fixed` overlaying the sticky bar). This sidesteps a WebKit/iOS
// Safari bug where a fixed element on top of a sticky element is hit-tested off
// its drawn position (only a corner is tappable). They dispatch a tiny event;
// the drawer components listen and toggle open. On-screen position is identical
// to before — left ☰ opens Magazines, right ⋮⋮ opens Explore.
function Toggle({
  ariaLabel, eventName, glyph, title,
}: { ariaLabel: string; eventName: string; glyph: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 44, height: 44, borderRadius: 10, cursor: 'pointer', padding: 0,
        background: 'rgba(127,127,127,.12)', border: '1px solid rgba(127,127,127,.4)',
        color: 'inherit', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)',
        willChange: 'transform', flexShrink: 0,
      }}
      onClick={() => {
        try { window.dispatchEvent(new CustomEvent(eventName)); }
        catch { /* noop */ }
      }}
    >
      {glyph}
    </button>
  );
}

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1 shrink-0">
            <Toggle
              ariaLabel="Open magazine menu"
              eventName="nexus:toggle-magazines"
              title="Magazines"
              glyph={<svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" /></svg>}
            />
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-tech dark:hover:text-tech-light transition-colors shrink-0" style={{ marginLeft: 4 }}>
              Anteroom
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Search + site actions on lg+ */}
            <div className="hidden lg:flex items-center justify-end gap-3" style={{ marginRight: 8 }}>
              <MagazineSearch />
              <Link
                href="/search"
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
              >
                Search
              </Link>
              <div className="hidden lg:flex items-center">
                <TopNavItems />
              </div>
            </div>
            {session?.user && (
              <Link
                href="/dms"
                className="hidden md:inline text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                💬 Messages
              </Link>
            )}
            <NotificationBell />
            <Toggle
              ariaLabel="Open explore panel"
              eventName="nexus:toggle-explore"
              title="Explore"
              glyph={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="12" r="2.4" /><circle cx="4" cy="12" r="1.6" /><circle cx="20" cy="12" r="1.6" /></svg>}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
