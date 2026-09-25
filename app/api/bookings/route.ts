import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { unit_id, start_date, end_date, notes } = body ?? {};

    if (!unit_id || !start_date || !end_date) {
      return NextResponse.json(
        { message: 'Missing required booking details.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return NextResponse.json(
        { message: 'Please sign in before booking a rental.' },
        { status: 401 }
      );
    }

    const { data: unit, error: unitError } = await supabase
      .from('tbl_units')
      .select('unit_id, status, daily_rate')
      .eq('unit_id', unit_id)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { message: 'Selected unit was not found.' },
        { status: 404 }
      );
    }

    if ((unit as any).status !== 'available') {
      return NextResponse.json(
        { message: 'This rental unit is no longer available.' },
        { status: 409 }
      );
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json(
        { message: 'End date must be later than the start date.' },
        { status: 400 }
      );
    }

    const total_days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1
    );

    const { data: booking, error: insertError } = await supabase.from('tbl_bookings').insert({
      unit_id,
      user_id: userData.user.id,
      start_date,
      end_date,
      total_days,
      total_amount: Number((unit as any).daily_rate ?? 0) * total_days,
      notes: notes ?? '',
      booking_status: 'pending',
    });

    if (insertError) {
      throw insertError;
    }

    const { error: unitUpdateError } = await supabase
      .from('tbl_units')
      .update({ status: 'rented' })
      .eq('unit_id', unit_id);

    if (unitUpdateError) throw unitUpdateError;

    const insertedBooking = booking as
      | { booking_id?: string }
      | Array<{ booking_id?: string }>
      | null;

    return NextResponse.json({
      message: 'Booking request submitted successfully.',
      success: true,
      booking_id: Array.isArray(insertedBooking)
        ? insertedBooking[0]?.booking_id ?? null
        : insertedBooking?.booking_id ?? null,
    });
  } catch (error) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Booking request could not be processed.',
      },
      { status: 500 }
    );
  }
}
