'use client';

import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { BrowseFilters } from '@/components/booking/BrowseFilters';
import { UnitCard } from '@/components/booking/UnitCard';
import type { RentalUnit } from '@/lib/types';

export function BrowseExperience({ units }: { units: RentalUnit[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [availability, setAvailability] = useState('All');
  const [maxPrice, setMaxPrice] = useState('5000');

  const filteredUnits = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return units.filter((unit) => {
      const normalizedCategory = unit.category?.toLowerCase() === 'smartphone' ? 'phone' : unit.category?.toLowerCase();
      const categoryMatches = category === 'All' || normalizedCategory === category.toLowerCase();
      const availabilityMatches = availability === 'All' || unit.status?.toLowerCase() === availability.toLowerCase();
      const priceMatches = Number(unit.price_per_day ?? 0) <= Number(maxPrice);
      const searchMatches = !normalizedSearch || [unit.unit_name, unit.category, unit.description, unit.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      return categoryMatches && availabilityMatches && priceMatches && searchMatches;
    });
  }, [availability, category, maxPrice, search, units]);

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside>
        <BrowseFilters
          category={category}
          availability={availability}
          maxPrice={maxPrice}
          onCategoryChange={setCategory}
          onAvailabilityChange={setAvailability}
          onMaxPriceChange={setMaxPrice}
        />
      </aside>

      <section className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">{filteredUnits.length} rentals found</p>
            <h2 className="mt-1 text-2xl font-bold text-neutral-900">Find your next rental</h2>
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm sm:max-w-sm">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <span className="sr-only">Search rentals</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, category, or location"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </label>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500 lg:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filters are available above the results on smaller screens.
        </div>

        <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-1 sm:max-h-[720px]">
          {filteredUnits.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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