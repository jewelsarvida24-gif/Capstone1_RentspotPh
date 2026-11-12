// SERVER ONLY. Never import this file from a 'use client' component.
import 'server-only';
import { createAdminClient } from '@/lib/supabase_admin';
import type { NotificationType } from '@/lib/notifications';

export type NotifyOptions = {
  title?: string;
  type?: NotificationType;
  link?: string;
  bookingId?: string | null;
};

export type ReviewBatchLabel = '11 AM' | '11 PM';

export const REVIEW_BATCH_NOTE =
  'Requests are reviewed in batches at 11 AM and 11 PM (Philippine time).';

export function getNextReviewBatchLabel(now: Date = new Date()): ReviewBatchLabel {
  const manilaHour = (now.getUTCHours() + 8) % 24;
  return manilaHour >= 11 && manilaHour < 23 ? '11 PM' : '11 AM';
}

export function pendingReviewMessage(subject: string, now?: Date): string {
  return `${subject} It will be reviewed in the next batch at ${getNextReviewBatchLabel(now)} (Philippine time). ${REVIEW_BATCH_NOTE}`;
}

export async function notify(
  userId: string,
  message: string,
  options: NotifyOptions = {},
): Promise<boolean> {
  if (!userId || !message.trim()) {
    console.error('notify() requires a user ID and a non-empty message.');
    return false;
  }

  try {
    const admin = createAdminClient();
    if (options.bookingId) {
      const { data: existing, error: lookupError } = await admin
        .from('tbl_notifications')
        .select('notification_id')
        .eq('user_id', userId)
        .eq('booking_id', options.bookingId)
        .eq('type', options.type ?? 'general')
        .limit(1);
      if (lookupError) {
        console.error('Failed to check for existing notification:', lookupError);
        return false;
      }
      if (existing?.length) return true;
    }

    const { error } = await admin.from('tbl_notifications').insert({
      user_id: userId,
      booking_id: options.bookingId ?? null,
      subject: options.title ?? 'Notification',
      message: message.trim(),
      type: options.type ?? 'general',
      link: options.link ?? null,
    });
    if (error) {
      console.error('Failed to create notification:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('notify() failed:', error);
    return false;
  }
}
