import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  const { booking_id, unit_id, rating, review } = await request.json();
  const numericRating = Number(rating);
  if (!booking_id || !unit_id || numericRating < 1 || numericRating > 5) return NextResponse.json({ message: 'Choose a rating from 1 to 5.' }, { status: 400 });

  const { data: booking } = await supabase.from('tbl_bookings').select('status').eq('booking_id', booking_id).eq('user_id', userData.user.id).single();
  if (!booking || booking.status !== 'completed') return NextResponse.json({ message: 'Only completed rentals can be rated.' }, { status: 400 });
  const { data: existing } = await supabase.from('tbl_feedbacks').select('id').eq('booking_id', booking_id).eq('user_id', userData.user.id).maybeSingle();
  if (existing) return NextResponse.json({ message: 'This rental has already been rated.' }, { status: 409 });
  const { error } = await supabase.from('tbl_feedbacks').insert({ booking_id, unit_id, user_id: userData.user.id, rating: numericRating, review: String(review ?? '').trim() });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}