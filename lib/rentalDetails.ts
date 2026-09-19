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
  if (details) return { ...unit, ...details };

  const unitName = unit.unit_name.toLowerCase();
  if (unit.category?.toLowerCase() === 'camera') {
    if (unitName.includes('canon 60d')) {
      return {
        ...unit,
        description: 'A dependable DSLR camera with a versatile 50mm lens for portraits, events, and everyday photography.',
        included_items: ['Canon 60D camera body', '50mm lens', 'Battery and charger', 'Memory card', 'Camera bag'],
      };
    }

    if (unitName.includes('canon 1500d')) {
      return {
        ...unit,
        description: 'An easy-to-use DSLR camera with a kit lens for beginner photographers, travel, and casual shoots.',
        included_items: ['Canon 1500D camera body', 'Kit lens', 'Battery and charger', 'Memory card', 'Camera bag'],
      };
    }
  }

  if (unit.category?.toLowerCase() === 'smartphone' || unit.category?.toLowerCase() === 'phone') {
    if (unitName.includes('iphone 17')) {
      return {
        ...unit,
        description: 'A flagship smartphone with a pro camera system, bright display, and fast performance for travel and content creation.',
        included_items: ['iPhone 17 Pro Max', 'Protective case', 'USB-C charging cable', 'Power adapter', 'Rental pouch'],
      };
    }

    if (unitName.includes('iphone 16')) {
      return {
        ...unit,
        description: 'A premium smartphone with advanced cameras, all-day battery life, and smooth performance for work and everyday use.',
        included_items: ['iPhone 16 Pro Max', 'Protective case', 'USB-C charging cable', 'Power adapter', 'Rental pouch'],
      };
    }

    if (unitName.includes('iphone 15')) {
      return {
        ...unit,
        description: 'A capable pro smartphone for high-quality photos, video, navigation, and reliable everyday performance.',
        included_items: ['iPhone 15 Pro Max', 'Protective case', 'USB-C charging cable', 'Power adapter', 'Rental pouch'],
      };
    }

    if (unitName.includes('s24 ultra')) {
      return {
        ...unit,
        description: 'A large-screen Android smartphone with a versatile camera system, S Pen support, and powerful performance.',
        included_items: ['Samsung S24 Ultra', 'Protective case', 'USB-C charging cable', 'Power adapter', 'Rental pouch'],
      };
    }
  }

  if (unit.category?.toLowerCase() === 'vehicle' || unit.category?.toLowerCase() === 'car') {
    if (unitName.includes('xpander')) {
      return {
        ...unit,
        description: 'A spacious automatic MPV for family trips, group travel, errands, and comfortable city driving.',
        included_items: ['Mitsubishi Xpander GLS 2025', 'Automatic transmission', 'Unlimited mileage', 'Full tank at pickup', 'Vehicle documents'],
      };
    }
  }

  return unit;
}
