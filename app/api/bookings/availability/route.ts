import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { isUuid } from '@/lib/uuid';
import { getTodayInManila } from '@/lib/pricing';
import { DATE_BLOCKING_STATUSES, PENDING_HOLD_MS } from '@/lib/booking-status';

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get('unit_id')?.trim();

  if (!unitId || !isUuid(unitId)) {
    return NextResponse.json({ error: 'A valid unit_id is required.' }, { status: 400 });
  }

  const today = getTodayInManila();
  const adminSupabase = createAdminClient();
  const [{ data: bookings, error }, { data: blocks, error: blocksError }] =
    await Promise.all([
      adminSupabase
        .from('tbl_bookings')
        .select('start_date, end_date, status, created_at')
        .eq('unit_id', unitId)
        .gte('end_date', addDays(today, -1)), // a booking that ended yesterday still blocks today
      adminSupabase
        .from('tbl_unit_blocked_dates')
        .select('blocked_date')
        .eq('unit_id', unitId)
        .gte('blocked_date', today),
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  const now = Date.now();
  const bookedRanges = (bookings ?? []).flatMap((booking) => {
    const status = String(booking.status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (!DATE_BLOCKING_STATUSES.has(status)) return [];

    if (status === 'pending_payment') {
      const createdAt = booking.created_at ? new Date(booking.created_at).getTime() : null;
      if (createdAt && now - createdAt >= PENDING_HOLD_MS) return [];
    }

    if (!booking.start_date || !booking.end_date) return [];
    // The returned range already includes the buffer day (end_date + 1).
    return [{ start_date: booking.start_date, end_date: addDays(booking.end_date, 1) }];
  });

  return NextResponse.json({
    booked_ranges: bookedRanges,
    blocked_ranges: (blocks ?? []).map((block) => ({
      start_date: block.blocked_date,
      end_date: block.blocked_date,
    })),
  });
}