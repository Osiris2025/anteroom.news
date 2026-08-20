'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import ThemeSelector from '@/components/ThemeSelector';
import NotificationBell from '@/components/NotificationBell';
import { useSession } from '@/lib/auth-client';

const streams = [
  { name: 'Tech Pulse', href: '/streams/tech-pulse', color: 'text-tech-dark dark:text-tech-light' },
  { name: 'Poli Split', href: '/streams/poli-split', color: 'text-poli-dark dark:text-poli-light' },
  { name: 'Weekly Weird', href: '/streams/weekly-weird-news', color: 'text-weird-dark dark:text-weird-light' },
];

const ADMIN_ROLES = ['superadmin', 'admin'];

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const { data: session, isPending } = useSession();
  const userRole = (session?.user as any)?.role || '';
  const isAdmin = ADMIN_ROLES.includes(userRole);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-tech dark:hover:text-tech-light transition-colors shrink-0">
            AI News Nexus
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/collect"
              className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
            >
              Collect
            </Link>
            <Link
              href="/search"
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
            >
              Search
            </Link>
            <Link
              href="/social-feed"
              className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
            >
              Social
            </Link>
            <Link
              href="/highlights"
              className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300 transition-colors"
            >
              📊 Highlights
            </Link>
            <Link
              href="/history"
              className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-colors"
            >
              History
            </Link>
            <Link
              href="/my-feed"
              className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 transition-colors"
            >
              My Feed
            </Link>
            <Link
              href="/shop"
              className="text-sm font-medium text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 transition-colors"
            >
              Shop
            </Link>
            {streams.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-tech dark:hover:text-tech-light transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {session?.user && (
              <Link
                href="/dms"
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                💬 Messages
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg
                  bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow
                  hover:from-amber-400 hover:to-orange-500 transition-colors"
                style={{ letterSpacing: '.02em' }}
              >
                🗞️ Admin
              </Link>
            )}
            <NotificationBell />
            <ThemeSelector />
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
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
        </div>
      </div>
    </nav>
  );
}