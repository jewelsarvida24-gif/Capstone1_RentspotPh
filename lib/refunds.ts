import { SECURITY_FEE, getTodayInManila } from '@/lib/pricing';

export type RefundStatus =
  | 'not_applicable'
  | 'eligible'
  | 'processing'
  | 'refunded'
  | 'failed'
  | 'not_eligible';

export type RefundCalculationInput = {
  startDate: string;
  cancelledAt?: string | Date | null;
  rentalFee: number | string | null | undefined;
  securityFee: number | string | null | undefined;
  totalAmount?: number | string | null | undefined;
};

export type RefundCalculationResult = {
  eligible: boolean;
  refundStatus: 'eligible' | 'not_eligible';
  refundAmount: number;
  daysBeforeStart: number;
  cancelDateManila: string;
  startDateManila: string;
  ruleApplied: 'four_or_more_days_70pct_rental' | 'zero_to_three_days_security_only' | 'after_start_ineligible';
  breakdownLabel: string;
};

/**
 * Converts a Date or ISO timestamp into a YYYY-MM-DD calendar date in Asia/Manila (UTC+8).
 */
export function toManilaDateString(value?: string | Date | null): string {
  if (!value) return getTodayInManila();

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return getTodayInManila();
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * Computes whole calendar days between cancelDateManila and startDateManila:
 *   startDateManila - cancelDateManila
 */
export function getManilaCalendarDaysBeforeStart(
  startDate: string,
  cancelledAt?: string | Date | null
): { daysBeforeStart: number; cancelDateManila: string; startDateManila: string } {
  const startDateManila = toManilaDateString(startDate.slice(0, 10));
  const cancelDateManila = toManilaDateString(cancelledAt);

  const startMs = Date.parse(`${startDateManila}T00:00:00.000Z`);
  const cancelMs = Date.parse(`${cancelDateManila}T00:00:00.000Z`);

  if (Number.isNaN(startMs) || Number.isNaN(cancelMs)) {
    throw new Error('Invalid start_date or cancelled_at date for refund calculation.');
  }

  const daysBeforeStart = Math.round((startMs - cancelMs) / 86_400_000);
  return { daysBeforeStart, cancelDateManila, startDateManila };
}

/**
 * Policy:
 * - >= 4 calendar days before start_date (PHT): 70% of rental_fee only (total_amount minus security_fee).
 * - 0 to 3 calendar days before start_date, including start day (PHT): security_fee only.
 * - < 0 days (after start_date): ineligible for automatic refund (₱0).
 */
export function calculateCancellationRefund({
  startDate,
  cancelledAt,
  rentalFee,
  securityFee,
  totalAmount,
}: RefundCalculationInput): RefundCalculationResult {
  const { daysBeforeStart, cancelDateManila, startDateManila } = getManilaCalendarDaysBeforeStart(
    startDate,
    cancelledAt
  );

  const rawTotal = Number(totalAmount);
  const parsedTotal = Number.isFinite(rawTotal) && rawTotal > 0 ? rawTotal : NaN;

  const rawSecurity = Number(securityFee);
  const parsedSecurityFee =
    securityFee !== null && securityFee !== undefined && Number.isFinite(rawSecurity) && rawSecurity > 0
      ? rawSecurity
      : SECURITY_FEE;

  const rawRental = Number(rentalFee);
  let parsedRentalFee =
    rentalFee !== null && rentalFee !== undefined && Number.isFinite(rawRental) && rawRental > 0
      ? rawRental
      : NaN;

  // Derive rental_fee from total_amount - security_fee when rental_fee wasn't stored (null or 0)
  if (!Number.isFinite(parsedRentalFee) && Number.isFinite(parsedTotal)) {
    parsedRentalFee = Math.max(0, Number((parsedTotal - parsedSecurityFee).toFixed(2)));
  }

  if (daysBeforeStart >= 4) {
    const safeRental = Number.isFinite(parsedRentalFee) ? Math.max(0, parsedRentalFee) : 0;
    const refundAmount = Number((safeRental * 0.7).toFixed(2));
    return {
      eligible: refundAmount > 0,
      refundStatus: refundAmount > 0 ? 'eligible' : 'not_eligible',
      refundAmount,
      daysBeforeStart,
      cancelDateManila,
      startDateManila,
      ruleApplied: 'four_or_more_days_70pct_rental',
      breakdownLabel: `70% of rental fee ₱${safeRental.toFixed(2)} (${daysBeforeStart} days before start)`,
    };
  }

  if (daysBeforeStart >= 0 && daysBeforeStart <= 3) {
    const refundAmount = Number(Math.max(0, parsedSecurityFee).toFixed(2));
    return {
      eligible: refundAmount > 0,
      refundStatus: refundAmount > 0 ? 'eligible' : 'not_eligible',
      refundAmount,
      daysBeforeStart,
      cancelDateManila,
      startDateManila,
      ruleApplied: 'zero_to_three_days_security_only',
      breakdownLabel:
        daysBeforeStart === 0
          ? 'Security fee only (cancelled on start date)'
          : `Security fee only (${daysBeforeStart} day${daysBeforeStart === 1 ? '' : 's'} before start)`,
    };
  }

  return {
    eligible: false,
    refundStatus: 'not_eligible',
    refundAmount: 0,
    daysBeforeStart,
    cancelDateManila,
    startDateManila,
    ruleApplied: 'after_start_ineligible',
    breakdownLabel: 'Cancelled after rental start date (not eligible for automatic refund)',
  };
}