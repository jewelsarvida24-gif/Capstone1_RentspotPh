export type ListingCategory = 'Camera' | 'Phone' | 'Car' | 'Drone';
export type ListingStatus = 'available' | 'unavailable';

export interface ListingUnit {
  id: string;
  name: string;
  category: Exclude<ListingCategory, 'Drone'>;
  description?: string;
  includedItems?: string[];
  imageUrl?: string;
  pricePerDay?: number;
  status: ListingStatus;
}

export const listingCategories: ListingCategory[] = [
  'Camera',
  'Phone',
  'Car',
  'Drone',
];

export const listingUnits: ListingUnit[] = [
  {
    id: 'canon-1300d-kit-lens',
    name: 'Canon 1300D (Kit Lens)',
    category: 'Camera',
    imageUrl: '/images/units/camera/canon-1300d-kit-lens.jpg',
    status: 'available',
  },
  {
    id: 'canon-1500d-kit-lens',
    name: 'Canon 1500D (Kit Lens)',
    category: 'Camera',
    imageUrl: '/images/units/camera/canon-1500d-kit-lens.jpg',
    status: 'available',
  },
  {
    id: 'canon-3000d-kit-lens',
    name: 'Canon 3000D (Kit Lens)',
    category: 'Camera',
    imageUrl: '/images/units/camera/canon-3000d-kit-lens.jpg',
    status: 'available',
  },
  {
    id: 'canon-60d-50mm-lens',
    name: 'Canon 60D (50mm Lens)',
    category: 'Camera',
    imageUrl: '/images/units/camera/canon-60d-50mm-lens.jpg',
    status: 'available',
  },
  {
    id: 'canon-g7x-mark-ii',
    name: 'Canon G7X Mark II',
    category: 'Camera',
    imageUrl: '/images/units/camera/canon-g7x-mark-ii.jpg',
    status: 'available',
  },
  {
    id: 'canon-g7x-mark-iii',
    name: 'Canon G7X Mark III',
    category: 'Camera',
    imageUrl: '/images/units/camera/canon-g7x-mark-iii.jpg',
    status: 'available',
  },
  {
    id: 'canon-ixus-285-hs',
    name: 'Canon IXUS 285 HS',
    category: 'Camera',
    imageUrl: '/images/units/camera/canon-ixus-285-hs.jpg',
    status: 'available',
  },
  {
    id: 'canon-powershot-v1',
    name: 'Canon PowerShot V1',
    category: 'Camera',
    imageUrl: '/images/units/camera/canon-powershot-v1.jpg',
    status: 'available',
  },
  {
    id: 'dji-osmo-action-5-pro',
    name: 'DJI Osmo Action 5 Pro',
    category: 'Camera',
    imageUrl: '/images/units/camera/dji-osmo-action-5-pro.jpg',
    status: 'available',
  },
  {
    id: 'dji-osmo-pocket-3-creator-combo',
    name: 'DJI Osmo Pocket 3 (Creator Combo)',
    category: 'Camera',
    imageUrl: '/images/units/camera/dji-osmo-pocket-3-creator-combo.jpg',
    status: 'available',
  },
  {
    id: 'dji-osmo-pocket-3-standard-combo',
    name: 'DJI Osmo Pocket 3 (Standard Combo)',
    category: 'Camera',
    imageUrl: '/images/units/camera/dji-osmo-pocket-3-standard-combo.jpg',
    status: 'available',
  },
  {
    id: 'dji-osmo-pocket-4-creator-combo',
    name: 'DJI Osmo Pocket 4 (Creator Combo)',
    category: 'Camera',
    imageUrl: '/images/units/camera/dji-osmo-pocket-4-creator-combo.jpg',
    status: 'available',
  },
  {
    id: 'fujifilm-instax-mini-evo',
    name: 'Fujifilm Instax Mini Evo',
    category: 'Camera',
    imageUrl: '/images/units/camera/fujifilm-instax-mini-evo.jpg',
    status: 'available',
  },
  {
    id: 'insta360-go-ultra',
    name: 'Insta360 GO Ultra',
    category: 'Camera',
    imageUrl: '/images/units/camera/insta360-go-ultra.jpg',
    status: 'available',
  },
  {
    id: 'insta360-x5',
    name: 'Insta360 X5',
    category: 'Camera',
    imageUrl: '/images/units/camera/insta360-x5.jpg',
    status: 'available',
  },
  {
    id: 'kodak-pixpro-fz55',
    name: 'Kodak PIXPRO FZ55',
    category: 'Camera',
    imageUrl: '/images/units/camera/kodak-pixpro-fz55.jpg',
    status: 'available',
  },
  {
    id: 'panasonic-lumix-dc-zs70',
    name: 'Panasonic Lumix DC-ZS70',
    category: 'Camera',
    imageUrl: '/images/units/camera/panasonic-lumix-dc-zs70.jpg',
    status: 'available',
  },
  {
    id: 'sony-a6000-kit-lens',
    name: 'Sony A6000 (Kit Lens)',
    category: 'Camera',
    imageUrl: '/images/units/camera/sony-a6000-kit-lens.jpg',
    status: 'available',
  },
  {
    id: 'sony-zv-e10',
    name: 'Sony ZV-E10',
    category: 'Camera',
    imageUrl: '/images/units/camera/sony-zv-e10.jpg',
    status: 'available',
  },
  {
    id: 'iphone-15-pro-max-blue-titanium',
    name: 'iPhone 15 Pro Max Blue Titanium',
    category: 'Phone',
    imageUrl: '/images/units/phone/iphone-15-pro-max-blue-titanium.png',
    status: 'available',
  },
  {
    id: 'iphone-16-pro-max-desert-titanium',
    name: 'iPhone 16 Pro Max Desert Titanium',
    category: 'Phone',
    imageUrl: '/images/units/phone/iphone-16-pro-max-desert-titanium.png',
    status: 'available',
  },
  {
    id: 'iphone-17-pro-max-cosmic-orange',
    name: 'iPhone 17 Pro Max Cosmic Orange',
    category: 'Phone',
    imageUrl: '/images/units/phone/iphone-17-pro-max-cosmic-orange.png',
    status: 'available',
  },
  {
    id: 'iphone-18-pro-max-glacier',
    name: 'iPhone 18 Pro Max Glacier',
    category: 'Phone',
    imageUrl: '/images/units/phone/iphone-18-pro-max-glacier.png',
    status: 'unavailable',
  },
  {
    id: 'iphone-18-pro-max-burgundy',
    name: 'iPhone 18 Pro Max Burgundy',
    category: 'Phone',
    imageUrl: '/images/units/phone/iphone-18-pro-max-burgundy.png',
    status: 'unavailable',
  },
  {
    id: 'iphone-duo',
    name: 'iPhone Duo',
    category: 'Phone',
    imageUrl: '/images/units/phone/iphone-duo.png',
    status: 'unavailable',
  },
  {
    id: 'samsung-s24-ultra-titanium-yellow',
    name: 'Samsung S24 Ultra Titanium Yellow',
    category: 'Phone',
    imageUrl: '/images/units/phone/samsung-s24-ultra-titanium-yellow.png',
    pricePerDay: 1100,
    status: 'available',
  },
  {
    id: 'samsung-s25-ultra-titanium-gray',
    name: 'Samsung S25 Ultra Titanium Gray',
    category: 'Phone',
    pricePerDay: 2100,
    status: 'available',
  },
  {
    id: 'samsung-s26-ultra-titanium-gray',
    name: 'Samsung S26 Ultra Titanium Gray',
    category: 'Phone',
    imageUrl: '/images/units/phone/samsung-s26-ultra-titanium-gray.png',
    status: 'available',
  },
  {
    id: 'honda-city-s-2026',
    name: 'Honda City S 2026',
    category: 'Car',
    imageUrl: '/images/units/cars/honda-city-s-2026.png',
    status: 'available',
  },
  {
    id: 'mitsubishi-xpander-gls-2025',
    name: 'Mitsubishi Xpander GLS 2025',
    category: 'Car',
    imageUrl: '/images/units/cars/mitsubishi-xpander-gls-2025.png',
    status: 'available',
  },
];

export function getListingById(id: string) {
  return listingUnits.find((unit) => unit.id === id);
}
