import { NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/admin-api-auth";
import { createAdminClient } from "@/lib/supabase_admin";
import { isUuid } from "@/lib/uuid";
import { isBookingBlockingUnit } from "@/lib/unit-booking-rules";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const user = await getAdminApiUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { unitId } = await params;
  if (!isUuid(unitId)) {
    return NextResponse.json({ error: "A valid unit_id is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: unit, error: unitError } = await admin
    .from("tbl_units")
    .select("unit_id, status")
    .eq("unit_id", unitId)
    .maybeSingle();

  if (unitError) return NextResponse.json({ error: unitError.message }, { status: 500 });
  if (!unit) return NextResponse.json({ error: "Unit not found." }, { status: 404 });
  if (unit.status === "Archived") {
    return NextResponse.json({ success: true, unit_id: unitId, status: "Archived" });
  }

  const { data: bookings, error: bookingsError } = await admin
    .from("tbl_bookings")
    .select("status, created_at")
    .eq("unit_id", unitId);

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  if ((bookings ?? []).some((booking) =>
    isBookingBlockingUnit(booking.status, booking.created_at)
  )) {
    return NextResponse.json(
      { error: "Unit cannot be archived while it has pending, approved, or confirmed bookings." },
      { status: 409 }
    );
  }

  const { data: archivedUnit, error: archiveError } = await admin
    .from("tbl_units")
    .update({ status: "Archived" })
    .eq("unit_id", unitId)
    .select("unit_id")
    .maybeSingle();

  if (archiveError) return NextResponse.json({ error: archiveError.message }, { status: 500 });
  if (!archivedUnit) {
    return NextResponse.json({ error: "Unit could not be archived." }, { status: 409 });
  }

  return NextResponse.json({ success: true, unit_id: unitId, status: "Archived" });
}
