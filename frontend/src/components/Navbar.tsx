'use client';

import Link from 'next/link';
import TopNavItems from '@/components/TopNavItems';
import MagazineSearch from '@/components/MagazineSearch';
import NotificationBell from '@/components/NotificationBell';
import { useSession } from '@/lib/auth-client';
import ProfileMenu from '@/components/ProfileMenu';
import AnteroomWordmark from '@/components/AnteroomWordmark';
import { useTheme } from '@/lib/ThemeContext';
import { palette, isDarkTheme } from '@/lib/themePalette';

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
  const { currentTheme } = useTheme();
  const C = palette(currentTheme.id);
  const dark = isDarkTheme(currentTheme.id);

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-md ${dark ? 'nx-dark' : ''}`}
      style={{
        background: C.box,
        color: C.ink,
        borderBottom: `1px solid ${C.border}`,
        borderTop: `3px solid ${C.accent}`,
        boxShadow: dark ? '0 2px 14px rgba(0,0,0,.45)' : '0 2px 10px rgba(0,0,0,.08)',
      }}
    >
      {dark && (
        <style>{`
          .nx-dark .text-amber-600{color:#fbbf24} .nx-dark .text-purple-600{color:#c084fc}
          .nx-dark .text-yellow-600{color:#facc15} .nx-dark .text-sky-600{color:#38bdf8}
          .nx-dark .text-teal-600{color:#2dd4bf} .nx-dark .text-pink-600{color:#f472b6}
          .nx-dark .text-emerald-600{color:#34d399} .nx-dark .text-gray-500{color:#9ca3af}
        `}</style>
      )}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-16">
          <div className="flex items-center gap-1 shrink-0">
            <Toggle
              ariaLabel="Open magazine menu"
              eventName="nexus:toggle-magazines"
              title="Magazines"
              glyph={<svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" /></svg>}
            />
            <Link href="/" className="text-xl font-bold transition-colors shrink-0" style={{ marginLeft: 4, color: C.ink }}>
              <AnteroomWordmark />
            </Link>
          </div>
          <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
            {/* Search + site actions on lg+ */}
            <div className="hidden md:flex items-center gap-3 flex-1 min-w-0" style={{ marginRight: 8 }}>
              <div style={{ flex: "1 1 120px", minWidth: 90 }}>
                <MagazineSearch fluid />
              </div>
              <div className="hidden lg:flex items-center shrink-0">
                <TopNavItems />
              </div>
            </div>
            {session?.user && (
              <Link
                href="/dms"
                className="hidden 2xl:inline text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                💬 Messages
              </Link>
            )}
            <NotificationBell />
            <ProfileMenu />
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
