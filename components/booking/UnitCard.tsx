import Link from 'next/link';
import { Star } from 'lucide-react';
import type { RentalUnit } from '@/lib/types';

export function UnitCard({ unit }: { unit: RentalUnit }) {
  const price = Number(unit.price_per_day ?? 0);
  const rating = unit.avg_rating ? Number(unit.avg_rating) : 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-48 items-center justify-center border-b border-neutral-200 bg-gradient-to-br from-neutral-100 to-neutral-50 text-neutral-500">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-neutral-300 bg-white text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Image
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            {unit.category ?? 'Rental'}
          </p>
          <p className="mt-2 text-lg font-semibold text-neutral-700">{unit.unit_name}</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
              {unit.category ?? 'General'}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-neutral-900">{unit.unit_name}</h3>
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

          <Link
            href={`/guest/book/${unit.unit_id}`}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Book now
          </Link>
        </div>
      </div>
    </article>
  );
}
