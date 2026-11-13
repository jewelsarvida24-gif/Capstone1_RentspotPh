'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import NotificationItem from './NotificationItem';
import type { Notification } from '@/lib/notifications';

export default function NotificationList({
  compact = false,
  onViewAll,
  onNotificationClick,
}: {
  compact?: boolean;
  onViewAll?: () => void;
  onNotificationClick?: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const loadingMoreRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (pageToLoad = 1, silent = false, append = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/notifications?page=${pageToLoad}&limit=${compact ? 5 : 20}`, { cache: 'no-store' });
      const payload = (await response.json()) as { notifications?: Notification[]; hasMore?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Could not load notifications.');
      const result = payload as { notifications: Notification[]; hasMore: boolean };
      setNotifications((items) => {
        if (!append) return result.notifications;
        const merged = new Map(items.map((item) => [item.id, item]));
        for (const item of result.notifications) merged.set(item.id, item);
        return [...merged.values()].sort(
          (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
        );
      });
      setHasMore(result.hasMore);
      if (!append || pageToLoad > 1) setPage(pageToLoad);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
      if (pageToLoad > 1) {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
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

    useEffect(() => {
      const handler = () => void load(1, true, true);
    window.addEventListener('notifications-new', handler);
    return () => window.removeEventListener('notifications-new', handler);
  }, [load]);

    useEffect(() => {
      const refresh = () => {
        if (document.visibilityState === 'visible') void load(1, true, true);
      };
      const interval = window.setInterval(refresh, 15_000);
      window.addEventListener('focus', refresh);
      document.addEventListener('visibilitychange', refresh);
      return () => {
        window.clearInterval(interval);
        window.removeEventListener('focus', refresh);
        document.removeEventListener('visibilitychange', refresh);
      };
    }, [load]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    void load(page + 1, true, true);
  }, [hasMore, load, page]);

  useEffect(() => {
    const element = listRef.current;
    if (
      !compact &&
      !loading &&
      !loadingMore &&
      hasMore &&
      element &&
      element.scrollHeight <= element.clientHeight
    ) {
      loadMore();
    }
  }, [compact, hasMore, loadMore, loading, loadingMore, notifications.length]);

  const handleScroll = () => {
    const element = listRef.current;
    if (element && element.scrollHeight - element.scrollTop - element.clientHeight < 100) {
      loadMore();
    }
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

  if (loading && notifications.length === 0) return <div className="p-10 text-center text-sm text-slate-500">Loading notifications...</div>;
  if (error) return <div className="p-10 text-center text-sm text-red-600">{error}</div>;
  if (notifications.length === 0) return <div className="p-14 text-center text-sm text-slate-500">You&apos;re all caught up. No notifications yet.</div>;

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        {!compact && <h2 className="font-semibold text-slate-900">Notifications</h2>}
        <button type="button" onClick={() => void markAllRead()} className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-800">Mark all as read</button>
      </div>
      <div
        ref={listRef}
        onScroll={compact ? undefined : handleScroll}
        className={compact ? '' : 'max-h-[calc(100vh-170px)] overflow-y-auto'}
      >
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={(item) => void markRead(item)}
            onClick={onNotificationClick}
          />
        ))}
        {loadingMore && <div className="p-3 text-center text-xs text-slate-500">Loading older notifications...</div>}
      </div>
      {compact && hasMore && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="block w-full p-3 text-center text-sm font-semibold text-blue-600 hover:bg-slate-50"
        >
          View all notifications
        </button>
      )}
    </div>
  );
}
