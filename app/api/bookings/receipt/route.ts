import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { retrievePayMongoCheckoutSession } from '@/lib/paymongo';
import { calculateBooking } from '@/lib/pricing';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id')?.trim();

  if (!bookingId) {
    return NextResponse.json({ error: 'booking_id is required.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: booking, error: bookingError } = await supabase
    .from('tbl_bookings')
    .select('booking_id, unit_id, start_date, end_date, pickup_date, rental_fee, security_fee, total_amount, status')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  const [{ data: unit, error: unitError }, { data: payment, error: paymentError }] = await Promise.all([
    supabase
      .from('tbl_units')
      .select('category, unit_name, daily_rate')
      .eq('unit_id', booking.unit_id)
      .maybeSingle(),
    supabase
      .from('tbl_payments')
      .select('payment_method, payment_status, provider_reference')
      .eq('booking_id', booking.booking_id)
      .maybeSingle(),
  ]);

  if (unitError || paymentError) {
    return NextResponse.json(
      { error: unitError?.message ?? paymentError?.message ?? 'Unable to load receipt data.' },
      { status: 500 }
    );
  }

  let bookingStatus = booking.status;

  // Verify with PayMongo before moving to admin review.
  if (bookingStatus === 'pending_payment' && payment?.provider_reference) {
    try {
      const { isPaid, raw } = await retrievePayMongoCheckoutSession(payment.provider_reference);
      console.log('[RECEIPT] isPaid:', isPaid);
      console.log('[RECEIPT] payments:', JSON.stringify(raw?.data?.attributes?.payments ?? null));

      if (isPaid) {
        const { error: updateError } = await supabase
          .from('tbl_bookings')
          .update({ status: 'paid_awaiting_verification' })
          .eq('booking_id', booking.booking_id)
          .eq('status', 'pending_payment');

        if (updateError) {
          console.error('[RECEIPT] Update error:', updateError);
        } else {
          bookingStatus = 'paid_awaiting_verification';
        }
      }
    } catch (verifyError) {
      console.error('[RECEIPT] PayMongo verification failed:', verifyError);
    }
  }

  const dailyRate = unit?.daily_rate == null ? null : Number(unit.daily_rate);
  const rentalDays =
    dailyRate && dailyRate > 0
      ? calculateBooking({ dailyRate, startDate: booking.start_date, endDate: booking.end_date }).rentalDays
      : null;

  return NextResponse.json({
    booking_id: booking.booking_id,
    unit: unit?.category ?? unit?.unit_name ?? null,
    start_date: booking.start_date,
    end_date: booking.end_date,
    pickup_date: booking.pickup_date ?? null,
    rental_days: rentalDays,
    daily_rate: dailyRate,
    rental_fee: booking.rental_fee == null ? null : Number(booking.rental_fee),
    security_fee: booking.security_fee == null ? null : Number(booking.security_fee),
    total_amount: booking.total_amount == null ? null : Number(booking.total_amount),
    payment_method: payment?.payment_method ?? null,
    payment_status: payment?.payment_status ?? null,
    booking_status: bookingStatus ?? null,
  });
}