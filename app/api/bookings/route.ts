import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { createClient } from '@/lib/supabase_server';
import { createPayMongoCheckoutSession } from '@/lib/paymongo';
import { isUuid } from '@/lib/uuid';

const PAYMENT_SESSION_TTL_MS = 1000 * 30;

function dayDifferenceInDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id')?.trim();

  if (!bookingId) {
    return NextResponse.json({ error: 'booking_id is required.' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: booking, error: bookingError } = await adminSupabase
    .from('tbl_bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  const createdAt = booking.created_at ? new Date(booking.created_at).getTime() : null;
  const expiresAt = createdAt ? createdAt + PAYMENT_SESSION_TTL_MS : null;
  const isExpired = Boolean(createdAt && expiresAt && Date.now() > expiresAt && booking.status === 'pending_payment');

  if (isExpired) {
    await adminSupabase
      .from('tbl_bookings')
      .update({ status: 'expired' })
      .eq('booking_id', bookingId);

    await adminSupabase
      .from('tbl_payments')
      .update({ payment_status: 'expired' })
      .eq('booking_id', bookingId);
  }

  const { data: payment } = await adminSupabase
    .from('tbl_payments')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  return NextResponse.json({
    booking,
    payment,
    expires_at: expiresAt,
    expired: isExpired || booking.status === 'expired',
    payment_status: payment?.payment_status ?? null,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const unitId = String(body.unit_id ?? '').trim();
  const startDate = String(body.start_date ?? '').trim();
  const endDate = String(body.end_date ?? '').trim();
  const paymentMethod = String(body.payment_method ?? 'paymongo_checkout').trim() || 'paymongo_checkout';

  if (!unitId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'unit_id, start_date, and end_date are required.' },
      { status: 400 }
    );
  }

  if (!isUuid(unitId)) {
    return NextResponse.json(
      { error: 'This unit is currently unavailable for online booking.' },
      { status: 400 }
    );
  }

  const rentalDays = dayDifferenceInDays(startDate, endDate);

  if (!rentalDays) {
    return NextResponse.json(
      { error: 'end_date must be later than start_date.' },
      { status: 400 }
    );
  }

  const adminSupabase = createAdminClient();

  const { data: unit, error: unitError } = await adminSupabase
    .from('tbl_units')
    .select('unit_id, category, description, daily_rate, status')
    .eq('unit_id', unitId)
    .maybeSingle();

  if (unitError) {
    return NextResponse.json({ error: unitError.message }, { status: 500 });
  }

  if (!unit) {
    return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
  }

  if (unit.status && unit.status !== 'available') {
    return NextResponse.json(
      { error: 'Selected unit is not available for booking.' },
      { status: 409 }
    );
  }

  const dailyRate = Number(unit.daily_rate);

  if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
    return NextResponse.json(
      { error: 'Unit daily rate is invalid or missing.' },
      { status: 400 }
    );
  }

  const totalAmount = Number((dailyRate * rentalDays).toFixed(2));
  const bookingId = crypto.randomUUID();

  const { data: booking, error: bookingError } = await adminSupabase
    .from('tbl_bookings')
    .insert({
      booking_id: bookingId,
      user_id: user.id,
      unit_id: unitId,
      start_date: startDate,
      end_date: endDate,
      total_amount: totalAmount,
      status: 'pending_payment',
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: bookingError?.message ?? 'Unable to create booking record.' },
      { status: 500 }
    );
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const checkout = await createPayMongoCheckoutSession({
    amount: Math.round(totalAmount * 100),
    description: `${unit.category ?? 'Rental'} booking`,
    customerEmail: user.email ?? undefined,
    successUrl: `${appBaseUrl}/renter/booking?booking_id=${bookingId}&status=success`,
    cancelUrl: `${appBaseUrl}/renter/booking?booking_id=${bookingId}&status=cancelled`,
    metadata: {
      booking_id: bookingId,
      user_id: user.id,
      unit_id: unitId,
      amount: totalAmount,
    },
    referenceNumber: bookingId,
  });

  const paymentId = crypto.randomUUID();

  const { error: paymentError } = await adminSupabase.from('tbl_payments').insert({
    payment_id: paymentId,
    booking_id: bookingId,
    amount_paid: totalAmount,
    payment_method: paymentMethod,
    proof_of_payment_url: checkout.checkout_url ?? null,
    payment_status: 'pending',
    paid_at: null,
  });

  if (paymentError) {
    return NextResponse.json(
      { error: paymentError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    booking,
    payment: {
      payment_id: paymentId,
      payment_method: paymentMethod,
      payment_status: 'pending',
      proof_of_payment_url: checkout.checkout_url,
    },
    checkout_url: checkout.checkout_url,
    total_amount: totalAmount,
    rental_days: rentalDays,
    daily_rate: dailyRate,
  });
}
