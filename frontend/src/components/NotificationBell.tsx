'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

/* ── Types ────────────────────────────────────────────── */
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  referenceType: string | null;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

interface NotifResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

/* ── Time-ago helper ──────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMon = Math.floor(diffDay / 30);
  return `${diffMon}mo ago`;
}

/* ── Icon ─────────────────────────────────────────────── */
function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

/* ── Component ────────────────────────────────────────── */
export default function NotificationBell() {
  const { data: session, isPending } = useSession();
  const isAuthed = !!session?.user;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /* Fetch notifications (only when authed) */
  const fetchNotifs = useCallback(async () => {
    if (!isAuthed) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=5');
      if (!res.ok) return;
      const data: NotifResponse = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount ?? data.notifications.filter((n) => !n.read).length);
    } catch {
      // network error – ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthed]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  /* Poll every 30 s while authed */
  useEffect(() => {
    if (!isAuthed) return;
    const id = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(id);
  }, [isAuthed, fetchNotifs]);

  /* Click-outside → close */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  /* Mark single notification as read */
  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      // ignore
    }
  };

  /* Mark all as read */
  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  /* ── Render ──────────────────────────── */
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Overlay backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div
            className={`
              absolute right-0 top-full mt-2 z-50 w-80
              bg-gray-900 border border-gray-700 rounded-xl shadow-2xl
              overflow-hidden
              origin-top-right
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-sm font-semibold text-gray-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 && (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-500">
                  No notifications yet
                </div>
              )}

              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markRead(n.id);
                    // Navigate to referenced article if applicable
                    if (n.referenceType === 'article' && n.referenceId) {
                      setOpen(false);
                      router.push(`/articles/${n.referenceId}`);
                    }
                  }}
                  className={`
                    w-full text-left px-4 py-3 border-b border-gray-800 last:border-b-0
                    transition-colors
                    ${n.read
                      ? 'bg-gray-900 hover:bg-gray-800'
                      : ''
                    }
                  `}
                  style={!n.read ? { backgroundColor: 'rgba(55,65,81,0.5)' } : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm truncate ${
                          n.read ? 'text-gray-400' : 'text-gray-100 font-medium'
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {n.body.length > 80
                            ? n.body.slice(0, 80) + '…'
                            : n.body}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0 mt-0.5">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
