import type { RentalUnit } from '@/lib/type';

const unitImageMap = [
  ['sony zv', '/Pics/Cameras/SONY ZV-E10.jpg'],
  ['sony a6000', '/Pics/Cameras/SONY A6000 (KIT LENS).jpg'],
  ['canon 60d', '/Pics/Cameras/CANON 6OD (5OMM LENS).jpg'],
  ['canon 1500d', '/Pics/Cameras/CANON 150OD (KIT LENS).jpg'],
  ['canon 1300d', '/Pics/Cameras/CANON 1300D (KIT LENS).jpg'],
  ['canon 3000d', '/Pics/Cameras/CANON 3000D (KIT LENS).jpg'],
  ['canon g7x mark ii', '/Pics/Cameras/CANON G7X MARK II.jpg'],
  ['canon g7x mark iii', '/Pics/Cameras/CANON G7X MARK III.jpg'],
  ['canon powershot v1', '/Pics/Cameras/CANON POWERSHOT V1.jpg'],
  ['canon ixus 285', '/Pics/Cameras/CANON IXUS 285 HS.jpg'],
  ['panasonic lumix dc-zs70', '/Pics/Cameras/PANASONIC LUMIX DC-ZS70.jpg'],
  ['dji osmo pocket 3 creator', '/Pics/Cameras/DJI OSMO POCKET 3 (CREATOR COMBO).jpg'],
  ['dji osmo pocket 3 standard', '/Pics/Cameras/DJI OSMO POCKET 3 (STANDARD COMBO).jpg'],
  ['dji osmo pocket 4', '/Pics/Cameras/DJI OSMO POCKET 4 (CREATOR COMBO).jpg'],
  ['insta360 x5', '/Pics/Cameras/INSTA 360 X5.jpg'],
  ['insta360 go ultra', '/Pics/Cameras/INSTA 360 GO ULTRA.jpg'],
  ['kodak pixpro fz55', '/Pics/Cameras/KODAK PIXPRO FZ55.jpg'],
  ['fujifilm instax mini evo', '/Pics/Cameras/FUJIFILM INSTAX MINI EVO.jpg'],
  ['dji osmo action 5 pro', '/Pics/Cameras/DJI OSMO ACTION 5 PRO.jpg'],
  ['canon 18-200', '/Pics/Cameras/CANON 18-200 MM SIGMAZOOM LENS.png'],
  ['50mm lens', '/Pics/Cameras/50MM LENS.png'],
  ['extra batteries', '/Pics/Cameras/CANON, SONY, AND GOPRO EXTRA BATTERIES.png'],
  ['64gb sd card', '/Pics/Cameras/EXTRA 64GB SD CARD.png'],
  ['iphone 18 pro max burgundy', '/Pics/Phone/IPHONE 18 PRO MAX BURGUNDY.png'],
  ['iphone 18 pro max glacier', '/Pics/Phone/IPHONE 18 PRO MAX GLACIER.png'],
  ['iphone duo', '/Pics/Phone/IPHONE DUO.png'],
  ['iphone 17 pro max cosmic orange', '/Pics/Phone/IPHONE 17 PRO MAX COSMIC ORANGE.png'],
  ['iphone 16 pro max desert titanium', '/Pics/Phone/IPHONE 16 PRO MAX DESERT TITANIUM.png'],
  ['iphone 15 pro max blue titanium', '/Pics/Phone/IPHONE 15 PRO MAX BLUE TITANIUM.png'],
  ['samsung s24 ultra', '/Pics/Phone/SAMSUNG S24 ULTRA TITANIUM YELLOW.png'],
  ['samsung s26 ultra', '/Pics/Phone/SAMSUNG S26 ULTRA TITANIUM GRAY.png'],
  ['honda city s', '/Pics/Cars/HONDA CITY S 2026.png'],
  ['mitsubishi xpander', '/Pics/Cars/MITSUBISHI XPANDER GLS 2025.png'],
] as const;

export function resolveUnitImageUrl(unitName?: string | null, _category?: string | null): string | null {
  if (!unitName) return null;

  const normalized = unitName.toLowerCase();
  const directMatch = unitImageMap.find(([key]) => normalized.includes(key));
  return directMatch?.[1] ?? null;
}

