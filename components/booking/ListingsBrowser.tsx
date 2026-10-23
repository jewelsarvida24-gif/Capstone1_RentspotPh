'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  getFilteredListings,
  listingCategories,
  type ListingCategory,
  type ListingUnit,
} from '@/lib/listing-catalog';

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  maximumFractionDigits: 0,
});

function ListingCard({ unit }: { unit: ListingUnit }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/guest/browse/${unit.id}`}
        className="group relative block aspect-[4/3] overflow-hidden bg-slate-100"
        aria-label={`View ${unit.name} details`}
      >
        {unit.imageUrl ? (
          <Image
            src={unit.imageUrl}
            alt={unit.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-sm text-slate-500">
            Photo coming soon
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
            unit.status === 'available'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {unit.status === 'available' ? 'Available' : 'Unavailable'}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
          {unit.category}
        </p>
        <h2 className="mt-2 min-h-14 text-lg font-bold text-slate-900">
          {unit.name}
        </h2>
        <p className="mt-3 text-sm font-semibold text-slate-700">
          {unit.pricePerDay !== undefined
            ? `₱${pesoFormatter.format(unit.pricePerDay)} / day`
            : 'Daily rate coming soon'}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            href={`/guest/browse/${unit.id}`}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View details
          </Link>
          {unit.status === 'available' ? (
            <Link
              href={`/guest/browse/${unit.id}`}
              className="rounded-lg bg-blue-700 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Book Now
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-label={`${unit.name} is unavailable`}
              className="cursor-not-allowed rounded-lg bg-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-500"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ListingsBrowser() {
  const [activeCategory, setActiveCategory] = useState<ListingCategory | 'All'>(
    'All',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const { items: visibleUnits, total, page: currentPage, totalPages } =
    useMemo(
      () =>
        getFilteredListings({
          category: activeCategory,
          search: searchTerm,
          page,
          pageSize,
          sortBy: 'name',
        }),
      [activeCategory, searchTerm, page],
    );

  const selectCategory = (nextCategory: ListingCategory | 'All') => {
    setActiveCategory(nextCategory);
    setPage(1);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
          RentSpotPH
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
          Find your next rental
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Search cameras, phones, and cars. Explore a listing for its full
          details and availability.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <label htmlFor="listing-search" className="sr-only">
          Search rental listings
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <input
            id="listing-search"
            type="search"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Search by unit name or category"
            className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div
        className="mt-7 flex flex-wrap justify-center gap-2"
        aria-label="Listing categories"
      >
        {(['All', ...listingCategories] as const).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => selectCategory(category)}
            aria-pressed={activeCategory === category}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeCategory === category
                ? 'bg-blue-700 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {category}
            {category === 'Drone' ? (
              <span className="ml-2 text-xs font-medium opacity-80">
                Coming Soon
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeCategory === 'Drone' ? (
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-blue-100 bg-blue-50 px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Coming Soon</h2>
          <p className="mt-2 text-slate-600">
            Drone rentals will be available here soon.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-9 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900">
              {activeCategory === 'All' ? 'Browse listings' : `${activeCategory}s`}
            </h2>
            <p className="text-sm text-slate-500" aria-live="polite">
              {total} {total === 1 ? 'listing' : 'listings'}
            </p>
          </div>

          {visibleUnits.length > 0 ? (
            <>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleUnits.map((unit) => (
                  <ListingCard key={unit.id} unit={unit} />
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <span className="text-sm font-medium text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                No matching listings
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Try another search term or choose a different category.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
