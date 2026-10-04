'use client';

import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

const ADMIN_ROLES = ['superadmin', 'admin'];

declare global {
  interface Window { __nexusCloseDrawer?: () => void; }
}

/**
 * The top-level site actions (Collect / Social / Shop / Admin).
 * Theme selector + dark/light toggle were REMOVED from the navbar (2026-08-16):
 * they overlapped the fixed right-side Explore hamburger on tablets and are
 * redundant now that each magazine's theme comes from its identity data.
 * Shared so the same set can render in the desktop navbar AND inside the global
 * magazine drawer, keeping behaviour identical in both places.
 */
export default function TopNavItems({ vertical = false }: { vertical?: boolean }) {
  const { data: session, isPending } = useSession();
  const userRole = (session?.user as any)?.role || '';
  const isAdmin = ADMIN_ROLES.includes(userRole);

  // Vertical (mobile/tablet drawer) uses stacked rows styled for a dark drawer;
  // horizontal (desktop navbar) uses the compact inline layout.
  const rows = [
    { href: '/collect', label: 'Collect', cls: 'text-amber-600 dark:text-amber-400 hover:text-amber-500' },
    { href: '/social-feed', label: 'Social', cls: 'text-purple-600 dark:text-purple-400 hover:text-purple-500' },
    { href: '/highlights', label: '📊 Highlights', cls: 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-500' },
    { href: '/history', label: 'History', cls: 'text-sky-600 dark:text-sky-400 hover:text-sky-500' },
    { href: '/my-feed', label: 'My Feed', cls: 'text-teal-600 dark:text-teal-400 hover:text-teal-500' },
    { href: '/shop', label: 'Shop', cls: 'text-pink-600 dark:text-pink-400 hover:text-pink-500' },
  ];

  if (vertical) {
    return (
      <div className="nexus-topitems" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {rows.map((r) => (
          <Link key={r.href} href={r.href} onClick={() => { window.__nexusCloseDrawer?.(); }}
            className={r.cls}
            style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', color: '#e7e9ee' }}>
            {r.label}
          </Link>
        ))}
        {isAdmin && (
          <Link href="/admin" onClick={() => { window.__nexusCloseDrawer?.(); }}
            style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', color: '#ffd75e', background: 'rgba(255,215,94,.08)', border: '1px solid rgba(255,215,94,.3)', marginTop: 2 }}>
            🗞️ Admin
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center gap-4">
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
    </div>
  );
}
