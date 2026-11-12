import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { isUuid } from '@/lib/uuid';
import { BOOKING_STATUS } from '@/lib/booking-status';
import { extractPayMongoPaymentIdFromSession } from '@/lib/paymongo';
import { notifyRenterRefund } from '@/lib/notification';

export const runtime = 'nodejs';

const TOLERANCE_SECONDS = 5 * 60;

function verifySignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;

  const parts: Record<string, string> = {};
  for (const piece of header.split(',')) {
    const i = piece.indexOf('=');
    if (i > 0) parts[piece.slice(0, i).trim()] = piece.slice(i + 1).trim();
  }

  const timestamp = parts.t;
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  return [parts.te, parts.li].some((sig) => {
    if (!sig || sig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  });
}

export async function POST(request: Request) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'PAYMONGO_WEBHOOK_SECRET is not configured.' }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('paymongo-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const eventType: string = event?.data?.attributes?.type ?? '';
  const admin = createAdminClient();

  // 1. Handle PayMongo refund status updates
  if (eventType === 'payment.refund.updated' || eventType === 'payment.refunded') {
    const refundResource = event?.data?.attributes?.data;
    const refundId: string | undefined = refundResource?.id;
    const refundStatus: string = (refundResource?.attributes?.status ?? '').toLowerCase();
    const metadataBookingId: string | undefined = refundResource?.attributes?.metadata?.booking_id;

    if (refundId || (metadataBookingId && isUuid(metadataBookingId))) {
      const now = new Date().toISOString();
      const updatePayload: Record<string, unknown> = {};

      if (refundStatus === 'succeeded') {
        updatePayload.payment_status = 'refunded';
        updatePayload.refund_status = 'refunded';
        updatePayload.refunded_at = now;
        updatePayload.refund_error = null;
      } else if (refundStatus === 'failed') {
        updatePayload.refund_status = 'failed';
        updatePayload.refund_error =
          refundResource?.attributes?.failure_message || 'PayMongo marked the refund as failed.';
      }

      if (Object.keys(updatePayload).length > 0) {
        let query = admin.from('tbl_payments').update(updatePayload);
        query = refundId
          ? query.eq('refund_reference', refundId)
          : query.eq('booking_id', metadataBookingId!);
        const { data: updatedPayments } = await query.select('booking_id, refund_amount');

        const targetBookingId =
          updatedPayments?.[0]?.booking_id ??
          (metadataBookingId && isUuid(metadataBookingId) ? metadataBookingId : null);

        if (refundStatus === 'succeeded' && targetBookingId) {
          const amountPesos =
            Number(updatedPayments?.[0]?.refund_amount) ||
            Number(refundResource?.attributes?.amount ?? 0) / 100;

          await notifyRenterRefund({
            bookingId: targetBookingId,
            refundAmount: amountPesos,
            refundReference: refundId,
            status: 'refunded',
          });
        }
      }
    }

    return NextResponse.json({ received: true, event: eventType });
  }

  // 2. Ignore everything except a paid checkout session
  if (eventType !== 'checkout_session.payment.paid') {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.attributes.data;
  const sessionId: string | undefined = session?.id;
  const referenceNumber: string | undefined = session?.attributes?.reference_number;
  const providerPaymentId = extractPayMongoPaymentIdFromSession(session);

  let bookingId: string | null = null;
  if (sessionId) {
    const { data: payment } = await admin
      .from('tbl_payments')
      .select('booking_id')
      .eq('provider_reference', sessionId)
      .maybeSingle();
    bookingId = payment?.booking_id ?? null;
  }
  if (!bookingId && referenceNumber && isUuid(referenceNumber)) {
    bookingId = referenceNumber;
  }
  if (!bookingId) {
    console.warn('[PAYMONGO WEBHOOK] No booking found for session', sessionId);
    return NextResponse.json({ received: true, matched: false });
  }

  const { data: updated, error: bookingError } = await admin
    .from('tbl_bookings')
    .update({ status: BOOKING_STATUS.AWAITING_REVIEW })
    .eq('booking_id', bookingId)
    .eq('status', BOOKING_STATUS.PENDING_PAYMENT)
    .select('booking_id');

  if (bookingError) {
    console.error('[PAYMONGO WEBHOOK] Booking update failed:', bookingError);
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    console.warn('[PAYMONGO WEBHOOK] Paid, but booking was not pending_payment:', bookingId);
  }

  const paymentUpdate: Record<string, unknown> = {
    payment_status: 'paid',
    paid_at: new Date().toISOString(),
  };
  if (providerPaymentId) {
    paymentUpdate.provider_payment_id = providerPaymentId;
  }

  const { error: paymentError } = await admin
    .from('tbl_payments')
    .update(paymentUpdate)
    .eq('booking_id', bookingId);

  if (paymentError) {
    console.error('[PAYMONGO WEBHOOK] Payment update failed:', paymentError);
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({ received: true, booking_id: bookingId });
}