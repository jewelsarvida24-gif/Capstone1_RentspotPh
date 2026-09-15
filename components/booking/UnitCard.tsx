import Image from 'next/image';
import Link from 'next/link';
import { Camera, Star } from 'lucide-react';
import type { RentalUnit } from '@/lib/type';

export function UnitCard({ unit }: { unit: RentalUnit }) {
  const image = typeof unit.image_url === 'string' && unit.image_url ? unit.image_url : '';
  const price = typeof unit.price_per_day === 'number' ? `PHP ${unit.price_per_day.toLocaleString()}/day` : 'Price available on request';
  return <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(15,23,42,0.13)]">
    <div className="relative flex aspect-[1.45] items-center justify-center overflow-hidden rounded-xl bg-slate-100">{unit.image_url ? <Image src={image} alt={unit.unit_name} fill className="object-contain p-6" unoptimized={image.startsWith('http')} /> : <Camera className="h-12 w-12 text-slate-400" strokeWidth={1.7} />}</div>
    <div className="flex flex-1 flex-col px-1 pb-1 pt-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{unit.category || 'Rental unit'}</p><h2 className="mt-1 line-clamp-2 text-lg font-bold text-slate-900">{unit.unit_name}</h2></div>{unit.avg_rating ? <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-600"><Star className="h-3.5 w-3.5 fill-current" />{unit.avg_rating.toFixed(1)}</span> : null}</div><p className="mt-3 text-sm font-semibold text-slate-700">{price}</p><Link href={`/guest/browse/${unit.unit_id}`} className="mt-auto inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-600 hover:bg-brand-600 hover:text-white">View Unit</Link></div>
  </article>;
}
