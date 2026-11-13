// Client-safe helpers and types (no server imports here).

export type NotificationType =
  | 'booking_submitted'
  | 'payment_confirmed'
  | 'booking_review_needed'
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_expired'
  | 'rental_completed'
  | 'refund_issued'
  | 'verification_verified'
  | 'verification_rejected'
  | string;

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  link: string | null;
  created_at: string;
};

export function notificationHref(n: Notification): string {
  const details = `${n.type} ${n.title} ${n.message}`.toLowerCase();

  if (details.includes('verification')) return '/renter/profile';
  if (/\brefund(?:ed|ing|s)?\b/.test(details)) {
    return '/renter/my-rentals?filter=cancelled';
  }
  if (/\bcancel(?:led|ed)?\b|\bcancellation\b/.test(details)) {
    return '/renter/my-rentals?filter=cancelled';
  }
  if (
    n.type === 'payment_confirmed' ||
    n.type === 'payment_received' ||
    /\bpayment (?:was )?received\b/.test(details) ||
    /\bapprov(?:ed|al)\b/.test(details)
  ) {
    return '/renter/my-rentals?filter=approved';
  }
  if (n.link) return n.link;
  if (n.type === 'booking_review_needed') return '/admin/bookings';
  return '/renter/my-rentals';
}

export function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}