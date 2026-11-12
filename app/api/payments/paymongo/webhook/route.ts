import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { isUuid } from '@/lib/uuid';
import { BOOKING_STATUS } from '@/lib/booking-status';

export const runtime = 'nodejs';

const TOLERANCE_SECONDS = 5 * 60;

// Header looks like: t=<unix>,te=<test signature>,li=<live signature>
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

  // Ignore everything except a paid checkout session (still 200 so PayMongo doesn't retry).
  if (event?.data?.attributes?.type !== 'checkout_session.payment.paid') {
    return NextResponse.json({ received: true, ignored: true });
  }

  const session = event.data.attributes.data;
  const sessionId: string | undefined = session?.id;
  const referenceNumber: string | undefined = session?.attributes?.reference_number;

  const admin = createAdminClient();

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
    // A non-2xx response makes PayMongo retry.
    console.error('[PAYMONGO WEBHOOK] Booking update failed:', bookingError);
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    console.warn('[PAYMONGO WEBHOOK] Paid, but booking was not pending_payment:', bookingId);
  }

  const { error: paymentError } = await admin
    .from('tbl_payments')
    .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
    .eq('booking_id', bookingId);

  if (paymentError) {
    console.error('[PAYMONGO WEBHOOK] Payment update failed:', paymentError);
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({ received: true, booking_id: bookingId });
}