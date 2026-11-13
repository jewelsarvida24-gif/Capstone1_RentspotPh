import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { createClient } from '@/lib/supabase_server';
import { isUuid } from '@/lib/uuid';

export async function GET(request: Request) {
  const authClient = await createClient();
  const { data: { user }, error: authError } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookingId = new URL(request.url).searchParams.get('booking_id')?.trim() ?? '';
  if (!isUuid(bookingId)) {
    return NextResponse.json({ error: 'A valid booking_id is required.' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const [bookingResult, signatureResult] = await Promise.all([
    adminSupabase
      .from('tbl_bookings')
      .select('booking_id, rental_agreement_accepted, rental_agreement_signed_at')
      .eq('booking_id', bookingId)
      .eq('user_id', user.id)
      .maybeSingle(),
    adminSupabase
      .from('tbl_bookings')
      .select('booking_id', { count: 'exact', head: true })
      .eq('booking_id', bookingId)
      .eq('user_id', user.id)
      .like('rental_agreement_signature_data', 'data:image/png;base64,%'),
  ]);

  if (bookingResult.error || signatureResult.error) {
    return NextResponse.json(
      { error: bookingResult.error?.message ?? signatureResult.error?.message },
      { status: 500 }
    );
  }
  if (!bookingResult.data) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  return NextResponse.json({
    agreement_accepted: bookingResult.data.rental_agreement_accepted === true,
    has_saved_signature: (signatureResult.count ?? 0) > 0,
    signed_at: bookingResult.data.rental_agreement_signed_at ?? null,
  });
}
