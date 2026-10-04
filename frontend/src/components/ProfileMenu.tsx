'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, authClient } from '@/lib/auth-client';

/**
 * ProfileMenu — far-right toolbar icon (Todd spec, 2026-09-06):
 * - Signed out: non-descript grey head. Menu offers Sign in / Create account.
 * - Signed in: user's profile image if set, else initials disc. Menu offers
 *   Profile, Bookmarks, My Feed, History, Messages, Admin (role-gated), Sign out.
 */

function HeadIcon({ size = 34 }: { size?: number }) {
  // Non-descript grey head-and-shoulders
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="rgba(150,150,150,.55)" aria-hidden>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.5 19.4c0-3.6 3.4-5.9 7.5-5.9s7.5 2.3 7.5 5.9c0 .9-.7 1.6-1.6 1.6H6.1c-.9 0-1.6-.7-1.6-1.6z" />
    </svg>
  );
}

function Avatar({ url, name, size = 34 }: { url?: string | null; name?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(150,150,150,.4)' }}
      />
    );
  }
  const initials = (name || '?')
    .split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(127,127,127,.18)', border: '1px solid rgba(150,150,150,.4)',
      color: 'rgba(200,200,200,.9)', fontSize: size * 0.4, fontWeight: 700,
    }}>{initials}</span>
  );
}

const itemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px',
  fontSize: 13.5, color: 'inherit', textDecoration: 'none', background: 'none',
  border: 'none', cursor: 'pointer',
};

export default function ProfileMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [mags, setMags] = useState<{ id: string; name: string }[]>([]);
  const [defId, setDefId] = useState<string | null>(null);
  const user = session?.user as any;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !session?.user) return;
    (async () => {
      try {
        const [f, p] = await Promise.all([fetch('/api/follows').then((r) => r.json()), fetch('/api/preferences').then((r) => r.json())]);
        const list: { id: string; name: string }[] = (f.follows || []).map((x: any) => ({ id: x.magazineId, name: x.magazineName }));
        if (p.defaultMagazineId && !list.some((o) => o.id === p.defaultMagazineId)) list.push({ id: p.defaultMagazineId, name: p.defaultMagazineName || p.defaultMagazineId });
        list.sort((a, b) => (a.id === p.defaultMagazineId ? -1 : b.id === p.defaultMagazineId ? 1 : a.name.localeCompare(b.name)));
        setMags(list); setDefId(p.defaultMagazineId || null);
      } catch { /* noop */ }
    })();
  }, [open, session?.user]);

  const signOut = async () => {
    setOpen(false);
    try { await authClient.signOut(); } catch { /* noop */ }
    router.push('/');
    router.refresh();
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        aria-label={user ? 'Your profile menu' : 'Sign in menu'}
        title={user ? (user.name || user.email) : 'Sign in'}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', padding: 0,
          background: 'transparent', border: 'none', overflow: 'hidden',
        }}
      >
        {user ? <Avatar url={user.image} name={user.name} /> : <HeadIcon />}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 60,
          minWidth: 200, borderRadius: 12, overflow: 'hidden',
          background: 'rgba(19,22,26,.98)', border: '1px solid rgba(150,150,150,.3)',
          boxShadow: '0 12px 32px rgba(0,0,0,.45)', color: '#ddd',
        }}>
          {user ? (
            <>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(150,150,150,.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar url={user.image} name={user.name} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Member'}</div>
                    <div style={{ fontSize: 11.5, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  </div>
                </div>
              </div>
              {mags.length > 0 && (
                <div style={{ borderBottom: '1px solid rgba(150,150,150,.2)', padding: '6px 0' }}>
                  <div style={{ padding: '4px 14px', fontSize: 11, letterSpacing: '.6px', textTransform: 'uppercase', opacity: 0.55 }}>My magazines</div>
                  {mags.map((m) => (
                    <Link key={m.id} href={`/magazines/${m.id}`} style={itemStyle} onClick={() => setOpen(false)}>
                      {m.id === defId ? '⌂ ' : ''}{m.name}
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/profile" style={itemStyle} onClick={() => setOpen(false)}>Profile &amp; settings</Link>
              <Link href="/bookmarks" style={itemStyle} onClick={() => setOpen(false)}>Bookmarks</Link>
              <Link href="/my-feed" style={itemStyle} onClick={() => setOpen(false)}>My Feed</Link>
              <Link href="/history" style={itemStyle} onClick={() => setOpen(false)}>History</Link>
              {user.role === 'admin' || user.role === 'superadmin' ? (
                <Link href="/admin" style={{ ...itemStyle, color: '#ffd700' }} onClick={() => setOpen(false)}>Admin desk</Link>
              ) : null}
              <button onClick={signOut} style={{ ...itemStyle, borderTop: '1px solid rgba(150,150,150,.2)', color: '#ff6b6b' }}>Sign out</button>
            </>
          ) : (
            <>
              <div style={{ padding: '12px 14px', fontSize: 12.5, opacity: 0.7, borderBottom: '1px solid rgba(150,150,150,.2)' }}>
                Sign in to follow magazines, bookmark stories, and comment.
              </div>
              <Link href="/profile#signin" style={{ ...itemStyle, color: '#7170ff', fontWeight: 700 }} onClick={() => setOpen(false)}>Sign in / Create account</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
