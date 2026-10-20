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
}
