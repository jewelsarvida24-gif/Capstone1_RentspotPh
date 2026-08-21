// app/guest/browse/page.tsx
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase_server';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import UnitCard from '@/components/booking/UnitCard';
import BrowseFilters from '@/components/booking/BrowseFilters';
import type { RentalUnit } from '@/index.ts';

interface Props {
  searchParams: { category?: string; search?: string };
}

export default async function BrowsePage({ searchParams }: Props) {
  const supabase = createClient();
  let query = supabase
    .from('tbl_units')
    .select('*, tbl_feedbacks(rating)')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (searchParams.category) {
    query = query.eq('category', searchParams.category);
  }
  if (searchParams.search) {
    query = query.ilike('unit_name', `%${searchParams.search}%`);
  }

  const { data: units } = await query;

  // Compute avg rating
  const processedUnits: RentalUnit[] = (units ?? []).map((u: any) => ({
    ...u,
    avg_rating: u.tbl_feedbacks?.length
      ? u.tbl_feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / u.tbl_feedbacks.length
      : null,
  }));

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Browse Rental Units</h1>
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-56 shrink-0">
            <Suspense fallback={<div className="card p-4">Loading filters...</div>}>
              <BrowseFilters currentCategory={searchParams.category} />
            </Suspense>
          </aside>
          <section className="flex-1">
            {processedUnits.length === 0 ? (
              <div className="text-center py-20 text-neutral-400">
                <p className="text-lg font-medium">No units found</p>
                <p className="text-sm mt-1">Try a different category or search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {processedUnits.map(unit => (
                  <UnitCard key={unit.unit_id} unit={unit} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}