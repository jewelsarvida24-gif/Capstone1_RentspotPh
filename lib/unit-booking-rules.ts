import { DATE_BLOCKING_STATUSES, PENDING_HOLD_MS } from '@/lib/booking-status';

export function isBookingBlockingUnit(status: string | null, createdAt?: string | null) {
  const normalizedStatus = (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!DATE_BLOCKING_STATUSES.has(normalizedStatus)) return false;

  if (normalizedStatus === "pending_payment" && createdAt) {
    const createdAtMs = new Date(createdAt).getTime();
    if (
      Number.isFinite(createdAtMs) &&
      Date.now() - createdAtMs >= PENDING_HOLD_MS
    ) {
      return false;
    }
  }

  return true;
}