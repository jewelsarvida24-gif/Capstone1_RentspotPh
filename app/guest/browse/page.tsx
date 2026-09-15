import { Suspense } from 'react';
import { createClient } from '@/lib/supabase_server';
import { BrowseFilters } from '@/components/booking/BrowseFilters';
import { UnitCard } from '@/components/booking/UnitCard';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import type { RentalUnit } from '@/lib/type';
import { demoUnits } from '@/lib/demoUnits';

interface Props {
	searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function BrowsePage({ searchParams }: Props) {
	const filters = await searchParams;
	const supabase = await createClient();
	let query = supabase.from('tbl_units').select('*').eq('status', 'available').order('created_at', { ascending: false });
	if (filters.category) query = query.eq('category', filters.category);
	if (filters.search) query = query.ilike('unit_name', `%${filters.search}%`);

	const { data: units, error: unitsError } = await query;

	console.log('BROWSE UNITS:', units);
	console.log('BROWSE UNITS ERROR:', unitsError);

	const databaseUnits: RentalUnit[] = (units ?? []).map((unit: any) => ({
		...unit,
		avg_rating: typeof unit.avg_rating === 'number' ? unit.avg_rating : null,
	}));
	const catalogUnits = databaseUnits.length > 0 ? databaseUnits : demoUnits;
	const processedUnits = catalogUnits.filter((unit) => {
		const matchesCategory = !filters.category || unit.category?.toLowerCase() === filters.category.toLowerCase();
		const matchesSearch = !filters.search || unit.unit_name.toLowerCase().includes(filters.search.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	return <><Navbar /><main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_left,_#eff6ff,_transparent_42%),#f8fafc]"><div className="mx-auto max-w-7xl px-6 py-10 lg:px-10"><div className="mb-8 flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold tracking-tight text-slate-900">Browse Rental Units</h1><p className="mt-2 text-sm text-slate-500">Find equipment that fits your plans, schedule, and budget.</p></div><p className="text-sm font-medium text-slate-500">{processedUnits.length} available {processedUnits.length === 1 ? 'unit' : 'units'}</p></div><div className="flex flex-col gap-8 lg:flex-row"><aside className="w-full shrink-0 lg:w-64"><Suspense fallback={<div className="card p-4">Loading filters...</div>}><BrowseFilters currentCategory={filters.category} currentSearch={filters.search} /></Suspense></aside><section className="min-w-0 flex-1">{processedUnits.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white/80 py-20 text-center shadow-sm"><p className="text-lg font-semibold text-slate-800">No units found</p><p className="mt-1 text-sm text-slate-500">Try another search or category.</p></div> : <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{processedUnits.map((unit) => <UnitCard key={unit.unit_id} unit={unit} />)}</div>}</section></div></div></main><Footer /></>;
}