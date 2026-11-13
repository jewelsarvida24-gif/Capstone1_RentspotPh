
"use server";

import { revalidatePath } from "next/cache";

import { calculateCancellationRefund } from "@/lib/refunds";
import { createAdminClient } from "@/lib/supabase_admin";
import { createClient } from "@/lib/supabase_server";

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

const PAID_PAYMENT_STATUSES = [
  "paid",
  "succeeded",
  "success",
  "completed",
  "processed",
];

function getManilaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
  }).format(new Date());
}

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export async function cancelBooking(bookingId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const cleanBookingId = bookingId.trim();

    if (!cleanBookingId) {
      return { ok: false, error: "Invalid booking ID." };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ok: false,
        error: "Please log in again before cancelling your booking.",
      };
    }

    const admin = createAdminClient();

    const { data: booking, error: bookingError } = await admin
      .from("tbl_bookings")
      .select(
        "booking_id, user_id, start_date, end_date, rental_fee, security_fee, security_fee_refundable, total_amount, status, cancelled_at"
      )
      .eq("booking_id", cleanBookingId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (bookingError) {
      console.error("[CANCEL_BOOKING_LOOKUP_ERROR]", bookingError);
      return { ok: false, error: "Could not retrieve your booking." };
    }

    if (!booking) {
      return { ok: false, error: "Booking not found." };
    }

    const currentStatus = normalizeStatus(booking.status);

    if (FINAL_STATUSES.includes(currentStatus)) {
      return {
        ok: false,
        error: "This booking can no longer be cancelled.",
      };
    }

    const today = getManilaToday();
    const endDate = String(booking.end_date ?? "").slice(0, 10);

    if (!endDate || endDate < today) {
      return {
        ok: false,
        error: "This booking can no longer be cancelled because its rental period has ended.",
      };
    }

    const cancelledAt = new Date().toISOString();

    const { data: updatedBooking, error: updateBookingError } = await admin
      .from("tbl_bookings")
      .update({
        status: "cancelled",
        cancelled_at: cancelledAt,
      })
      .eq("booking_id", cleanBookingId)
      .eq("user_id", user.id)
      .eq("status", booking.status)
      .select("booking_id")
      .maybeSingle();

    if (updateBookingError) {
      console.error("[CANCEL_BOOKING_UPDATE_ERROR]", updateBookingError);
      return { ok: false, error: "Could not cancel your booking. Please try again." };
    }

    if (!updatedBooking) {
      return {
        ok: false,
        error: "Your booking status has changed. Refresh the page and try again.",
      };
    }

    const { data: payment, error: paymentLookupError } = await admin
      .from("tbl_payments")
      .select("payment_id, payment_status, refund_status")
      .eq("booking_id", cleanBookingId)
      .maybeSingle();

    if (paymentLookupError) {
      console.error("[CANCEL_BOOKING_PAYMENT_LOOKUP_ERROR]", paymentLookupError);
    } else if (payment) {
      const paymentStatus = normalizeStatus(payment.payment_status);
      const refundStatus = normalizeStatus(payment.refund_status);

      if (!["processing", "refunded"].includes(refundStatus)) {
        const isPaid = PAID_PAYMENT_STATUSES.includes(paymentStatus);

        const refund = isPaid
          ? calculateCancellationRefund({
              startDate: booking.start_date,
              cancelledAt,
              rentalFee: booking.rental_fee,
              securityFee: booking.security_fee,
              securityFeeRefundable: booking.security_fee_refundable,
              totalAmount: booking.total_amount,
            })
          : null;

        const { error: paymentUpdateError } = await admin
          .from("tbl_payments")
          .update({
            refund_status: refund
              ? refund.refundStatus
              : "not_applicable",
            refund_amount: refund ? refund.refundAmount : 0,
            refund_reason: refund ? refund.breakdownLabel : null,
          })
          .eq("payment_id", payment.payment_id);

        if (paymentUpdateError) {
          console.error("[CANCEL_BOOKING_REFUND_UPDATE_ERROR]", paymentUpdateError);
        }
      }
    }

    revalidatePath("/renter/my-rentals");

    return { ok: true };
  } catch (error) {
    console.error("[CANCEL_BOOKING_ERROR]", error);

    return {
      ok: false,
      error: "An unexpected error occurred while cancelling your booking.",
    };
  }
}
