import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';
// ASSUMPTION: your service-role helper is exported from '@/lib/supabase_admin'.
// Change this import if yours has a different name or path.
import { createAdminClient } from '@/lib/supabase_admin';
import {
  computeAnalytics,
  resolvePeriods,
  type RangeKey,
  type RawBooking,
  type RawPayment,
  type RawUnit,
  type RawUser,
} from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const RANGES: RangeKey[] = ['this_month', 'this_quarter', 'custom'];

/** Supabase returns at most 1000 rows per request, so read in pages. */
async function fetchAll<T>(
  run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; from < 200000; from += pageSize) {
    const { data, error } = await run(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Admin sign-ins use MFA: require a fully verified session for financial data.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
    return NextResponse.json({ error: 'Multi-factor verification required.' }, { status: 401 });
  }

  const admin = await createAdminClient();
  const { data: staff } = await admin
    .from('staff_roles')
    .select('role, status')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!staff || staff.status !== 'active' || !['admin', 'sysadmin'].includes(staff.role)) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get('range') as RangeKey | null;
  const range: RangeKey = requested && RANGES.includes(requested) ? requested : 'this_month';

  let periods;
  try {
    periods = resolvePeriods(range, url.searchParams.get('from'), url.searchParams.get('to'));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid date range.' },
      { status: 400 },
    );
  }

  try {
    const since = new Date(periods.previous.start).toISOString();

    const [bookings, payments, units, users] = await Promise.all([
      // All bookings: needed to tell first-time renters from returning ones
      fetchAll<RawBooking>((a, b) =>
        admin
          .from('tbl_bookings')
          .select('booking_id, user_id, unit_id, status, total_amount, created_at')
          .order('created_at', { ascending: true })
          .order('booking_id', { ascending: true })
          .range(a, b),
      ),
      fetchAll<RawPayment>((a, b) =>
        admin
          .from('tbl_payments')
          .select('payment_id, booking_id, amount_paid, payment_status, paid_at')
          .gte('paid_at', since)
          .order('paid_at', { ascending: true })
          .order('payment_id', { ascending: true })
          .range(a, b),
      ),
      fetchAll<RawUnit>((a, b) =>
        admin
          .from('tbl_units')
          .select('unit_id, unit_name, category, status, daily_rate')
          .order('unit_id', { ascending: true })
          .range(a, b),
      ),
      fetchAll<RawUser>((a, b) =>
        admin
          .from('tbl_users')
          .select('user_id, first_name, last_name, created_at, role')
          .gte('created_at', since)
          .order('created_at', { ascending: true })
          .order('user_id', { ascending: true })
          .range(a, b),
      ),
    ]);

    const result = computeAnalytics({ bookings, payments, units, users }, periods);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Analytics query failed:', error);
    return NextResponse.json({ error: 'Could not load analytics.' }, { status: 500 });
  }
}