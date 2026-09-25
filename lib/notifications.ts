export type NotificationType = 'booking' | 'kyc' | 'payment' | 'system' | string;

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  related_type: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
};

export function notificationHref(notification: Notification) {
  const type = notification.related_type ?? notification.reference_type ?? notification.type;
  const id = notification.related_id ?? notification.reference_id;

  if (!id) {
    return '/notifications';
  }

  if (type.toLowerCase().includes('booking')) {
    return `/renter/my-rentals/${encodeURIComponent(id)}`;
  }
  if (type.toLowerCase().includes('kyc') || type.toLowerCase().includes('verification')) {
    return '/renter/profile';
  }
  if (type.toLowerCase().includes('payment')) {
    return `/renter/my-rentals/${encodeURIComponent(id)}`;
  }

  return '/notifications';
}

export function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
