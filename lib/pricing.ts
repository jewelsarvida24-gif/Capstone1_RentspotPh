export const SECURITY_FEE = 300;

// Longest allowed rental, counting the start and end dates (1 week).
export const MAX_RENTAL_DAYS = 7;

export type BookingAddOn = {
  unit_id: string;
  unit_name: string;
  daily_rate: number;
};

export function isAddOnCategory(category: string | null | undefined) {
  const normalized = (category ?? '').toLowerCase().replace(/[^a-z]/g, '');
  return normalized === 'addon' || normalized === 'addons';
}

export function isCameraCategory(category: string | null | undefined) {
  return (category ?? '').toLowerCase().startsWith('camera');
}

export function getTodayInManila() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
}

export function calculateRentalDays(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${endDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.floor((end - start) / 86_400_000) + 1;
}

export function calculateBooking(params: {
  dailyRate: number | string;
  startDate: string;
  endDate: string;
  addOnDailyRate?: number | string;
}) {
  const rentalDays = calculateRentalDays(params.startDate, params.endDate);
  const rate = Number(params.dailyRate) || 0;
  const addOnRate = Number(params.addOnDailyRate ?? 0) || 0;
  const rentalFee = Number((rentalDays * (rate + addOnRate)).toFixed(2));
  const addOnFee = Number((rentalDays * addOnRate).toFixed(2));
  const securityFee = rentalDays > 0 ? SECURITY_FEE : 0;
  const total = Number((rentalFee + securityFee).toFixed(2));

  return {
    rentalDays,
    rentalFee,
    addOnFee,
    securityFee,
    total,
  };
}