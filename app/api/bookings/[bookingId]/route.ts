import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';

export async function PATCH(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  const { bookingId } = await params;
  const body = await request.json();
  const nextStatus = body?.status;
  if (!['cancelled', 'completed'].includes(nextStatus)) {
    return NextResponse.json({ message: 'Unsupported rental status.' }, { status: 400 });
  }

  const { data: booking, error: bookingError } = await supabase
    .from('tbl_bookings').select('booking_id, unit_id, booking_status').eq('booking_id', bookingId).eq('user_id', userData.user.id).single();
  if (bookingError || !booking) return NextResponse.json({ message: 'Rental not found.' }, { status: 404 });
  if (['completed', 'cancelled', 'rejected'].includes(booking.booking_status)) {
    return NextResponse.json({ message: 'This rental can no longer be updated.' }, { status: 409 });
  }

  const { error } = await supabase.from('tbl_bookings').update({ booking_status: nextStatus }).eq('booking_id', bookingId).eq('user_id', userData.user.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  await supabase.from('tbl_units').update({ status: 'available' }).eq('unit_id', booking.unit_id);
  return NextResponse.json({ success: true, booking_status: nextStatus });
}