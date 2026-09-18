'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import type { RentalUnit } from '@/lib/types';
import { createClient } from '@/lib/supabase_client';

export function UnitCard({ unit }: { unit: RentalUnit }) {
  const router = useRouter();
  const supabase = createClient();
  const price = Number(unit.price_per_day ?? 0);

  const handleBookNow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const detailPath = `/guest/book/${unit.unit_id}`;
    router.push(user ? detailPath : `/auth/login?next=${encodeURIComponent(detailPath)}`);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative flex h-48 items-center justify-center border-b border-neutral-200 bg-neutral-100 text-neutral-500">
        <div className="h-full w-full border-8 border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,.65),transparent)]" aria-label="Image placeholder" />
        {unit.category?.toLowerCase() === 'drone' ? (
          <span className="absolute rounded-full border border-dashed border-neutral-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Coming Soon</span>
        ) : null}
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

          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${unit.status?.toLowerCase() === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
            {unit.status?.toLowerCase() === 'available' ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-neutral-600">
          {unit.description || 'Available for short- and long-term rentals.'}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Daily rate</p>
            <p className="text-xl font-bold text-blue-600">₱{price.toLocaleString()}</p>
            <p className="text-xs text-neutral-500">per day</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/guest/book/${unit.unit_id}`} className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50">
              View details
            </Link>
            {unit.status?.toLowerCase() === 'available' ? <button type="button" onClick={handleBookNow} className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Book now</button> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
