
import { createClient } from "@/lib/supabase_server";
import UnitManagementList, {
  type ManagedUnit,
} from "@/components/admin/unit-management-list";

export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const supabase = await createClient();

  const {
    data: unitsData,
    error: unitsError,
  } = await supabase
    .from("tbl_units")
    .select(
      "unit_id, unit_name, category, description, daily_rate, image_url, status, requires_driver_license"
    )
    .order("created_at", { ascending: false });

  if (unitsError) {
    console.error("Failed to load rental units:", unitsError.message);
    throw new Error(`Failed to load rental units: ${unitsError.message}`);
  }

  const {
    data: bookingsData,
    error: bookingsError,
  } = await supabase
    .from("tbl_bookings")
    .select("unit_id, status")
    .in("status", [
      "pending",
      "Pending",
      "approved",
      "Approved",
      "confirmed",
      "Confirmed",
    ]);

  if (bookingsError) {
    console.error("Failed to load unit bookings:", bookingsError.message);
    throw new Error(`Failed to load unit bookings: ${bookingsError.message}`);
  }

  const bookingPriority = {
    Confirmed: 3,
    Approved: 2,
    Pending: 1,
  };

  const activeBookingByUnit = new Map<
    string,
    "Confirmed" | "Approved" | "Pending"
  >();

  for (const booking of bookingsData ?? []) {
    const status = String(booking.status).toLowerCase();

    let normalizedStatus:
      | "Confirmed"
      | "Approved"
      | "Pending"
      | null = null;

    if (status === "confirmed") {
      normalizedStatus = "Confirmed";
    } else if (status === "approved") {
      normalizedStatus = "Approved";
    } else if (status === "pending") {
      normalizedStatus = "Pending";
    }

    if (!normalizedStatus) continue;

    const currentStatus = activeBookingByUnit.get(booking.unit_id);

    if (
      !currentStatus ||
      bookingPriority[normalizedStatus] > bookingPriority[currentStatus]
    ) {
      activeBookingByUnit.set(booking.unit_id, normalizedStatus);
    }
  }

  const units: ManagedUnit[] = (unitsData ?? []).map((unit) => ({
    unit_id: unit.unit_id,
    unit_name: unit.unit_name,
    category: unit.category,
    description: unit.description,
    daily_rate: unit.daily_rate,
    image_url: unit.image_url,
    status: unit.status,
    requires_driver_license: unit.requires_driver_license,
    activeBookingStatus: activeBookingByUnit.get(unit.unit_id) ?? null,
  }));

  const summaryCounts = {
    available: units.filter(
      (unit) => unit.status?.toLowerCase() === "available"
    ).length,

    archived: units.filter(
      (unit) => unit.status?.toLowerCase() === "archived"
    ).length,

    pending: units.filter(
      (unit) => unit.activeBookingStatus === "Pending"
    ).length,

    approved: units.filter(
      (unit) => unit.activeBookingStatus === "Approved"
    ).length,

    confirmed: units.filter(
      (unit) => unit.activeBookingStatus === "Confirmed"
    ).length,
  };

  return (
    <UnitManagementList
      units={units}
      summaryCounts={summaryCounts}
    />
  );
}
