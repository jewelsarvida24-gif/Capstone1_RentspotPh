import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';

function rentalDaysBetween(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id')?.trim();

  if (!bookingId) {
    return NextResponse.json({ error: 'booking_id is required.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: booking, error: bookingError } = await supabase
    .from('tbl_bookings')
    .select('booking_id, unit_id, start_date, end_date, total_amount, status')
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
      .select('payment_method, payment_status')
      .eq('booking_id', booking.booking_id)
      .maybeSingle(),
  ]);

  if (unitError || paymentError) {
    return NextResponse.json(
      { error: unitError?.message ?? paymentError?.message ?? 'Unable to load receipt data.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    booking_id: booking.booking_id,
    unit: unit?.category ?? unit?.unit_name ?? null,
    start_date: booking.start_date,
    end_date: booking.end_date,
    rental_days: rentalDaysBetween(booking.start_date, booking.end_date),
    daily_rate: unit?.daily_rate == null ? null : Number(unit.daily_rate),
    total_amount: booking.total_amount == null ? null : Number(booking.total_amount),
    payment_method: payment?.payment_method ?? null,
    payment_status: payment?.payment_status ?? null,
    booking_status: booking.status ?? null,
  });
}
