export const PAYMENT_SESSION_TTL_MS = 15 * 60 * 1000;

const UNIT_BLOCKING_BOOKING_STATUSES = new Set([
  "pending",
  "pending_payment",
  "pending_admin_review",
  "paid_awaiting_verification",
  "approved",
  "confirmed",
]);

export function isBookingBlockingUnit(status: string | null, createdAt?: string | null) {
  const normalizedStatus = (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!UNIT_BLOCKING_BOOKING_STATUSES.has(normalizedStatus)) return false;

  if (normalizedStatus === "pending_payment" && createdAt) {
    const createdAtMs = new Date(createdAt).getTime();
    if (
      Number.isFinite(createdAtMs) &&
      Date.now() - createdAtMs >= PAYMENT_SESSION_TTL_MS
    ) {
      return false;
    }
  }

  return true;
}
