import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';
import { createAdminClient } from '@/lib/supabase_admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: staff } = await admin
    .from('staff_roles')
    .select('role, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!staff || staff.status !== 'active') return null;
  if (!['admin', 'sysadmin'].includes(staff.role)) return null;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return null;

  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data: bookings, error } = await admin
    .from('tbl_bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = bookings ?? [];
  const userIds = [...new Set(rows.map((b) => b.user_id))];
  const unitIds = [...new Set(rows.map((b) => b.unit_id))];
  const bookingIds = rows.map((b) => b.booking_id);

  const [{ data: users }, { data: units }, { data: payments }] = await Promise.all([
    admin.from('tbl_users').select('user_id, first_name, last_name, email, phone_number').in('user_id', userIds),
    admin.from('tbl_units').select('unit_id, category, description, daily_rate, status, image_url').in('unit_id', unitIds),
    admin.from('tbl_payments').select('*').in('booking_id', bookingIds),
  ]);

  const result = rows.map((b) => ({
    ...b,
    renter: users?.find((u) => u.user_id === b.user_id) ?? null,
    unit: units?.find((u) => u.unit_id === b.unit_id) ?? null,
    payment: payments?.find((p) => p.booking_id === b.booking_id) ?? null,
  }));

  return NextResponse.json({
    bookings: result,
    test_mode: (process.env.PAYMONGO_SECRET_KEY ?? '').startsWith('sk_test_'),
  });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const bookingId = String(body.booking_id ?? '').trim();
  const decision = body.decision;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (!bookingId || !['approved', 'rejected'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (decision === 'rejected' && !reason) {
    return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: updated, error: bookingError } = await admin
    .from('tbl_bookings')
    .update({
      status: decision,
      rejection_reason: decision === 'rejected' ? reason : null,
      reviewed_by: user.id,
      reviewed_at: now,
    })
    .eq('booking_id', bookingId)
    .eq('status', 'paid_awaiting_verification')
    .select('booking_id')
    .maybeSingle();

  if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 });
  if (!updated) {
    return NextResponse.json({ error: 'Booking is not awaiting review.' }, { status: 409 });
  }

  const { error: paymentError } = await admin
    .from('tbl_payments')
    .update(
      decision === 'approved'
        ? { payment_status: 'paid', paid_at: now }
        : { payment_status: 'refunded' }
    )
    .eq('booking_id', bookingId);

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: decision === 'approved' ? 'Booking approved.' : 'Booking rejected.',
  });
}