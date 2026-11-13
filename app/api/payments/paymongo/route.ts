import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { createClient } from '@/lib/supabase_server';
import { createPayMongoCheckoutSession } from '@/lib/paymongo';
import { isUuid } from '@/lib/uuid';
import { BOOKING_STATUS } from '@/lib/booking-status';

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const bookingId = String(body.booking_id ?? '').trim();

  if (!isUuid(bookingId)) {
    return NextResponse.json({ error: 'A valid booking_id is required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking, error: bookingError } = await admin
    .from('tbl_bookings')
    .select('booking_id, total_amount, status')
    .eq('booking_id', bookingId)
    .eq('user_id', user.id) // owner only
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }
  if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) {
    return NextResponse.json({ error: 'This booking is not awaiting payment.' }, { status: 409 });
  }

  const total = Number(booking.total_amount);
  if (!Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: 'Booking total is invalid.' }, { status: 400 });
  }

  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  try {
    const checkout = await createPayMongoCheckoutSession({
      amount: Math.round(total * 100),
      description: 'Rental payment',
      customerEmail: user.email ?? undefined,
      successUrl: `${appBaseUrl}/renter/booking?booking_id=${encodeURIComponent(bookingId)}&status=success`,
      cancelUrl: `${appBaseUrl}/renter/booking?booking_id=${encodeURIComponent(bookingId)}&status=cancelled`,
      metadata: { booking_id: bookingId },
      referenceNumber: bookingId,
    });

    return NextResponse.json({
      checkout_id: checkout.id,
      checkout_url: checkout.checkout_url,
      status: checkout.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create PayMongo checkout session.' },
      { status: 500 }
    );
  }
}