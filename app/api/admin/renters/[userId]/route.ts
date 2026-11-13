import { NextResponse } from 'next/server';
import { getAdminApiUser } from '@/lib/admin-api-auth';
import { createAdminClient } from '@/lib/supabase_admin';
import { isUuid } from '@/lib/uuid';

const BATCH_SIZE = 1000;

type KycRecord = {
  status: string | null;
  document_type: string | null;
  didit_status: string | null;
  admin_status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
};

type BookingRecord = {
  booking_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  total_amount: number | string | null;
  status: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const adminUser = await getAdminApiUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await context.params;
    if (!isUuid(userId)) {
      return NextResponse.json({ error: 'Renter not found.' }, { status: 404 });
    }

    const admin = createAdminClient();
    const { data: renter, error: renterError } = await admin
      .from('tbl_users')
      .select('user_id, first_name, last_name, email, phone_number, created_at, status')
      .eq('user_id', userId)
      .eq('role', 'customer')
      .maybeSingle();

    if (renterError) {
      console.error('Failed to retrieve renter profile:', renterError.message);
      return NextResponse.json({ error: 'Unable to load renter details.' }, { status: 500 });
    }
    if (!renter) {
      return NextResponse.json({ error: 'Renter not found.' }, { status: 404 });
    }

    const kycHistory: KycRecord[] = [];
    for (let offset = 0; ; offset += BATCH_SIZE) {
      const { data, error } = await admin
        .from('tbl_kyc')
        .select('status, document_type, didit_status, admin_status, reviewed_by, reviewed_at, rejection_reason, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        console.error('Failed to retrieve renter KYC history:', error.message);
        return NextResponse.json({ error: 'Unable to load renter verification history.' }, { status: 500 });
      }

      const batch = (data ?? []) as KycRecord[];
      kycHistory.push(...batch);
      if (batch.length < BATCH_SIZE) break;
    }

    const bookings: BookingRecord[] = [];
    for (let offset = 0; ; offset += BATCH_SIZE) {
      const { data, error } = await admin
        .from('tbl_bookings')
        .select('booking_id, unit_id, start_date, end_date, total_amount, status')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        console.error('Failed to retrieve renter bookings:', error.message);
        return NextResponse.json({ error: 'Unable to load renter bookings.' }, { status: 500 });
      }

      const batch = (data ?? []) as BookingRecord[];
      bookings.push(...batch);
      if (batch.length < BATCH_SIZE) break;
    }

    const unitIds = [...new Set(bookings.map((booking) => booking.unit_id))];
    const unitNames = new Map<string, string | null>();
    for (let index = 0; index < unitIds.length; index += 100) {
      const { data, error } = await admin
        .from('tbl_units')
        .select('unit_id, unit_name')
        .in('unit_id', unitIds.slice(index, index + 100));

      if (error) {
        console.error('Failed to resolve renter booking unit names:', error.message);
        return NextResponse.json({ error: 'Unable to load renter booking details.' }, { status: 500 });
      }

      for (const unit of data ?? []) {
        unitNames.set(unit.unit_id, unit.unit_name);
      }
    }

    const { data: authResult, error: authError } = await admin.auth.admin.getUserById(userId);
    if (authError) {
      console.error('Failed to retrieve renter authentication details:', authError.message);
      return NextResponse.json({ error: 'Unable to load renter sign-in details.' }, { status: 500 });
    }

    // Account-status history has no established entity_type in this project; do not treat KYC history as account history.
    const accountStatusHistory: never[] = [];

    return NextResponse.json({
      renter: {
        first_name: renter.first_name,
        last_name: renter.last_name,
        email: renter.email,
        phone_number: renter.phone_number,
        created_at: renter.created_at,
        status: renter.status,
        last_sign_in_at: authResult.user?.last_sign_in_at ?? null,
      },
      latest_kyc: kycHistory[0] ?? null,
      kyc_history: kycHistory,
      bookings: bookings.map((booking) => ({
        ...booking,
        unit_name: unitNames.get(booking.unit_id) ?? null,
      })),
      account_status_history: accountStatusHistory,
    });
  } catch (error) {
    console.error('Admin renter detail request failed:', error);
    return NextResponse.json(
      { error: 'Unable to load renter details.' },
      { status: 500 }
    );
  }
}
