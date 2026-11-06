// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase_server";
import { createAdminClient } from "@/lib/supabase_admin";

export const dynamic = "force-dynamic";

type StaffRole = "admin" | "sysadmin";
// Same roles the other /api/admin routes accept. If dashboard/layout.tsx calls
// requireStaff(["admin"]) only, change this to ["admin"] so the API matches.
const ALLOWED_ROLES: StaffRole[] = ["admin", "sysadmin"];

// Booking statuses the app treats as "needs admin review".
const PENDING_BOOKING_STATUSES = [
  "pending_admin_review",
  "paid_awaiting_verification",
];

const PER_SOURCE_LIMIT = 5; // rows pulled per activity source
const FEED_SIZE = 10; // rows returned in the merged feed

type Activity = {
  id: string;
  type: "kyc" | "booking" | "renter";
  message: string;
  at: string;
};

type UserRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

/* -------------------------------------------------------------------------- */

export async function GET() {
  // 1. Same checks as requireStaff(), returned as JSON instead of redirects.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: staff } = await admin
    .from("staff_roles")
    .select("full_name, role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !staff ||
    staff.status !== "active" ||
    !ALLOWED_ROLES.includes(staff.role as StaffRole)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    return NextResponse.json({ error: "MFA required" }, { status: 403 });
  }

  // 2. Load everything in parallel.
  try {
    const [
      pendingKyc,
      pendingBookings,
      totalUnits,
      archivedUnits,
      availableUnits,
      totalRenters,
      verifiedRenters,
      suspendedRenters,
      recentActivity,
    ] = await Promise.all([
      count(
        admin
          .from("tbl_kyc")
          .select("id", { count: "exact", head: true })
          .eq("admin_status", "pending")
      ),
      count(
        admin
          .from("tbl_bookings")
          .select("booking_id", { count: "exact", head: true })
          .in("status", PENDING_BOOKING_STATUSES)
      ),
      count(
        admin.from("tbl_units").select("unit_id", { count: "exact", head: true })
      ),
      // ilike without wildcards = case-insensitive match, like the unit dashboard
      count(
        admin
          .from("tbl_units")
          .select("unit_id", { count: "exact", head: true })
          .ilike("status", "archived")
      ),
      count(
        admin
          .from("tbl_units")
          .select("unit_id", { count: "exact", head: true })
          .ilike("status", "available")
      ),
      countCustomerRenters(admin),
      countLatestVerifiedRenters(admin),
      count(
        admin
          .from("tbl_users")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "customer")
          .eq("status", "suspended")
      ),
      loadRecentActivity(admin),
    ]);

    return NextResponse.json(
      {
        admin: { name: staff.full_name ?? "Admin", role: staff.role },
        pendingKyc,
        pendingBookings,
        totalUnits,
        archivedUnits,
        availableUnits,
        totalRenters,
        activeRenters: totalRenters,
        verifiedRenters,
        suspendedRenters,
        recentActivity,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/admin/dashboard]", err);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Metrics                                                                     */
/* -------------------------------------------------------------------------- */

async function count(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
) {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countCustomerRenters(admin: SupabaseClient) {
  return count(
    admin
      .from("tbl_users")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "customer")
  );
}

async function countLatestVerifiedRenters(admin: SupabaseClient) {
  const customerIds: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("tbl_users")
      .select("user_id")
      .eq("role", "customer")
      .order("user_id")
      .range(from, from + 999);

    if (error) throw new Error(error.message);
    const rows = data ?? [];
    customerIds.push(...rows.map((row) => row.user_id));
    if (rows.length < 1000) break;
  }

  const latestStatusByCustomer = new Map<string, string | null>();
  for (let index = 0; index < customerIds.length; index += 100) {
    const customerBatch = customerIds.slice(index, index + 100);
    for (let from = 0; ; from += 1000) {
      const { data, error } = await admin
        .from("tbl_kyc")
        .select("user_id, admin_status, created_at")
        .in("user_id", customerBatch)
        .order("created_at", { ascending: false })
        .range(from, from + 999);

      if (error) throw new Error(error.message);
      const rows = data ?? [];
      for (const row of rows) {
        if (!latestStatusByCustomer.has(row.user_id)) {
          latestStatusByCustomer.set(row.user_id, row.admin_status);
        }
      }

      if (rows.length < 1000) break;
    }
  }

  let verifiedCount = 0;
  for (const status of latestStatusByCustomer.values()) {
    if (status === "approved") verifiedCount += 1;
  }
  return verifiedCount;
}

/* -------------------------------------------------------------------------- */
/* Recent activity                                                             */
/* -------------------------------------------------------------------------- */

function displayName(u?: UserRow | null) {
  const full = [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim();
  return full || u?.email || "a renter";
}

function bookingDecision(status: string | null) {
  if (status === "rejected") return "rejected";
  if (status === "approved" || status === "confirmed") return "approved";
  return (status ?? "reviewed").replace(/_/g, " ");
}

async function loadRecentActivity(admin: SupabaseClient): Promise<Activity[]> {
  const [kycRes, bookingRes, renterRes] = await Promise.all([
    // Latest KYC decisions
    admin
      .from("tbl_kyc")
      .select("id, user_id, admin_status, created_at, updated_at")
      .in("admin_status", ["approved", "rejected"])
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(PER_SOURCE_LIMIT),
    // Latest booking decisions (rows an admin has reviewed)
    admin
      .from("tbl_bookings")
      .select("booking_id, user_id, unit_id, status, reviewed_at")
      .not("reviewed_at", "is", null)
      .order("reviewed_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    // Newest renters
    admin
      .from("tbl_users")
      .select("user_id, first_name, last_name, email, created_at")
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(PER_SOURCE_LIMIT),
  ]);

  for (const res of [kycRes, bookingRes, renterRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const kyc = kycRes.data ?? [];
  const bookings = bookingRes.data ?? [];
  const newRenters = (renterRes.data ?? []) as (UserRow & {
    created_at: string | null;
  })[];

  // Look up names / unit names for the rows above.
  const userIds = [
    ...new Set([...kyc.map((k) => k.user_id), ...bookings.map((b) => b.user_id)]),
  ];
  const unitIds = [...new Set(bookings.map((b) => b.unit_id))];

  const [usersRes, unitsRes] = await Promise.all([
    admin
      .from("tbl_users")
      .select("user_id, first_name, last_name, email")
      .in("user_id", userIds),
    admin.from("tbl_units").select("unit_id, unit_name").in("unit_id", unitIds),
  ]);

  if (usersRes.error) throw new Error(usersRes.error.message);
  if (unitsRes.error) throw new Error(unitsRes.error.message);

  const users = (usersRes.data ?? []) as UserRow[];
  const units = unitsRes.data ?? [];
  const nameOf = (id: string) => displayName(users.find((u) => u.user_id === id));

  const feed: Activity[] = [];

  for (const k of kyc) {
    const at = k.updated_at ?? k.created_at;
    if (!at) continue;
    feed.push({
      id: `kyc-${k.id}`,
      type: "kyc",
      message: `KYC ${k.admin_status} for ${nameOf(k.user_id)}`,
      at,
    });
  }

  for (const b of bookings) {
    const unit = units.find((u) => u.unit_id === b.unit_id);
    feed.push({
      id: `booking-${b.booking_id}`,
      type: "booking",
      message: `Booking ${bookingDecision(b.status)}: ${unit?.unit_name ?? "unit"} for ${nameOf(b.user_id)}`,
      at: b.reviewed_at,
    });
  }

  for (const r of newRenters) {
    if (!r.created_at) continue;
    feed.push({
      id: `renter-${r.user_id}`,
      type: "renter",
      message: `New renter: ${displayName(r)}`,
      at: r.created_at,
    });
  }

  return feed
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, FEED_SIZE);
}