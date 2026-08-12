'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import ThemeSelector from '@/components/ThemeSelector';
import { useSession } from '@/lib/auth-client';

const ADMIN_ROLES = ['superadmin', 'admin'];

declare global {
  interface Window { __nexusCloseDrawer?: () => void; }
}

/**
 * The top-level site actions (Collect / Social / Shop / Admin / theme / dark toggle).
 * Shared so the same set can render in the desktop navbar AND inside the global
 * magazine drawer (mobile/tablet), keeping behaviour identical in both places.
 */
export default function TopNavItems({ vertical = false }: { vertical?: boolean }) {
  const [darkMode, setDarkMode] = useState(false);
  const { data: session, isPending } = useSession();
  const userRole = (session?.user as any)?.role || '';
  const isAdmin = ADMIN_ROLES.includes(userRole);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  // Vertical (mobile/tablet drawer) uses stacked rows styled for a dark drawer;
  // horizontal (desktop navbar) uses the compact inline layout.
  const rows = [
    { href: '/collect', label: 'Collect', cls: 'text-amber-600 dark:text-amber-400 hover:text-amber-500' },
    { href: '/social-feed', label: 'Social', cls: 'text-purple-600 dark:text-purple-400 hover:text-purple-500' },
    { href: '/shop', label: 'Shop', cls: 'text-pink-600 dark:text-pink-400 hover:text-pink-500' },
  ];

  if (vertical) {
    return (
      <div className="nexus-topitems" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((r) => (
          <Link key={r.href} href={r.href} onClick={() => { window.__nexusCloseDrawer?.(); }}
            className={r.cls}
            style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', color: '#e7e9ee' }}>
            {r.label}
          </Link>
        ))}
        {isAdmin && (
          <Link href="/admin" onClick={() => { window.__nexusCloseDrawer?.(); }}
            style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', color: '#ffd75e', background: 'rgba(255,215,94,.08)', border: '1px solid rgba(255,215,94,.3)', marginTop: 2 }}>
            🗞️ Admin
          </Link>
        )}
        <div style={{ marginTop: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10 }}>
          <ThemeSelector />
        </div>
        <button onClick={toggleDarkMode}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '10px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,.14)', color: '#e7e9ee', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          {darkMode ? '☀️ Switch to light mode' : '🌙 Switch to dark mode'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center gap-6">
        {rows.map((r) => (
          <Link key={r.href} href={r.href} className={`text-sm font-medium transition-colors ${r.cls}`}>{r.label}</Link>
        ))}
      </div>
      {isAdmin && (
        <Link href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow hover:from-amber-400 hover:to-orange-500 transition-colors"
          style={{ letterSpacing: '.02em' }}>
          🗞️ Admin
        </Link>
      )}
      <ThemeSelector />
      <button onClick={toggleDarkMode}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
        {darkMode ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  );
}
