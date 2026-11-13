import { NextResponse } from 'next/server';
import { getAdminApiUser } from '@/lib/admin-api-auth';
import { createAdminClient } from '@/lib/supabase_admin';
import { isUuid } from '@/lib/uuid';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const user = await getAdminApiUser();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { bookingId } = await params;
  if (!isUuid(bookingId)) {
    return NextResponse.json({ error: 'Invalid booking ID.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking, error: bookingError } = await admin
    .from('tbl_bookings')
    .select('agreement_image_path')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }
  if (!booking?.agreement_image_path) {
    return NextResponse.json({ error: 'Signed Rental Agreement image not found.' }, { status: 404 });
  }

  const { data, error: signedUrlError } = await admin.storage
    .from('rental-agreements')
    .createSignedUrl(booking.agreement_image_path, 60);

  if (signedUrlError) {
    return NextResponse.json({ error: signedUrlError.message }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl, expires_in: 60 });
}
