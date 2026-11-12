// Single source of truth for booking statuses and the pending-payment hold.

// Hold time for a pending_payment booking. Set to 3 while testing, then back to 30.
export const PENDING_HOLD_MINUTES = 30;
export const PENDING_HOLD_MS = PENDING_HOLD_MINUTES * 60 * 1000;

// Final status list for the team.
export const FINAL_BOOKING_STATUSES = [
  'pending_payment',
  'awaiting_review',
  'approved',
  'active',
  'returned',
  'completed',
  'cancelled',
  'rejected',
  'expired',
  'overdue',
] as const;

export const BOOKING_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  // The database value used today for "awaiting review". At cutover (after the other files
  // and the SQL migration are updated) change this one line to 'awaiting_review'.
  AWAITING_REVIEW: 'paid_awaiting_verification',
  APPROVED: 'approved',
  ACTIVE: 'active',
  RETURNED: 'returned',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  OVERDUE: 'overdue',
} as const;

export function normalizeStatus(status: string | null | undefined) {
  return (status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

// Statuses that block a unit's dates (plus the buffer day after end_date).
// Legacy names stay here until old rows are migrated, so old bookings keep blocking dates.
export const DATE_BLOCKING_STATUSES = new Set<string>([
  BOOKING_STATUS.PENDING_PAYMENT,
  BOOKING_STATUS.AWAITING_REVIEW,
  'awaiting_review',
  BOOKING_STATUS.APPROVED,
  BOOKING_STATUS.ACTIVE,
  BOOKING_STATUS.OVERDUE,
  // legacy
  'pending',
  'pending_admin_review',
  'paid_awaiting_verification',
  'confirmed',
]);