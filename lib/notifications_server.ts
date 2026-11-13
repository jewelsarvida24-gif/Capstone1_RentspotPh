// SERVER ONLY. Uses the service-role client, which bypasses RLS.
// Never import this file from a 'use client' component.
//
// ASSUMPTION: your admin helper exports createAdminClient from '@/lib/supabase_admin'.
// Change the import below to match your project.
import { createAdminClient } from '@/lib/supabase_admin';
import { notify, pendingReviewMessage } from '@/lib/notify';
import type { NotificationType } from '@/lib/notifications';

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  bookingId?: string | null;
};

export async function notifyUsers(inputs: NotifyInput[]): Promise<boolean> {
  if (inputs.length === 0) return true;
  const results = await Promise.all(
    inputs.map((input) => notify(input.userId, input.message, input)),
  );
  return results.every(Boolean);
}

export const notifyUser = (input: NotifyInput) =>
  notify(input.userId, input.message, input);

/** Active admins/sysadmins who also exist in tbl_users (notifications.user_id FK). */
export async function getAdminIds(): Promise<string[]> {
  try {
    const admin = await createAdminClient();
    const { data: staff } = await admin
      .from('staff_roles')
      .select('user_id')
      .in('role', ['admin', 'sysadmin'])
      .eq('status', 'active');
    const ids = (staff ?? []).map((s) => s.user_id as string);
    if (ids.length === 0) return [];
    const { data: users } = await admin.from('tbl_users').select('user_id').in('user_id', ids);
    return (users ?? []).map((u) => u.user_id as string);
  } catch (error) {
    console.error('Failed to load admins:', error);
    return [];
  }
}

type BookingLike = {
  booking_id: string;
  user_id: string;
  status: string;
  rejection_reason?: string | null;
};

/**
 * Call AFTER a booking status change has been saved successfully.
 * Repeated calls for the same booking, recipient, and type are ignored.
 * Adjust the link paths to your real routes.
 */
export async function notifyBookingStatusChange(b: BookingLike): Promise<boolean> {
  const renterLink = '/renter/my-rentals';
  const base = { userId: b.user_id, bookingId: b.booking_id, link: renterLink };

  switch (b.status) {
    case 'pending_payment':
      return notifyUser({
        ...base,
        type: 'booking_submitted',
        title: 'Booking submitted',
        message: 'Your booking was created. Complete payment to secure it.',
      });

    case 'paid_awaiting_verification': {
      const renterNotified = await notifyUser({
        ...base,
        type: 'payment_confirmed',
        title: 'Payment received',
        message: pendingReviewMessage('We received your payment. Your booking is waiting for admin review.'),
      });
      const adminIds = await getAdminIds();
      const adminsNotified = await notifyUsers(
        adminIds.map((adminId) => ({
          userId: adminId,
          bookingId: b.booking_id,
          type: 'booking_review_needed',
          title: 'New booking awaiting review',
          message: pendingReviewMessage('A paid booking needs your review.'),
          link: '/admin/bookings',
        })),
      );
      return renterNotified && adminsNotified;
    }

    case 'approved':
      return notifyUser({
        ...base,
        type: 'booking_approved',
        title: 'Booking approved',
        message: 'Good news! Your booking has been approved.',
      });

    case 'rejected':
      return notifyUser({
        ...base,
        type: 'booking_rejected',
        title: 'Booking rejected',
        message: b.rejection_reason
          ? `Your booking was rejected. Reason: ${b.rejection_reason}`
          : 'Your booking was rejected.',
      });

    case 'confirmed':
      return notifyUser({
        ...base,
        type: 'booking_confirmed',
        title: 'Booking confirmed',
        message: 'Your booking is confirmed. See you at pickup!',
      });

    case 'cancelled':
      return notifyUser({
        ...base,
        type: 'booking_cancelled',
        title: 'Booking cancelled',
        message: 'Your booking has been cancelled.',
      });

    case 'expired':
      return notifyUser({
        ...base,
        type: 'booking_expired',
        title: 'Booking expired',
        message: 'Your booking expired because payment was not completed in time.',
      });

    case 'completed':
      return notifyUser({
        ...base,
        type: 'rental_completed',
        title: 'Rental completed',
        message: 'Your rental has been marked as returned and completed. Thank you for renting with us.',
      });

    default:
      return false;
  }
}