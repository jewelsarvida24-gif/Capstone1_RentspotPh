'use client';

import { Camera, CarFront, Laptop, PackagePlus, Search, Smartphone } from 'lucide-react';

const categories = [
  { label: 'Camera', icon: Camera },
  { label: 'Phone', icon: Smartphone },
  { label: 'Smartphone', icon: Smartphone },
  { label: 'Vehicle', icon: CarFront },
  { label: 'Laptop', icon: Laptop },
  { label: 'Drone', icon: Camera },
  { label: 'Add-on', icon: PackagePlus },
];

type BrowseFiltersProps = {
  category: string;
  search: string;
  availability: string;
  maxPrice: string;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value?: string) => void;
  onReset: () => void;
  onAvailabilityChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
};

export function BrowseFilters({
  category,
  search,
  availability,
  maxPrice,
  onCategoryChange,
  onSearchChange,
  onSearchSubmit,
  onReset,
  onAvailabilityChange,
  onMaxPriceChange,
}: BrowseFiltersProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit();
        }}
      >
        <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <span className="sr-only">Search rental units</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search units"
            className="min-w-0 flex-1 text-sm outline-none placeholder:text-neutral-400"
          />
          <button type="submit" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Search
          </button>
        </label>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Category</p>
        <button type="button" onClick={onReset} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          Reset
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange('All')}
          className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${category === 'All' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
        >
          All
        </button>
        {categories.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onCategoryChange(label)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${category.toLowerCase() === label.toLowerCase() ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
        Price range
        <select
          value={maxPrice}
          onChange={(event) => onMaxPriceChange(event.target.value)}
          className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-neutral-700 outline-none focus:border-blue-500"
        >
          <option value="1500">Up to ₱1,500/day</option>
          <option value="2500">Up to ₱2,500/day</option>
          <option value="3500">Up to ₱3,500/day</option>
          <option value="any">Any price</option>
        </select>
      </label>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Availability</p>
        <div className="mt-3 flex gap-2">
          {['All', 'available', 'rented'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onAvailabilityChange(item)}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${availability === item ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
