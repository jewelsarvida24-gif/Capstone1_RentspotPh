import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { isUuid } from '@/lib/uuid';
import { PAYMENT_SESSION_TTL_MS } from '@/lib/unit-booking-rules';

const TERMINAL_STATUSES = new Set([
  'cancelled',
  'declined',
  'expired',
  'payment_setup_failed',
  'rejected',
]);

function getTodayInManila() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
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
        .gte('end_date', today),
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
    const status = String(booking.status ?? '').toLowerCase();
    if (TERMINAL_STATUSES.has(status)) return [];

    if (status === 'pending_payment') {
      const createdAt = booking.created_at ? new Date(booking.created_at).getTime() : null;
      if (createdAt && now - createdAt >= PAYMENT_SESSION_TTL_MS) return [];
    }

    if (!booking.start_date || !booking.end_date) return [];
    return [{ start_date: booking.start_date, end_date: booking.end_date }];
  });

  return NextResponse.json({
    booked_ranges: bookedRanges,
    blocked_ranges: (blocks ?? []).map((block) => ({
      start_date: block.blocked_date,
      end_date: block.blocked_date,
    })),
  });
}