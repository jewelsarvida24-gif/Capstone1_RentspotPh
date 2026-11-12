// One timer for the pending-payment hold, used by every route.
export const PENDING_HOLD_MS = 300* 60 * 1000;

// Statuses that block a unit's dates (plus the buffer day after end_date).
export const DATE_BLOCKING_STATUSES = new Set<string>([
  'pending',
  'pending_payment',
  'pending_admin_review',
  'paid_awaiting_verification',
  'approved',
  'confirmed',
]);