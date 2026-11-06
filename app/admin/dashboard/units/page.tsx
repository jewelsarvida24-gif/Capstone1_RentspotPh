import UnitManagementList, {
  type ManagedUnit,
} from "@/components/admin/unit-management-list";
import { createAdminClient } from "@/lib/supabase_admin";
import { isBookingBlockingUnit } from "@/lib/unit-booking-rules";

type UnitBooking = {
  unit_id: string;
  status: string | null;
  created_at: string | null;
};

type UnitSummaryCounts = {
  available: number;
  archived: number;
  pending: number;
  approved: number;
  confirmed: number;
};

const BOOKING_STATUS_PRIORITY: Record<string, number> = {
  confirmed: 3,
  approved: 2,
  pending: 1,
};

function displayBookingStatus(status: string | null) {
  const normalized = (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "approved") return "Approved";
  if (BOOKING_STATUS_PRIORITY[normalized] === 1 || isBookingBlockingUnit(status)) {
    return "Pending";
  }

  return null;
}

export default async function UnitsPage() {
  const supabase = createAdminClient();
  const [
    { data: units, error: unitsError },
    { data: bookings, error: bookingsError },
  ] = await Promise.all([
    supabase
      .from("tbl_units")
      .select("unit_id, unit_name, category, description, daily_rate, status, image_url")
      .order("unit_name", { ascending: true }),
    supabase
      .from("tbl_bookings")
      .select("unit_id, status, created_at"),
  ]);

  if (unitsError) {
    throw new Error(`Unable to load rental units: ${unitsError.message}`);
  }
  if (bookingsError) {
    throw new Error(`Unable to load unit bookings: ${bookingsError.message}`);
  }

  const bookingStatuses = new Map<string, string>();
  const summaryCounts: UnitSummaryCounts = {
    available: 0,
    archived: 0,
    pending: 0,
    approved: 0,
    confirmed: 0,
  };

  for (const unit of units ?? []) {
    switch (unit.status?.toLowerCase()) {
      case "available":
        summaryCounts.available += 1;
        break;
      case "archived":
        summaryCounts.archived += 1;
        break;
    }
  }

  for (const booking of (bookings ?? []) as UnitBooking[]) {
    if (!isBookingBlockingUnit(booking.status, booking.created_at)) continue;

    const status = displayBookingStatus(booking.status);
    if (!status) continue;

    switch (status) {
      case "Pending":
        summaryCounts.pending += 1;
        break;
      case "Approved":
        summaryCounts.approved += 1;
        break;
      case "Confirmed":
        summaryCounts.confirmed += 1;
        break;
    }

    const currentStatus = bookingStatuses.get(booking.unit_id);
    if (
      !currentStatus ||
      BOOKING_STATUS_PRIORITY[status.toLowerCase()] >
        BOOKING_STATUS_PRIORITY[currentStatus.toLowerCase()]
    ) {
      bookingStatuses.set(booking.unit_id, status);
    }
  }

  return (
    <UnitManagementList
      summaryCounts={summaryCounts}
      units={(units ?? []).map((unit) => ({
        ...unit,
        activeBookingStatus: bookingStatuses.get(unit.unit_id) ?? null,
      })) as ManagedUnit[]}
    />
  );
}
