export const rentalTabs = ['upcoming', 'active', 'completed', 'cancelled'] as const;
export type RentalTab = (typeof rentalTabs)[number];

export function bookingTab(status: string): RentalTab {
  const normalized = status.toLowerCase();
  if (['cancelled', 'canceled', 'rejected'].includes(normalized)) return 'cancelled';
  if (['completed', 'returned'].includes(normalized)) return 'completed';
  if (['active', 'in_progress', 'picked_up'].includes(normalized)) return 'active';
  return 'upcoming';
}

export function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}