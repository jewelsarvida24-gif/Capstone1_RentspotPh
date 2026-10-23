import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { createClient } from '@/lib/supabase_server';
import { isUuid } from '@/lib/uuid';

const PAYMENT_SESSION_TTL_MS = 1000 * 30;
const TERMINAL_STATUSES = new Set(['cancelled', 'declined', 'expired', 'rejected']);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get('unit_id')?.trim();

  if (!unitId || !isUuid(unitId)) {
    return NextResponse.json({ error: 'A valid unit_id is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const adminSupabase = createAdminClient();
  const { data: bookings, error } = await adminSupabase
    .from('tbl_bookings')
    .select('start_date, end_date, status, created_at')
    .eq('unit_id', unitId)
    .gte('end_date', today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const bookedRanges = (bookings ?? []).flatMap((booking) => {
    const status = String(booking.status ?? '').toLowerCase();
    if (TERMINAL_STATUSES.has(status)) return [];

    if (status === 'pending_payment') {
      const createdAt = booking.created_at ? new Date(booking.created_at).getTime() : null;
      if (createdAt && now - createdAt >= PAYMENT_SESSION_TTL_MS) return [];
    }

    if (!booking.start_date || !booking.end_date) return [];
    return [{ start_date: booking.start_date, end_date: booking.end_date }];
  });

  return NextResponse.json({ booked_ranges: bookedRanges });
}