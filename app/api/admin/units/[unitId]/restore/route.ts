import { NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/admin-api-auth";
import { createAdminClient } from "@/lib/supabase_admin";
import { isUuid } from "@/lib/uuid";

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
  if (unit.status !== "Archived") {
    return NextResponse.json(
      { error: "Only archived units can be restored." },
      { status: 409 }
    );
  }

  const { data: restoredUnit, error: restoreError } = await admin
    .from("tbl_units")
    .update({ status: "available" })
    .eq("unit_id", unitId)
    .eq("status", "Archived")
    .select("unit_id")
    .maybeSingle();

  if (restoreError) {
    return NextResponse.json({ error: restoreError.message }, { status: 500 });
  }
  if (!restoredUnit) {
    return NextResponse.json({ error: "Unit could not be restored." }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    unit_id: unitId,
    status: "available",
  });
}
