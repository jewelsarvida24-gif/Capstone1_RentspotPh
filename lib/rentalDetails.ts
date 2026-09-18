import type { RentalUnit } from '@/lib/types';

const detailsByUnitId: Record<string, { description: string; included_items: string[] }> = {
  'cam-01': {
    description: 'A full-frame mirrorless camera kit for portraits, events, travel, and video projects.',
    included_items: ['Sony A7 IV camera body', 'Standard lens kit', 'Battery and charger', 'Memory card', 'Camera bag'],
  },
  'cam-02': {
    description: 'A capable full-frame camera for sharp photos, reliable autofocus, and polished video work.',
    included_items: ['Canon EOS R6 camera body', 'Lens kit', 'Battery and charger', 'Memory card', 'Camera bag'],
  },
  'phone-01': {
    description: 'A premium smartphone for high-quality photos, video, travel, and everyday creative work.',
    included_items: ['iPhone 15 Pro Max', 'Protective case', 'Charger', 'Power bank', 'Rental bag'],
  },
  'vehicle-01': {
    description: 'A compact car for city trips, errands, and comfortable weekend travel.',
    included_items: ['Toyota Wigo 2024', 'Automatic transmission', 'Full tank at pickup', 'Vehicle documents'],
  },
  'laptop-01': {
    description: 'A powerful laptop for editing, presentations, development, and other demanding creative work.',
    included_items: ['MacBook Pro 14-inch', 'Power adapter', 'Protective sleeve', 'Charging cable'],
  },
  'drone-01': {
    description: 'A compact aerial camera for stabilized video and travel projects. This unit is not available yet.',
    included_items: ['DJI Mini 3 Pro', 'Battery and charger', 'Controller', 'Propeller guards', 'Carrying case'],
  },
};

export function withRentalDetails(unit: RentalUnit): RentalUnit {
  const details = detailsByUnitId[String(unit.unit_id)];
  return details ? { ...unit, ...details } : unit;
}
