import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { createClient } from '@/lib/supabase_server';
import { createPayMongoCheckoutSession } from '@/lib/paymongo';
import { isUuid } from '@/lib/uuid';

const PAYMENT_SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes for PayMongo checkout.

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getTodayInManila() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function dayDifferenceInDays(startDate: string, endDate: string) {
  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) return null;

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
}

async function expirePendingBooking(adminSupabase: ReturnType<typeof createAdminClient>, booking: { booking_id: string; created_at?: string | null; status?: string | null }) {
  const createdAt = booking.created_at ? new Date(booking.created_at).getTime() : null;
  const expiresAt = createdAt ? createdAt + PAYMENT_SESSION_TTL_MS : null;
  const isExpired = Boolean(
    createdAt &&
    expiresAt &&
    Date.now() > expiresAt &&
    booking.status === 'pending_payment'
  );

  if (isExpired) {
    await adminSupabase
      .from('tbl_bookings')
      .update({ status: 'expired' })
      .eq('booking_id', booking.booking_id);

    await adminSupabase
      .from('tbl_payments')
      .update({ payment_status: 'expired' })
      .eq('booking_id', booking.booking_id);
  }

  return { expiresAt, isExpired };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id')?.trim();
  const adminSupabase = createAdminClient();

  // The caller must be signed in, and a booking ID may only access that renter's own booking.
  if (!bookingId) {
    return NextResponse.json(
      { error: 'booking_id is required.' },
      { status: 400 }
    );
  }

  const { data: booking, error: bookingError } = await adminSupabase
    .from('tbl_bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  const { expiresAt, isExpired } = await expirePendingBooking(adminSupabase, booking);

  const { data: refreshedBooking, error: refreshedBookingError } = isExpired
    ? await adminSupabase.from('tbl_bookings').select('*').eq('booking_id', bookingId).eq('user_id', user.id).single()
    : { data: booking, error: null };

  if (refreshedBookingError) {
    return NextResponse.json({ error: refreshedBookingError.message }, { status: 500 });
  }

  const { data: payment, error: paymentError } = await adminSupabase
    .from('tbl_payments')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({
    booking: refreshedBooking,
    payment,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    expired: isExpired || refreshedBooking?.status === 'expired',
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

  const { data: kycSubmission, error: kycError } = await supabase
    .from('tbl_kyc')
    .select('admin_status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (kycError || kycSubmission?.admin_status?.toLowerCase() !== 'approved') {
    return NextResponse.json(
      {
        error:
          'Identity verification is required before booking. Complete verification from your profile and wait for admin approval.',
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const unitId = String(body.unit_id ?? '').trim();
  const startDate = String(body.start_date ?? '').trim();
  const endDate = String(body.end_date ?? '').trim();
  const pickupDate = String(body.pickup_date ?? '').trim();
  const paymentMethod = String(body.payment_method ?? 'paymongo_checkout').trim() || 'paymongo_checkout';
  const agreementAccepted = body.agreement_accepted === true;
  const signatureData = typeof body.signature_data === 'string' ? body.signature_data : '';

  if (!agreementAccepted || !signatureData.startsWith('data:image/png;base64,') || signatureData.length > 1_500_000) {
    return NextResponse.json(
      { error: 'Review the Rental Agreement, accept the terms, and sign before proceeding to payment.' },
      { status: 400 }
    );
  }

  if (!unitId || !startDate || !endDate || !pickupDate) {
    return NextResponse.json(
      { error: 'unit_id, start_date, end_date, and pickup_date are required.' },
      { status: 400 }
    );
  }

  if (!isUuid(unitId)) {
    return NextResponse.json(
      { error: 'This unit is currently unavailable for online booking.' },
      { status: 400 }
    );
  }

  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate) || !isValidDateOnly(pickupDate)) {
    return NextResponse.json(
      { error: 'Please provide valid rental and pickup dates.' },
      { status: 400 }
    );
  }

  // Enforce the no-same-day rule on the server, using Philippine local time.
  if (startDate <= getTodayInManila()) {
    return NextResponse.json(
      { error: 'Same-day bookings are not allowed. Please select tomorrow or a later date.' },
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

  if (pickupDate < startDate || pickupDate > endDate) {
    return NextResponse.json(
      { error: 'pickup_date must be a valid date between start_date and end_date.' },
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
      pickup_date: pickupDate,
      total_amount: totalAmount,
      status: 'pending_payment',
      rental_agreement_accepted: true,
      rental_agreement_signed_at: new Date().toISOString(),
      rental_agreement_signature_data: signatureData,
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

  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  let checkout: Awaited<ReturnType<typeof createPayMongoCheckoutSession>>;

  try {
    checkout = await createPayMongoCheckoutSession({
      amount: Math.round(totalAmount * 100),
      description: `${unit.category ?? 'Rental'} booking`,
      customerEmail: user.email ?? undefined,
      successUrl: `${appBaseUrl}/renter/booking?booking_id=${encodeURIComponent(bookingId)}&status=success`,
      cancelUrl: `${appBaseUrl}/renter/booking?booking_id=${encodeURIComponent(bookingId)}&status=cancelled`,
      metadata: {
        booking_id: bookingId,
        user_id: user.id,
        unit_id: unitId,
        amount: totalAmount,
      },
      referenceNumber: bookingId,
    });
  } catch (checkoutError) {
    await adminSupabase.from('tbl_bookings').update({ status: 'payment_setup_failed' }).eq('booking_id', bookingId);
    return NextResponse.json(
      { error: checkoutError instanceof Error ? checkoutError.message : 'Unable to create PayMongo checkout session.' },
      { status: 502 }
    );
  }

  if (!checkout.checkout_url) {
    await adminSupabase.from('tbl_bookings').update({ status: 'payment_setup_failed' }).eq('booking_id', bookingId);
    return NextResponse.json(
      { error: 'PayMongo did not return a checkout URL.' },
      { status: 502 }
    );
  }

  const paymentId = crypto.randomUUID();
  const { error: paymentError } = await adminSupabase.from('tbl_payments').insert({
    payment_id: paymentId,
    booking_id: bookingId,
    amount_paid: totalAmount,
    payment_method: paymentMethod,
    proof_of_payment_url: checkout.checkout_url,
    provider_reference: checkout.id,
    payment_status: 'pending',
    paid_at: null,
  });

  if (paymentError) {
    await adminSupabase.from('tbl_bookings').update({ status: 'payment_setup_failed' }).eq('booking_id', bookingId);
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
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


// PATCH /api/bookings — cancel a pending checkout when PayMongo returns via the cancel URL.
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  const bookingId = typeof payload.booking_id === 'string' ? payload.booking_id.trim() : '';
  if (!isUuid(bookingId) || payload.action !== 'cancel') {
    return NextResponse.json({ error: 'A valid booking_id and cancel action are required.' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: booking, error: lookupError } = await adminSupabase
    .from('tbl_bookings')
    .select('booking_id, user_id, status')
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (booking.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Only a booking awaiting payment can be cancelled this way.' }, { status: 409 });
  }

  const { error: updateBookingError } = await adminSupabase
    .from('tbl_bookings')
    .update({ status: 'cancelled' })
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .eq('status', 'pending_payment');
  if (updateBookingError) return NextResponse.json({ error: updateBookingError.message }, { status: 500 });

  const { error: updatePaymentError } = await adminSupabase
    .from('tbl_payments')
    .update({ payment_status: 'cancelled' })
    .eq('booking_id', bookingId)
    .eq('payment_status', 'pending');
  if (updatePaymentError) return NextResponse.json({ error: updatePaymentError.message }, { status: 500 });

  return NextResponse.json({ success: true, booking_id: bookingId, status: 'cancelled', payment_status: 'cancelled' });
}
