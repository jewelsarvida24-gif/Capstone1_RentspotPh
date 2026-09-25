'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import NotificationList from './NotificationList';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const loadCount = async () => {
      const response = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
      if (!active || !response.ok) return;
      const result = (await response.json()) as { count: number };
      setCount(result.count);
    };
    void loadCount();
    const handler = () => void loadCount();
    window.addEventListener('notifications-updated', handler);
    return () => {
      active = false;
      window.removeEventListener('notifications-updated', handler);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Notifications" aria-expanded={open} className="relative rounded-full p-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
        <Bell size={20} />
        {count > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-5 text-white">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && <div className="absolute right-0 top-full z-50 mt-3 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><NotificationList compact /></div>}
    </div>
  );
}
