'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Car, MapPin, Smartphone, Package } from 'lucide-react';
import type { RentalUnit } from '@/lib/types';
import { createClient } from '@/lib/supabase_client';

export function UnitCard({ unit }: { unit: RentalUnit }) {
  const router = useRouter();
  const supabase = createClient();
  const price = Number(unit.price_per_day ?? 0);
  const category = unit.category?.toLowerCase() ?? '';
  const isDrone = category === 'drone';
  const CategoryIcon = category.includes('camera') ? Camera : category.includes('phone') || category.includes('smartphone') ? Smartphone : category.includes('vehicle') || category.includes('car') ? Car : Package;

  const handleBookNow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const detailPath = `/guest/book/${unit.unit_id}`;
    router.push(user ? detailPath : `/auth/login?next=${encodeURIComponent(detailPath)}`);
  };

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/10] min-h-40 overflow-hidden border-b border-neutral-200 bg-neutral-100 text-neutral-500">
        {unit.image_url ? <img src={String(unit.image_url)} alt={unit.unit_name} className="h-full w-full object-cover" /> : isDrone ? <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-8 border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,.65),transparent)] text-center"><CategoryIcon className="h-10 w-10 text-blue-700/70" strokeWidth={1.5} /><span className="rounded-full border border-dashed border-neutral-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Coming Soon</span></div> : <div className="flex h-full w-full items-center justify-center border-8 border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,.65),transparent)] text-xs text-neutral-500">Rental image unavailable</div>}
        {!unit.image_url && !isDrone ? <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-blue-700/70"><CategoryIcon className="h-10 w-10" strokeWidth={1.5} /><span className="text-xs font-semibold uppercase tracking-[0.16em]">{unit.category ?? 'Rental'}</span></div> : null}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
              {unit.category ?? 'General'}
            </p>
            <h3 className="mt-1 min-h-14 break-words text-lg font-bold leading-7 text-neutral-900">{unit.unit_name}</h3>
            {unit.location ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                <MapPin className="h-3.5 w-3.5" /> {String(unit.location)}
              </p>
            ) : null}
          </div>

          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${unit.status?.toLowerCase() === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
            {unit.status?.toLowerCase() === 'available' ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-neutral-600">
          {unit.description || 'Available for short- and long-term rentals.'}
        </p>

        <div className="mt-auto grid gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Daily rate</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-blue-600">₱{price.toLocaleString()}</p>
            <p className="text-xs text-neutral-500">per day</p>
          </div>

          <div className={`grid gap-2 sm:flex sm:flex-wrap sm:justify-end ${unit.status?.toLowerCase() === 'available' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <Link href={`/guest/book/${unit.unit_id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 px-3 py-2.5 text-center text-sm font-semibold text-neutral-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
              View details <span className="sr-only">for {unit.unit_name}</span>
            </Link>
            {unit.status?.toLowerCase() === 'available' ? <button type="button" onClick={handleBookNow} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md">Book now<span className="sr-only"> for {unit.unit_name}</span></button> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
