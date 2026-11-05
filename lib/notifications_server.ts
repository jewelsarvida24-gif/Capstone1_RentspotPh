// SERVER ONLY. Uses the service-role client, which bypasses RLS.
// Never import this file from a 'use client' component.
//
// ASSUMPTION: your admin helper exports createAdminClient from '@/lib/supabase_admin'.
// Change the import below to match your project.
import { createAdminClient } from '@/lib/supabase_admin';
import type { NotificationType } from '@/lib/notifications';

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  bookingId?: string | null;
  /** Unique per event+recipient. A repeat insert with the same key is ignored. */
  eventKey?: string;
};

/**
 * Creates notification rows. Never throws: a notification failure must not
 * undo a booking or payment that already succeeded. Returns false on failure.
 */
export async function notifyUsers(inputs: NotifyInput[]): Promise<boolean> {
  if (inputs.length === 0) return true;
  try {
    const admin = await createAdminClient();
    const rows = inputs.map((i) => ({
      user_id: i.userId,
      booking_id: i.bookingId ?? null,
      subject: i.title,
      message: i.message,
      type: i.type,
      link: i.link ?? null,
      event_key: i.eventKey ?? null,
    }));
    const { error } = await admin
      .from('tbl_notifications')
      .upsert(rows, { onConflict: 'event_key', ignoreDuplicates: true });
    if (error) {
      console.error('Failed to create notifications:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to create notifications:', error);
    return false;
  }
}

export const notifyUser = (input: NotifyInput) => notifyUsers([input]);

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
 * Safe to call twice (webhook retries): event keys prevent duplicates.
 * Adjust the link paths to your real routes.
 */
export async function notifyBookingStatusChange(b: BookingLike): Promise<void> {
  const renterLink = '/my-rentals';
  const key = `booking:${b.booking_id}:${b.status}`;
  const base = { userId: b.user_id, bookingId: b.booking_id, link: renterLink, eventKey: key };

  switch (b.status) {
    case 'pending_payment':
      await notifyUser({
        ...base,
        type: 'booking_submitted',
        title: 'Booking submitted',
        message: 'Your booking was created. Complete payment to secure it.',
      });
      break;

    case 'paid_awaiting_verification': {
      await notifyUser({
        ...base,
        type: 'payment_confirmed',
        title: 'Payment received',
        message: 'We received your payment. Your booking is now waiting for admin review.',
      });
      const adminIds = await getAdminIds();
      await notifyUsers(
        adminIds.map((adminId) => ({
          userId: adminId,
          bookingId: b.booking_id,
          type: 'booking_review_needed',
          title: 'New booking awaiting review',
          message: 'A paid booking needs your review.',
          link: '/admin/bookings',
          eventKey: `${key}:admin:${adminId}`,
        })),
      );
      break;
    }

    case 'approved':
      await notifyUser({
        ...base,
        type: 'booking_approved',
        title: 'Booking approved',
        message: 'Good news! Your booking has been approved.',
      });
      break;

    case 'rejected':
      await notifyUser({
        ...base,
        type: 'booking_rejected',
        title: 'Booking rejected',
        message: b.rejection_reason
          ? `Your booking was rejected. Reason: ${b.rejection_reason}`
          : 'Your booking was rejected.',
      });
      break;

    case 'confirmed':
      await notifyUser({
        ...base,
        type: 'booking_confirmed',
        title: 'Booking confirmed',
        message: 'Your booking is confirmed. See you at pickup!',
      });
      break;

    case 'cancelled':
      await notifyUser({
        ...base,
        type: 'booking_cancelled',
        title: 'Booking cancelled',
        message: 'Your booking has been cancelled.',
      });
      break;

    case 'expired':
      await notifyUser({
        ...base,
        type: 'booking_expired',
        title: 'Booking expired',
        message: 'Your booking expired because payment was not completed in time.',
      });
      break;
  }
}