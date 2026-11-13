import 'server-only';
import { createAdminClient } from '@/lib/supabase_admin';

export async function notifyRenterRefund(params: {
  bookingId: string;
  refundAmount: number;
  refundReference?: string | null;
  status: 'processing' | 'refunded';
}) {
  const admin = createAdminClient();

  const { data: booking, error: bookingErr } = await admin
    .from('tbl_bookings')
    .select('booking_id, user_id')
    .eq('booking_id', params.bookingId)
    .maybeSingle();

  if (bookingErr || !booking?.user_id) {
    console.error('[NOTIFY REFUND] Booking lookup failed:', bookingErr?.message);
    return;
  }

  const { data: renter } = await admin
    .from('tbl_users')
    .select('first_name, email')
    .eq('user_id', booking.user_id)
    .maybeSingle();

  const shortRef = `RSP ${params.bookingId.slice(0, 6).toUpperCase()}`;
  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(params.refundAmount);

  const isCompleted = params.status === 'refunded';
  const notifType = isCompleted ? 'payment_refunded' : 'payment_refund_initiated';
  const eventKey = isCompleted
    ? `booking:${params.bookingId}:refunded`
    : `booking:${params.bookingId}:refund_initiated`;

  const { data: existing } = await admin
    .from('tbl_notifications')
    .select('notification_id')
    .eq('event_key', eventKey)
    .maybeSingle();

  if (existing) return;

  const subject = isCompleted
    ? `Refund completed (${formattedAmount})`
    : `Refund initiated (${formattedAmount})`;

  const message = isCompleted
    ? `Your refund of ${formattedAmount} for booking ${shortRef} has been completed via PayMongo.`
    : `An admin approved your refund of ${formattedAmount} for booking ${shortRef}. PayMongo is now processing it.`;

  const { error: insertError } = await admin.from('tbl_notifications').insert({
    user_id: booking.user_id,
    booking_id: params.bookingId,
    subject,
    message,
    type: notifType,
    is_read: false,
    sent_at: new Date().toISOString(),
    link: '/renter/my-rentals?filter=cancelled',
    event_key: eventKey,
  });

  if (insertError) {
    console.error('[NOTIFY REFUND] Insert into tbl_notifications failed:', insertError.message);
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || 'RentSpotPH <onboarding@resend.dev>';

  if (resendKey && renter?.email) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: renter.email,
        subject: `${subject} — ${shortRef}`,
        html: `
          <div style="font-family: sans-serif; color: #102A4A; max-width: 520px;">
            <h2>${subject}</h2>
            <p>Hi ${renter.first_name || 'there'},</p>
            <p>${message}</p>
            ${params.refundReference ? `<p><strong>PayMongo Refund Ref:</strong> ${params.refundReference}</p>` : ''}
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/renter/my-rentals?filter=cancelled">View your booking in My Rentals</a></p>
          </div>
        `,
      }),
    }).catch(() => {});
  }
}