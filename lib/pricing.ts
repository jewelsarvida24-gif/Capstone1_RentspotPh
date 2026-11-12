export const SECURITY_FEE = 300;

// Today's date in Philippine time as YYYY-MM-DD (not UTC).
export function getTodayInManila() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// Inclusive day count: Nov 1 to Nov 3 = 3 days, and start === end = 1 day.
export function countRentalDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    throw new Error('Invalid rental dates.');
  }

  return Math.round((end - start) / 86_400_000) + 1;
}

export type BookingPricing = {
  rentalDays: number;
  rentalFee: number;
  securityFee: number;
  total: number;
};

export function calculateBooking({
  dailyRate,
  startDate,
  endDate,
}: {
  dailyRate: number;
  startDate: string;
  endDate: string;
}): BookingPricing {
  if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
    throw new Error('Invalid daily rate.');
  }

  const rentalDays = countRentalDays(startDate, endDate);

  // If your Pricing Check tab has discounts or tiers for longer rentals, add them here.
  const rentalFee = Number((dailyRate * rentalDays).toFixed(2));
  const securityFee = SECURITY_FEE;
  const total = Number((rentalFee + securityFee).toFixed(2));

  return { rentalDays, rentalFee, securityFee, total };
}