'use client';

import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import NotificationList from './NotificationList';
import { createClient } from '@/lib/supabase_client';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Unread count: on mount, on open/close, every 60s, and when the list changes it
  useEffect(() => {
    let active = true;
    const loadCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
        if (!active || !response.ok) return;
        const result = (await response.json()) as { count: number };
        setCount(result.count);
      } catch {
        /* ignore network errors */
      }
    };
    void loadCount();
    const handler = () => void loadCount();
    const interval = window.setInterval(handler, 60_000);
    window.addEventListener('notifications-updated', handler);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('notifications-updated', handler);
    };
  }, [open]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

    // Live updates: a new notification row for this user refreshes the count and list
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      channel = supabase
        .channel(`notifications:${data.user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'tbl_notifications', filter: `user_id=eq.${data.user.id}` },
          () => {
            window.dispatchEvent(new Event('notifications-updated')); // refresh count
            window.dispatchEvent(new Event('notifications-new')); // refresh open list
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);
  
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-full p-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-5 text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      {open && (
        <div
          onClick={(event) => {
            // close the dropdown when a notification link is followed
            if ((event.target as HTMLElement).closest('a')) setOpen(false);
          }}
          className="absolute right-0 top-full z-50 mt-3 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <NotificationList compact />
        </div>
      )}
    </div>
  );
}