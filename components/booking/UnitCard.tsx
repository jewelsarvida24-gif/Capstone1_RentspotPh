<<<<<<< HEAD
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import type { RentalUnit } from '@/lib/types';

export function UnitCard({ unit }: { unit: RentalUnit }) {
  const price = Number(unit.price_per_day ?? 0);
  const rating = unit.avg_rating ? Number(unit.avg_rating) : 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative flex h-48 items-center justify-center border-b border-neutral-200 bg-neutral-100 text-neutral-500">
        <div className="h-full w-full border-8 border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,.65),transparent)]" aria-label="Image placeholder" />
        <span className="absolute rounded-full border border-dashed border-neutral-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
          Image coming soon
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
              {unit.category ?? 'General'}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-neutral-900">{unit.unit_name}</h3>
            {unit.location ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                <MapPin className="h-3.5 w-3.5" /> {String(unit.location)}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm font-medium text-amber-700">
            <Star className="h-3.5 w-3.5 fill-current" />
            {rating > 0 ? rating.toFixed(1) : 'New'}
          </div>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-neutral-600">
          {unit.description || 'Available for short- and long-term rentals.'}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">From</p>
            <p className="text-xl font-bold text-blue-600">₱{price.toLocaleString()}</p>
            <p className="text-xs text-neutral-500">per day</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/guest/book/${unit.unit_id}`} className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">
              View details
            </Link>
            <Link href={`/guest/book/${unit.unit_id}`} className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
              {unit.status === 'available' ? 'Book now' : 'View rental'}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
=======
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Camera, Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { RentalUnit } from '@/lib/type';
import { resolveUnitImageUrl } from '@/lib/demoUnits';

export function UnitCard({ unit }: { unit: RentalUnit }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const image = typeof unit.image_url === 'string' && unit.image_url ? unit.image_url : resolveUnitImageUrl(unit.unit_name, unit.category) ?? '';
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
      <div className="relative flex aspect-[1.45] items-center justify-center overflow-hidden rounded-xl bg-slate-100">{image ? <Image src={image} alt={unit.unit_name} fill className="object-contain p-6" unoptimized={image.startsWith('http')} /> : <Camera className="h-12 w-12 text-slate-400" strokeWidth={1.7} />}</div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{unit.category || 'Rental unit'}</p><h2 className="mt-1 line-clamp-2 text-lg font-bold text-slate-900">{unit.unit_name}</h2></div>{unit.avg_rating ? <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-600"><Star className="h-3.5 w-3.5 fill-current" />{unit.avg_rating.toFixed(1)}</span> : null}</div><p className="mt-3 text-sm font-semibold text-slate-700">{price}</p><button type="button" onClick={() => setIsOpen(true)} className="mt-auto inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-brand-600 hover:bg-brand-600 hover:text-white">View Unit</button></div>
    </article>

    {isOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/25 p-4 backdrop-blur-[3px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={`unit-title-${unit.unit_id}`} className="relative my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <button type="button" onClick={() => setIsOpen(false)} aria-label="Close unit details" className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"><X className="h-5 w-5" /></button>
        <div className="relative flex h-56 items-center justify-center bg-slate-100 sm:h-64">{image ? <Image src={image} alt={unit.unit_name} fill className="object-contain p-10" unoptimized={image.startsWith('http')} /> : <Camera className="h-16 w-16 text-slate-400" strokeWidth={1.5} />}</div>
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">{unit.category || 'Rental unit'}</p>
          <h2 id={`unit-title-${unit.unit_id}`} className="mt-2 pr-10 text-2xl font-bold text-slate-900">{unit.unit_name}</h2>
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold">{typeof unit.avg_rating === 'number' ? <><Star className="h-4 w-4 fill-amber-400 text-amber-500" /><span className="text-slate-800">{unit.avg_rating.toFixed(1)}</span></> : <><Star className="h-4 w-4 text-slate-300" /><span className="text-slate-500">No ratings yet</span></>}</div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{unit.description || 'A reliable rental unit for your next plan.'}</p>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"><span className="text-sm font-medium text-slate-500">Daily rate</span><span className="text-lg font-bold text-slate-900">{price}</span></div>
          <div className="mt-5 border-t border-slate-100 pt-5"><h3 className="text-sm font-bold text-slate-900">Reviews</h3><p className="mt-2 text-sm text-slate-500">Review information is not available for this unit yet.</p></div>
          <button type="button" onClick={() => router.push(`/guest/browse/${unit.unit_id}`)} className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Book Now</button>
        </div>
      </section>
    </div>}
  </>;
>>>>>>> origin/sarvida-pr
}
