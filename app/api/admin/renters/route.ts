import { NextResponse } from 'next/server';
import { getAdminApiUser } from '@/lib/admin-api-auth';
import { createAdminClient } from '@/lib/supabase_admin';

const BATCH_SIZE = 1000;
const USER_FIELDS = 'user_id, first_name, last_name, email, phone_number, created_at, status, verification_status';

type RenterRecord = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  created_at: string | null;
  status: string | null;
  verification_status: string | null;
};

type KycRecord = {
  user_id: string;
  admin_status: string | null;
  created_at: string | null;
};

function parsePositiveInteger(value: string | null, fallback: number, max?: number) {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return max ? Math.min(parsed, max) : parsed;
}

function escapeLikeValue(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

async function loadKycStatuses(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[]
) {
  const latestStatusByUser = new Map<string, string | null>();

  for (let index = 0; index < userIds.length; index += 100) {
    const userIdBatch = userIds.slice(index, index + 100);
    for (let offset = 0; ; offset += BATCH_SIZE) {
      const { data, error } = await admin
        .from('tbl_kyc')
        .select('user_id, admin_status, created_at')
        .in('user_id', userIdBatch)
        .order('created_at', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) throw new Error('Unable to load renter verification records.');

      const rows = (data ?? []) as KycRecord[];
      for (const row of rows) {
        if (!latestStatusByUser.has(row.user_id)) {
          latestStatusByUser.set(row.user_id, row.admin_status);
        }
      }

      if (rows.length < BATCH_SIZE) break;
    }
  }

  return latestStatusByUser;
}

export async function GET(request: Request) {
  try {
    const adminUser = await getAdminApiUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() ?? '';
    const kycStatus = searchParams.get('kycStatus')?.trim() ?? '';
    const accountStatus = searchParams.get('accountStatus')?.trim() ?? '';
    const page = parsePositiveInteger(searchParams.get('page'), 1);
    const limit = parsePositiveInteger(searchParams.get('limit'), 20, 100);

    if (page === null || limit === null) {
      return NextResponse.json(
        { error: 'page and limit must be positive integers.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    let matchingUserIds: string[] | null = null;

    if (query) {
      const pattern = `%${escapeLikeValue(query)}%`;
      const searchIdsByColumn = await Promise.all(
        ['first_name', 'last_name', 'email', 'phone_number'].map(async (column) => {
          const userIds: string[] = [];
          for (let offset = 0; ; offset += BATCH_SIZE) {
            const { data, error } = await admin
              .from('tbl_users')
              .select('user_id')
              .eq('role', 'customer')
              .ilike(column, pattern)
              .range(offset, offset + BATCH_SIZE - 1);
            if (error) throw new Error('Unable to search renter records.');

            const batch = data ?? [];
            userIds.push(...batch.map((row) => row.user_id));
            if (batch.length < BATCH_SIZE) break;
          }
          return userIds;
        })
      );
      matchingUserIds = [
        ...new Set(searchIdsByColumn.flat()),
      ];
      if (matchingUserIds.length === 0) {
        return NextResponse.json({
          renters: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          total: 0,
        });
      }
    }

    const loadRenterBatch = async (from: number, to: number) => {
      let userQuery = admin
        .from('tbl_users')
        .select(USER_FIELDS, { count: 'exact' })
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (accountStatus) userQuery = userQuery.eq('status', accountStatus);
      if (matchingUserIds) userQuery = userQuery.in('user_id', matchingUserIds);

      const { data, error, count } = await userQuery;
      if (error) throw new Error('Unable to load renter records.');
      return { renters: (data ?? []) as RenterRecord[], count: count ?? 0 };
    };

    let renterCandidates: RenterRecord[];
    let total: number;
    if (kycStatus) {
      renterCandidates = [];
      for (let offset = 0; ; offset += BATCH_SIZE) {
        const batch = await loadRenterBatch(offset, offset + BATCH_SIZE - 1);
        renterCandidates.push(...batch.renters);
        if (batch.renters.length < BATCH_SIZE) break;
      }
      const kycStatuses = await loadKycStatuses(
        admin,
        renterCandidates.map((renter) => renter.user_id)
      );
      const normalizedFilter = kycStatus.toLowerCase();
      renterCandidates = renterCandidates.filter(
        (renter) => (kycStatuses.get(renter.user_id) ?? '').toLowerCase() === normalizedFilter
      );
      total = renterCandidates.length;
      renterCandidates = renterCandidates.slice((page - 1) * limit, page * limit);
    } else {
      const { renters, count } = await loadRenterBatch((page - 1) * limit, page * limit - 1);
      renterCandidates = renters;
      total = count;
    }

    const renterIds = renterCandidates.map((renter) => renter.user_id);
    const [kycStatuses, bookingCounts] = await Promise.all([
      loadKycStatuses(admin, renterIds),
      Promise.all(
        renterIds.map(async (userId) => {
          const { count, error } = await admin
            .from('tbl_bookings')
            .select('booking_id', { count: 'exact', head: true })
            .eq('user_id', userId);
          if (error) throw new Error('Unable to count renter bookings.');
          return [userId, count ?? 0] as const;
        })
      ),
    ]);

    const bookingCountByUser = new Map(bookingCounts);
    const renters = renterCandidates.map((renter) => ({
      ...renter,
      latest_kyc_status: kycStatuses.get(renter.user_id) ?? null,
      booking_count: bookingCountByUser.get(renter.user_id) ?? 0,
    }));

    return NextResponse.json({
      renters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      total,
    });
  } catch (error) {
    console.error('Admin renter list request failed:', error);
    return NextResponse.json(
      { error: 'Unable to load renter management data.' },
      { status: 500 }
    );
  }
}
