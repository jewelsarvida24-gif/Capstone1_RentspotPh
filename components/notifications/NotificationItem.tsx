'use client';

import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { formatNotificationTime, notificationHref, type Notification } from '@/lib/notifications';

export default function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead?: (notification: Notification) => void;
}) {
  const href = notificationHref(notification);

  return (
    <Link
      href={href}
      onClick={() => onRead?.(notification)}
      className={`block border-b border-slate-100 px-4 py-4 transition hover:bg-blue-50/50 ${notification.is_read ? 'bg-white' : 'bg-blue-50/40'}`}
    >
      <div className="flex gap-3">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${notification.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
          {notification.is_read ? <Check size={16} /> : <Bell size={16} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className={`text-sm ${notification.is_read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{notification.title}</span>
            {!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />}
          </span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">{notification.message}</span>
          <span className="mt-2 block text-xs text-slate-400">{formatNotificationTime(notification.created_at)}</span>
        </span>
      </div>
    </Link>
  );
}
