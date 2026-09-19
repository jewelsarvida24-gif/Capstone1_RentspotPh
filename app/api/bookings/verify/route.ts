import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id')?.trim();

  if (!bookingId) {
    return NextResponse.json({ error: 'booking_id is required.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: booking, error: bookingError } = await supabase
    .from('tbl_bookings')
    .select('booking_id, unit_id, start_date, end_date, status')
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
      .select('category, unit_name')
      .eq('unit_id', booking.unit_id)
      .maybeSingle(),
    supabase
      .from('tbl_payments')
      .select('payment_status')
      .eq('booking_id', booking.booking_id)
      .maybeSingle(),
  ]);

  if (unitError || paymentError) {
    return NextResponse.json(
      { error: unitError?.message ?? paymentError?.message ?? 'Unable to verify booking.' },
      { status: 500 }
    );
  }

  const bookingStatus = booking.status ?? null;
  const paymentStatus = payment?.payment_status ?? null;
  const isEligible = bookingStatus === 'confirmed' && paymentStatus === 'paid';

  return NextResponse.json({
    booking_id: booking.booking_id,
    unit: unit?.category ?? unit?.unit_name ?? null,
    start_date: booking.start_date,
    end_date: booking.end_date,
    booking_status: bookingStatus,
    payment_status: paymentStatus,
    verification_result: isEligible ? 'verified' : 'not_eligible',
    verification_message: isEligible
      ? 'Booking is eligible for pickup.'
      : 'Booking is not currently eligible for pickup.',
  });
}
