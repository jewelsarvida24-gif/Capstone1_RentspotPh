'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import NotificationItem from './NotificationItem';
import type { Notification } from '@/lib/notifications';

export default function NotificationList({ compact = false }: { compact?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/notifications?page=${page}&limit=${compact ? 5 : 20}`, { cache: 'no-store' });
      const payload = (await response.json()) as { notifications?: Notification[]; hasMore?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Could not load notifications.');
      const result = payload as { notifications: Notification[]; hasMore: boolean };
      setNotifications(result.notifications);
      setHasMore(result.hasMore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [compact]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (notification: Notification) => {
    if (notification.is_read) return;
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    const response = await fetch(`/api/notifications/${encodeURIComponent(notification.id)}/read`, { method: 'PATCH' });
    if (!response.ok) {
      setNotifications((items) => items.map((item) => item.id === notification.id ? notification : item));
      setError('Could not mark the notification as read.');
      return;
    }
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const markAllRead = async () => {
    const response = await fetch('/api/notifications/read-all', { method: 'PATCH' });
    if (!response.ok) {
      setError('Could not mark notifications as read.');
      return;
    }
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    window.dispatchEvent(new Event('notifications-updated'));
  };

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Loading notifications...</div>;
  if (error) return <div className="p-10 text-center text-sm text-red-600">{error}</div>;
  if (notifications.length === 0) return <div className="p-14 text-center text-sm text-slate-500">You&apos;re all caught up. No notifications yet.</div>;

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        {!compact && <h2 className="font-semibold text-slate-900">Notifications</h2>}
        <button type="button" onClick={() => void markAllRead()} className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-800">Mark all as read</button>
      </div>
      <div>{notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} onRead={(item) => void markRead(item)} />)}</div>
      {compact && hasMore && <Link href="/notifications" className="block p-3 text-center text-sm font-semibold text-blue-600 hover:bg-slate-50">View all notifications</Link>}
    </div>
  );
}
