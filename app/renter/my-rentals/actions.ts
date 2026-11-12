"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase_admin";
import { createClient } from "@/lib/supabase_server";

// Statuses that can no longer be cancelled.
const FINAL_STATUSES = [
  "completed",
  "returned",
  "cancelled",
  "canceled",
  "rejected",
  "declined",
  "admin_rejected",
  "expired",
  "payment_expired",
];

const norm = (v: string | null | undefined) =>
  (v ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

export async function cancelBooking(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to sign in again." };

  const admin = createAdminClient();

  // Always re-check on the server. Never trust the button being visible.
  const { data: booking, error } = await admin
    .from("tbl_bookings")
    .select("booking_id, user_id, status, end_date")
    .eq("booking_id", bookingId)
    .eq("user_id", user.id) // renters can only cancel their own bookings
    .maybeSingle();

  if (error || !booking) return { ok: false, error: "Booking not found." };

  if (FINAL_STATUSES.includes(norm(booking.status))) {
    return { ok: false, error: "This booking can no longer be cancelled." };
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
  if (booking.end_date.slice(0, 10) < today) {
    return { ok: false, error: "This rental is already completed." };
  }

  const { error: updateError } = await admin
    .from("tbl_bookings")
    .update({ status: "cancelled" })
    .eq("booking_id", bookingId)
    .eq("user_id", user.id);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/renter/my-rentals");
  return { ok: true };
}