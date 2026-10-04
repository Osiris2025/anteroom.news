'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, authClient } from '@/lib/auth-client';

// Top of the slide-out sidebar: the same account options as the top bar
// (sign in / profile menu, Messages, Notifications), laid out as simple rows.

type Notif = { id: string; title: string; body: string | null; referenceType: string | null; referenceId: string | null; read: boolean; createdAt: string };

const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', borderRadius: 8,
  fontWeight: 600, fontSize: 14, textDecoration: 'none', color: '#e7e9ee', background: 'none',
  border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
};
const sub: React.CSSProperties = { ...row, fontWeight: 500, fontSize: 13.5, padding: '5px 12px 5px 34px', opacity: 0.9 };

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function SidebarAccount({ onNavigate }: { onNavigate: () => void }) {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const r = await fetch('/api/notifications?limit=5');
      if (!r.ok) return;
      const j = await r.json();
      setNotifs(j.notifications || []);
      setUnread(j.unreadCount ?? (j.notifications || []).filter((n: Notif) => !n.read).length);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load, user]);

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifs((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(u - 1, 0));
    } catch { /* ignore */ }
  };
  const markAll = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifs((p) => p.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };
  const signOut = async () => {
    onNavigate();
    try { await authClient.signOut(); } catch { /* ignore */ }
    router.push('/');
    router.refresh();
  };

  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
  const box: React.CSSProperties = { padding: '4px 0 6px', borderBottom: '1px solid rgba(255,255,255,.1)', marginBottom: 4 };

  if (!user) {
    return (
      <div style={box}>
        <Link href="/profile#signin" onClick={onNavigate} style={{ ...row, color: '#9b9aff', fontWeight: 700 }}>
          <span aria-hidden>👤</span> Sign in / Create account
        </Link>
      </div>
    );
  }

  return (
    <div style={box}>
      {/* Profile */}
      <button type="button" onClick={() => setMenuOpen((v) => !v)} style={row} aria-expanded={menuOpen}>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" width={24} height={24} referrerPolicy="no-referrer" style={{ borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <span aria-hidden style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(127,127,127,.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
            {(user.name || user.email || '?').trim()[0]?.toUpperCase()}
          </span>
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'My profile'}</span>
        <span aria-hidden style={{ opacity: 0.6, fontSize: 11 }}>{menuOpen ? '▴' : '▾'}</span>
      </button>
      {menuOpen && (
        <div>
          <Link href="/profile" onClick={onNavigate} style={sub}>Profile &amp; settings</Link>
          <Link href="/bookmarks" onClick={onNavigate} style={sub}>Bookmarks</Link>
          <Link href="/my-feed" onClick={onNavigate} style={sub}>My Feed</Link>
          <Link href="/history" onClick={onNavigate} style={sub}>History</Link>
          {isAdmin && <Link href="/admin" onClick={onNavigate} style={{ ...sub, color: '#ffd700' }}>Admin desk</Link>}
          <button type="button" onClick={signOut} style={{ ...sub, color: '#ff6b6b' }}>Sign out</button>
        </div>
      )}

      {/* Messages */}
      <Link href="/dms" onClick={onNavigate} style={row}><span aria-hidden>💬</span> Messages</Link>

      {/* Notifications */}
      <button type="button" onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) load(); }} style={row} aria-expanded={notifOpen}>
        <span aria-hidden>🔔</span>
        <span style={{ flex: 1 }}>Notifications</span>
        {unread > 0 && (
          <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{unread > 99 ? '99+' : unread}</span>
        )}
        <span aria-hidden style={{ opacity: 0.6, fontSize: 11 }}>{notifOpen ? '▴' : '▾'}</span>
      </button>
      {notifOpen && (
        <div style={{ padding: '2px 8px 6px 12px' }}>
          {unread > 0 && (
            <button type="button" onClick={markAll} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '2px 4px' }}>Mark all read</button>
          )}
          {notifs.length === 0 && <div style={{ fontSize: 13, opacity: 0.6, padding: '6px 4px' }}>No notifications yet</div>}
          {notifs.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (!n.read) markRead(n.id);
                if (n.referenceType === 'article' && n.referenceId) { onNavigate(); router.push(`/articles/${n.referenceId}`); }
              }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: n.read ? 'transparent' : 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, padding: '7px 8px', cursor: 'pointer', color: n.read ? '#9aa0aa' : '#f3f4f6', fontFamily: 'inherit' }}
            >
              <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{timeAgo(n.createdAt)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
