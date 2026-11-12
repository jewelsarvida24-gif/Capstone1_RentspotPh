export const SECURITY_FEE = 300;

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
}) {
  const rentalDays = calculateRentalDays(params.startDate, params.endDate);
  const rate = Number(params.dailyRate) || 0;
  const rentalFee = Number((rentalDays * rate).toFixed(2));
  const securityFee = rentalDays > 0 ? SECURITY_FEE : 0;
  const total = Number((rentalFee + securityFee).toFixed(2));

  return {
    rentalDays,
    rentalFee,
    securityFee,
    total,
  };
}