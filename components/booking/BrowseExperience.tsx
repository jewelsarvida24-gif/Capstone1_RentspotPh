'use client';

import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { BrowseFilters } from '@/components/booking/BrowseFilters';
import { UnitCard } from '@/components/booking/UnitCard';
import type { RentalUnit } from '@/lib/types';

const categories = ['All', 'Camera', 'Phone', 'Vehicle', 'Laptop', 'Drone'];

export function BrowseExperience({ units, initialCategory, initialSearch }: { units: RentalUnit[]; initialCategory?: string; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch ?? '');
  const [category, setCategory] = useState<string>(() => {
    const requested = initialCategory?.toLowerCase();
    return requested === 'smartphone' ? 'Phone' : categories.find((item) => item.toLowerCase() === requested) ?? 'All';
  });
  const [availability, setAvailability] = useState('All');
  const [maxPrice, setMaxPrice] = useState('any');

  const filteredUnits = useMemo(() => {
    const searchTerms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return units.filter((unit) => {
      const normalizedCategory = unit.category?.toLowerCase() === 'smartphone' ? 'phone' : unit.category?.toLowerCase();
      const categoryMatches = category === 'All' || normalizedCategory === category.toLowerCase();
      const availabilityMatches = availability === 'All' || unit.status?.toLowerCase() === availability.toLowerCase();
      const priceMatches = maxPrice === 'any' || Number(unit.price_per_day ?? 0) <= Number(maxPrice);
      const searchableText = [unit.unit_name, unit.category, unit.description, unit.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const searchMatches = searchTerms.every((term) => searchableText.includes(term));
      return categoryMatches && availabilityMatches && priceMatches && searchMatches;
    });
  }, [availability, category, maxPrice, search, units]);

  const activeFilterCount = [category !== 'All', availability !== 'All', maxPrice !== 'any', Boolean(search.trim())].filter(Boolean).length;

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
      <aside className="min-w-0 xl:sticky xl:top-24">
        <BrowseFilters
          category={category}
          availability={availability}
          maxPrice={maxPrice}
          onCategoryChange={setCategory}
          onAvailabilityChange={setAvailability}
          onMaxPriceChange={setMaxPrice}
          onSearchReset={() => setSearch('')}
        />
      </aside>

      <section className="min-w-0">
        <div className="mb-5 grid gap-4 border-b border-neutral-200 pb-5 sm:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] sm:items-end">
          <div className="min-w-0">
            <p role="status" aria-live="polite" className="text-sm font-medium text-blue-600">{filteredUnits.length} rentals found{activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active` : ''}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Find your next rental</h2>
          </div>
          <div className="flex min-w-0 w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <label htmlFor="rental-search" className="sr-only">Search rentals</label>
            <input
              id="rental-search"
              type="search"
              autoComplete="off"
              aria-controls="rental-results"
              aria-label="Search rental listings"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, category, or location"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
            {search ? <button type="button" aria-label="Clear rental search" onClick={() => setSearch('')} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">Clear</button> : null}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500 xl:hidden">
          <SlidersHorizontal className="h-4 w-4 shrink-0" /> Filters are shown above the results at this width.
        </div>

        <div>
          {filteredUnits.length ? (
            <div id="rental-results" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUnits.map((unit) => <UnitCard key={String(unit.unit_id)} unit={unit} />)}
            </div>
          ) : (
            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 text-center">
              <div>
                <p className="text-lg font-semibold text-neutral-700">No rentals match these filters</p>
                <p className="mt-1 text-sm text-neutral-500">Try widening the price range or changing your search.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}