'use client';

import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { BrowseFilters } from '@/components/booking/BrowseFilters';
import { UnitCard } from '@/components/booking/UnitCard';
import type { RentalUnit } from '@/lib/types';

type BrowseExperienceProps = {
  units: RentalUnit[];
  initialCategory?: string;
  initialSearch?: string;
  loadError?: string;
};

function normalizeCategory(category?: string | null) {
  const normalized = category?.toLowerCase();
  return normalized === 'smartphone' ? 'phone' : normalized;
}

export function BrowseExperience({
  units,
  initialCategory,
  initialSearch,
  loadError,
}: BrowseExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch || '');
  const [category, setCategory] = useState(initialCategory || 'All');
  const [availability, setAvailability] = useState('All');
  const [maxPrice, setMaxPrice] = useState('any');

  useEffect(() => {
    setCategory(initialCategory || 'All');
    setSearch(initialSearch || '');
  }, [initialCategory, initialSearch]);

  const filteredUnits = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return units.filter((unit) => {
      const unitCategory = normalizeCategory(unit.category);
      const selectedCategory = normalizeCategory(category);
      const categoryMatches = category === 'All' || unitCategory === selectedCategory;
      const availabilityMatches = availability === 'All' || unit.status?.toLowerCase() === availability.toLowerCase();
      const priceMatches = maxPrice === 'any' || Number(unit.price_per_day ?? 0) <= Number(maxPrice);
      const searchMatches = !normalizedSearch || [unit.unit_name, unit.category, unit.description, unit.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      return categoryMatches && availabilityMatches && priceMatches && searchMatches;
    });
  }, [availability, category, maxPrice, search, units]);

  const updateUrl = (nextCategory: string, nextSearch: string) => {
    const params = new URLSearchParams();
    if (nextCategory !== 'All') params.set('category', nextCategory);
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const changeCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    updateUrl(nextCategory, search);
  };

  const submitSearch = (value = search) => updateUrl(category, value);
  const resetFilters = () => {
    setCategory('All');
    setSearch('');
    setAvailability('All');
    setMaxPrice('any');
    updateUrl('All', '');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside>
        <BrowseFilters
          category={category}
          search={search}
          availability={availability}
          maxPrice={maxPrice}
          onCategoryChange={changeCategory}
          onSearchChange={setSearch}
          onSearchSubmit={submitSearch}
          onReset={resetFilters}
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
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500 lg:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filters are available above the results on smaller screens.
        </div>

        <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-1 sm:max-h-[720px]">
          {loadError ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {loadError}
            </div>
          ) : filteredUnits.length ? (
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