'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/board', label: 'Board' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; link: string | null; read: boolean; created_at: string }[]>([]);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          setNotifications(data);
          setUnread(data.filter((n) => !n.read).length);
        }
      });
  }, [profile]);

  async function markAllRead() {
    if (!profile) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-sm"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Cohort PM
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  style={{
                    color: pathname.startsWith(n.href) ? 'var(--accent)' : 'var(--text-secondary)',
                    background: pathname.startsWith(n.href) ? 'var(--accent-light)' : 'transparent',
                  }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotif(!showNotif); if (!showNotif) markAllRead(); }}
                className="relative p-1.5 rounded hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: 'var(--danger)' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {showNotif && (
                <div
                  className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-lg border shadow-lg"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b text-sm" style={{ borderColor: 'var(--border)', opacity: n.read ? 0.6 : 1 }}>
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <span className="text-sm hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
              {profile?.display_name}
            </span>
            <button
              onClick={signOut}
              className="text-xs px-2 py-1 rounded border hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Sign out
            </button>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden p-1" style={{ color: 'var(--text-secondary)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileNav && (
          <nav className="md:hidden border-t px-4 py-2 flex flex-col gap-1" style={{ borderColor: 'var(--border)' }}>
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileNav(false)}
                className="px-3 py-2 rounded text-sm font-medium"
                style={{
                  color: pathname.startsWith(n.href) ? 'var(--accent)' : 'var(--text-secondary)',
                  background: pathname.startsWith(n.href) ? 'var(--accent-light)' : 'transparent',
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
