<<<<<<< HEAD
const categories = ['All', 'Camera', 'Phone', 'Vehicle', 'Laptop', 'Drone'];

interface BrowseFiltersProps {
  category?: string;
  currentCategory?: string;
  availability?: string;
  maxPrice?: string;
  onCategoryChange?: (value: string) => void;
  onAvailabilityChange?: (value: string) => void;
  onMaxPriceChange?: (value: string) => void;
}

export function BrowseFilters({ category = 'All', currentCategory, availability = 'All', maxPrice = '5000', onCategoryChange = () => {}, onAvailabilityChange = () => {}, onMaxPriceChange = () => {} }: BrowseFiltersProps) {
  const selectedCategory = currentCategory || category;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Filters</p>
        <button type="button" onClick={() => { onCategoryChange('All'); onAvailabilityChange('All'); onMaxPriceChange('5000'); }} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Reset</button>
      </div>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Category</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => onCategoryChange(item)} className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${selectedCategory === item ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
        Price range
        <select value={maxPrice} onChange={(event) => onMaxPriceChange(event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-neutral-700 outline-none focus:border-blue-500">
          <option value="1500">Up to ₱1,500/day</option>
          <option value="2500">Up to ₱2,500/day</option>
          <option value="3500">Up to ₱3,500/day</option>
          <option value="5000">Any price</option>
        </select>
      </label>
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Availability</p>
        <div className="mt-3 flex gap-2">
          {['All', 'available', 'rented'].map((item) => (
            <button key={item} type="button" onClick={() => onAvailabilityChange(item === 'All' ? 'All' : item)} className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${availability === (item === 'All' ? 'All' : item) ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
=======
'use client';

import { Camera, CarFront, PackagePlus, Search, Smartphone } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const categories = [
  { label: 'Camera', icon: Camera },
  { label: 'Smartphone', icon: Smartphone },
  { label: 'Vehicle', icon: CarFront },
  { label: 'Add-on', icon: PackagePlus },
];

export function BrowseFilters({ currentCategory, currentSearch }: { currentCategory?: string; currentSearch?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch || '');
  const updateFilters = (category?: string, query = search) => {
    const params = new URLSearchParams(searchParams.toString());
    category ? params.set('category', category) : params.delete('category');
    query.trim() ? params.set('search', query.trim()) : params.delete('search');
    router.push(`${pathname}?${params.toString()}`);
  };
  return <div className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl">
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"><Search className="h-4 w-4 shrink-0 text-neutral-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && updateFilters(currentCategory)} placeholder="Search units" className="min-w-0 flex-1 text-sm text-slate-800 outline-none placeholder:text-neutral-400" aria-label="Search rental units" /></div>
    <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Category</p>
    <div className="mt-3 space-y-2">{categories.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => updateFilters(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${(currentCategory || '') === label ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
  </div>;
>>>>>>> origin/sarvida-pr
}