export const demoUnits: RentalUnit[] = [
  { unit_id: 'demo-canon-60d', id: 'demo-canon-60d', unit_name: 'Canon 60D (50mm Lens)', category: 'Camera', description: 'DSLR camera with 50mm lens.', price_per_day: 950, image_url: resolveUnitImageUrl('Canon 60D (50mm Lens)', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-canon-1500d', id: 'demo-canon-1500d', unit_name: 'Canon 1500D (Kit Lens)', category: 'Camera', description: 'Entry-level DSLR with kit lens.', price_per_day: 900, image_url: resolveUnitImageUrl('Canon 1500D (Kit Lens)', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-canon-1300d', id: 'demo-canon-1300d', unit_name: 'Canon 1300D (Kit Lens)', category: 'Camera', description: 'Reliable DSLR with kit lens.', price_per_day: 700, image_url: resolveUnitImageUrl('Canon 1300D (Kit Lens)', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-canon-3000d', id: 'demo-canon-3000d', unit_name: 'Canon 3000D (Kit Lens)', category: 'Camera', description: 'Compact DSLR with kit lens.', price_per_day: 600, image_url: resolveUnitImageUrl('Canon 3000D (Kit Lens)', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-sony-a6000', id: 'demo-sony-a6000', unit_name: 'Sony a6000 (Kit Lens)', category: 'Camera', description: 'Compact mirrorless camera with kit lens.', price_per_day: 850, image_url: resolveUnitImageUrl('Sony a6000 (Kit Lens)', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-canon-g7x-ii', id: 'demo-canon-g7x-ii', unit_name: 'Canon G7X Mark II', category: 'Camera', description: 'Pocket camera for travel and content creation.', price_per_day: 700, image_url: resolveUnitImageUrl('Canon G7X Mark II', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-canon-g7x-iii', id: 'demo-canon-g7x-iii', unit_name: 'Canon G7X Mark III', category: 'Camera', description: 'Compact camera with creator-focused video features.', price_per_day: 800, image_url: resolveUnitImageUrl('Canon G7X Mark III', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-canon-powershot-v1', id: 'demo-canon-powershot-v1', unit_name: 'Canon PowerShot V1', category: 'Camera', description: 'Compact vlogging camera.', price_per_day: 650, image_url: resolveUnitImageUrl('Canon PowerShot V1', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-sony-zv-e10', id: 'demo-sony-zv-e10', unit_name: 'Sony ZV-E10', category: 'Camera', description: 'Interchangeable-lens camera for creators.', price_per_day: 650, image_url: resolveUnitImageUrl('Sony ZV-E10', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-panasonic-zs70', id: 'demo-panasonic-zs70', unit_name: 'Panasonic Lumix DC-ZS70', category: 'Camera', description: 'Travel zoom compact camera.', price_per_day: 500, image_url: resolveUnitImageUrl('Panasonic Lumix DC-ZS70', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-dji-pocket-3-creator', id: 'demo-dji-pocket-3-creator', unit_name: 'DJI Osmo Pocket 3 (Creator Combo)', category: 'Camera', description: 'Pocket gimbal camera with creator accessories.', price_per_day: 700, image_url: resolveUnitImageUrl('DJI Osmo Pocket 3 (Creator Combo)', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-dji-pocket-3-standard', id: 'demo-dji-pocket-3-standard', unit_name: 'DJI Osmo Pocket 3 (Standard Combo)', category: 'Camera', description: 'Pocket gimbal camera for stabilized footage.', price_per_day: 650, image_url: resolveUnitImageUrl('DJI Osmo Pocket 3 (Standard Combo)', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-dji-pocket-4', id: 'demo-dji-pocket-4', unit_name: 'DJI Osmo Pocket 4 (Creator Combo)', category: 'Camera', description: 'Pocket gimbal camera with creator accessories.', price_per_day: 800, image_url: resolveUnitImageUrl('DJI Osmo Pocket 4 (Creator Combo)', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-insta360-x5', id: 'demo-insta360-x5', unit_name: 'Insta360 X5', category: 'Camera', description: '360-degree action camera.', price_per_day: 700, image_url: resolveUnitImageUrl('Insta360 X5', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-insta360-go-ultra', id: 'demo-insta360-go-ultra', unit_name: 'Insta360 GO Ultra', category: 'Camera', description: 'Small wearable action camera.', price_per_day: 450, image_url: resolveUnitImageUrl('Insta360 GO Ultra', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-kodak-fz55', id: 'demo-kodak-fz55', unit_name: 'Kodak Pixpro FZ55', category: 'Camera', description: 'Compact point-and-shoot camera.', price_per_day: 200, image_url: resolveUnitImageUrl('Kodak Pixpro FZ55', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-canon-ixus-285', id: 'demo-canon-ixus-285', unit_name: 'Canon IXUS 285 HS', category: 'Camera', description: 'Slim compact digital camera.', price_per_day: 450, image_url: resolveUnitImageUrl('Canon IXUS 285 HS', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-fujifilm-instax-mini-evo', id: 'demo-fujifilm-instax-mini-evo', unit_name: 'Fujifilm Instax Mini Evo', category: 'Camera', description: 'Hybrid instant camera; film not included.', price_per_day: 400, image_url: resolveUnitImageUrl('Fujifilm Instax Mini Evo', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-dji-action-5-pro', id: 'demo-dji-action-5-pro', unit_name: 'DJI Osmo Action 5 Pro', category: 'Camera', description: 'Rugged action camera.', price_per_day: 600, image_url: resolveUnitImageUrl('DJI Osmo Action 5 Pro', 'Camera'), status: 'available', avg_rating: null },
  { unit_id: 'demo-iphone-17-pro-max', id: 'demo-iphone-17-pro-max', unit_name: 'iPhone 17 Pro Max Cosmic Orange', category: 'Smartphone', description: 'Daily rate: PHP 2,000 for two days and above; PHP 2,500 for one day.', price_per_day: 2000, image_url: resolveUnitImageUrl('iPhone 17 Pro Max Cosmic Orange', 'Smartphone'), status: 'available', avg_rating: null },
  { unit_id: 'demo-iphone-16-pro-max', id: 'demo-iphone-16-pro-max', unit_name: 'iPhone 16 Pro Max Desert Titanium', category: 'Smartphone', description: 'Daily rate: PHP 1,600 for two days and above; PHP 2,100 for one day.', price_per_day: 1600, image_url: resolveUnitImageUrl('iPhone 16 Pro Max Desert Titanium', 'Smartphone'), status: 'available', avg_rating: null },
  { unit_id: 'demo-iphone-15-pro-max', id: 'demo-iphone-15-pro-max', unit_name: 'iPhone 15 Pro Max Blue Titanium', category: 'Smartphone', description: 'Daily rate: PHP 1,500 for two days and above; PHP 2,000 for one day.', price_per_day: 1500, image_url: resolveUnitImageUrl('iPhone 15 Pro Max Blue Titanium', 'Smartphone'), status: 'available', avg_rating: null },
  { unit_id: 'demo-samsung-s24-ultra', id: 'demo-samsung-s24-ultra', unit_name: 'Samsung S24 Ultra Titanium Yellow', category: 'Smartphone', description: 'Daily rate: PHP 1,500 for two days and above; PHP 2,000 for one day.', price_per_day: 1500, image_url: resolveUnitImageUrl('Samsung S24 Ultra Titanium Yellow', 'Smartphone'), status: 'available', avg_rating: null },
  { unit_id: 'demo-samsung-s26-ultra', id: 'demo-samsung-s26-ultra', unit_name: 'Samsung S26 Ultra Titanium Gray', category: 'Smartphone', description: 'Daily rate: PHP 2,000 for two days and above; PHP 2,500 for one day.', price_per_day: 2000, image_url: resolveUnitImageUrl('Samsung S26 Ultra Titanium Gray', 'Smartphone'), status: 'available', avg_rating: null },
  { unit_id: 'demo-canon-18-200', id: 'demo-canon-18-200', unit_name: 'Canon 18-200mm SigmaZoom Lens', category: 'Add-on', description: 'PHP 400/day as add-on; PHP 600/day if lens only.', price_per_day: 400, image_url: resolveUnitImageUrl('Canon 18-200mm SigmaZoom Lens', 'Add-on'), status: 'available', avg_rating: null },
  { unit_id: 'demo-50mm-lens', id: 'demo-50mm-lens', unit_name: '50mm Lens', category: 'Add-on', description: 'PHP 300/day as add-on; PHP 500/day if lens only.', price_per_day: 300, image_url: resolveUnitImageUrl('50mm Lens', 'Add-on'), status: 'available', avg_rating: null },
  { unit_id: 'demo-camera-tripod', id: 'demo-camera-tripod', unit_name: 'Camera Tripod', category: 'Add-on', description: 'Tripod accessory for camera rentals.', price_per_day: 100, image_url: resolveUnitImageUrl('Camera Tripod', 'Add-on'), status: 'available', avg_rating: null },
  { unit_id: 'demo-extra-batteries', id: 'demo-extra-batteries', unit_name: 'Canon, Sony, and GoPro Extra Batteries', category: 'Add-on', description: 'Extra battery accessory.', price_per_day: 25, image_url: resolveUnitImageUrl('Canon, Sony, and GoPro Extra Batteries', 'Add-on'), status: 'available', avg_rating: null },
  { unit_id: 'demo-sd-card', id: 'demo-sd-card', unit_name: 'Extra 64GB SD Card', category: 'Add-on', description: '64GB SD card accessory.', price_per_day: 50, image_url: resolveUnitImageUrl('Extra 64GB SD Card', 'Add-on'), status: 'available', avg_rating: null },
  { unit_id: 'demo-mitsubishi-xpander', id: 'demo-mitsubishi-xpander', unit_name: 'Mitsubishi Xpander GLS 2025', category: 'Vehicle', description: 'Automatic transmission, unlimited mileage, fixed daily rate.', price_per_day: 3000, image_url: resolveUnitImageUrl('Mitsubishi Xpander GLS 2025', 'Vehicle'), status: 'available', avg_rating: null },
  { unit_id: 'demo-honda-city-s', id: 'demo-honda-city-s', unit_name: 'Honda City S 2026', category: 'Vehicle', description: 'Automatic transmission, unlimited mileage, fixed daily rate.', price_per_day: 2300, image_url: resolveUnitImageUrl('Honda City S 2026', 'Vehicle'), status: 'available', avg_rating: null },
];
