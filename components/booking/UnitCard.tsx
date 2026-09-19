'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Camera, Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { RentalUnit } from '@/lib/type';

export function UnitCard({ unit }: { unit: RentalUnit }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const image = typeof unit.image_url === 'string' && unit.image_url ? unit.image_url : '';
  const dailyRate = typeof unit.price_per_day === 'number'
    ? unit.price_per_day
    : typeof (unit as RentalUnit & { daily_rate?: number }).daily_rate === 'number'
      ? (unit as RentalUnit & { daily_rate: number }).daily_rate
      : null;
  const price = dailyRate !== null ? `PHP ${dailyRate.toLocaleString()}/day` : 'Price available on request';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return <>
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(15,23,42,0.13)]">
      <div className="relative flex aspect-[1.45] items-center justify-center overflow-hidden rounded-xl bg-slate-100">{unit.image_url ? <Image src={image} alt={unit.unit_name} fill className="object-contain p-6" unoptimized={image.startsWith('http')} /> : <Camera className="h-12 w-12 text-slate-400" strokeWidth={1.7} />}</div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{unit.category || 'Rental unit'}</p><h2 className="mt-1 line-clamp-2 text-lg font-bold text-slate-900">{unit.unit_name}</h2></div>{unit.avg_rating ? <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-600"><Star className="h-3.5 w-3.5 fill-current" />{unit.avg_rating.toFixed(1)}</span> : null}</div><p className="mt-3 text-sm font-semibold text-slate-700">{price}</p><button type="button" onClick={() => setIsOpen(true)} className="mt-auto inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-600 hover:bg-brand-600 hover:text-white">View Unit</button></div>
    </article>

    {isOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/25 p-4 backdrop-blur-[3px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={`unit-title-${unit.unit_id}`} className="relative my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <button type="button" onClick={() => setIsOpen(false)} aria-label="Close unit details" className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"><X className="h-5 w-5" /></button>
        <div className="relative flex h-56 items-center justify-center bg-slate-100 sm:h-64">{unit.image_url ? <Image src={image} alt={unit.unit_name} fill className="object-contain p-10" unoptimized={image.startsWith('http')} /> : <Camera className="h-16 w-16 text-slate-400" strokeWidth={1.5} />}</div>
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">{unit.category || 'Rental unit'}</p>
          <h2 id={`unit-title-${unit.unit_id}`} className="mt-2 pr-10 text-2xl font-bold text-slate-900">{unit.unit_name}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">{unit.description || 'A reliable rental unit for your next plan.'}</p>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"><span className="text-sm font-medium text-slate-500">Daily rate</span><span className="text-lg font-bold text-slate-900">{price}</span></div>
          <button type="button" onClick={() => router.push(`/guest/browse/${unit.unit_id}`)} className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Book Now</button>
        </div>
      </section>
    </div>}
  </>;
}
