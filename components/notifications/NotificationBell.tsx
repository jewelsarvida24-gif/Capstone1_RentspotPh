'use client';

import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import NotificationList from './NotificationList';
import { createClient } from '@/lib/supabase_client';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 84, right: 12 });
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Position the panel under the navbar's right end
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const nav = ref.current?.closest('nav');
      if (!nav) return;
      const rect = nav.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: Math.max(12, document.documentElement.clientWidth - rect.right),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

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

  // Close on outside click or Escape (the panel is in a portal, so check both refs)
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
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

        {mounted &&
        open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            style={{ top: pos.top, right: pos.right }}
            onClick={(event) => {
              // close the panel when a notification link is followed
              if ((event.target as HTMLElement).closest('a')) setOpen(false);
            }}
            className="fixed z-[60] max-h-[calc(100vh-110px)] w-[min(calc(100vw-1.5rem),380px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="relative">
              {/* Title shares the row with "Mark all as read" */}
              <h2 className="pointer-events-none absolute left-5 top-0 z-10 flex h-12 items-center text-lg font-bold tracking-tight text-slate-900">
                Notifications
              </h2>
              <NotificationList compact />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}