"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin_guard";
import { createAdminClient } from "@/lib/supabase_admin";
import { isBookingBlockingUnit } from "@/lib/unit-booking-rules";

type UnitInput = {
  unitId?: string;
  unit_name: string;
  category: string;
  description: string;
  daily_rate: number;
  status: string;
  image_url: string | null;
};

type SaveUnitResult = { success: true } | { error: string };

const categories = ["Camera", "Smartphone", "Vehicle", "Add-on"];

export async function saveUnit(input: UnitInput): Promise<SaveUnitResult> {
  await requireStaff(["admin"]);

  const unitName = input.unit_name.trim();
  const inclusions = input.description
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const dailyRate = Number(input.daily_rate);

  if (!unitName || inclusions.length === 0 || !categories.includes(input.category)) {
    return {
      error: "Unit name, category, and at least one inclusion are required.",
    };
  }

  if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
    return { error: "Price per day must be a valid number greater than zero." };
  }

  const allowedStatuses = input.unitId
    ? ["available", "unavailable", "Archived"]
    : ["available", "unavailable"];
  if (!allowedStatuses.includes(input.status)) {
    return { error: "Invalid unit status." };
  }

  const supabase = createAdminClient();
  if (input.unitId) {
    const { data: bookings, error: bookingsError } = await supabase
      .from("tbl_bookings")
      .select("status, created_at")
      .eq("unit_id", input.unitId);

    if (bookingsError) {
      console.error("[UNIT FORM] Failed to verify active bookings before editing:", bookingsError);
      return { error: bookingsError.message };
    }
    if (
      (bookings ?? []).some((booking) =>
        isBookingBlockingUnit(booking.status, booking.created_at)
      )
    ) {
      return {
        error: "This rental unit cannot be edited while it has an active booking.",
      };
    }
  }

  const unit = {
    unit_name: unitName,
    category: input.category,
    description: inclusions.join("\n"),
    daily_rate: dailyRate,
    status: input.status,
    image_url: input.image_url,
  };

  if (input.unitId) {
    const { data, error } = await supabase
      .from("tbl_units")
      .update(unit)
      .eq("unit_id", input.unitId)
      .select("unit_id")
      .maybeSingle();

    if (error) {
      console.error("[UNIT FORM] Failed to update rental unit:", error);
      return { error: error.message };
    }
    if (!data) return { error: "The rental unit could not be found." };
  } else {
    const { error } = await supabase.from("tbl_units").insert(unit);
    if (error) {
      console.error("[UNIT FORM] Failed to add rental unit:", error);
      return { error: error.message };
    }
  }

  revalidatePath("/guest/browse");
  return { success: true };
}
