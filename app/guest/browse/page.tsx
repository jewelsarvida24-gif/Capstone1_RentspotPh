import { BrowseExperience } from '@/components/booking/BrowseExperience';
import { createClient } from '@/lib/supabase_server';
import { mockRentalUnits } from '@/lib/mockRentalUnits';
import type { RentalUnit } from '@/lib/types';
import { withRentalDetails } from '@/lib/rentalDetails';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

interface Props { searchParams: Promise<{ category?: string; search?: string }> | { category?: string; search?: string }; }

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: units } = await supabase.from('tbl_units').select('*').order('created_at', { ascending: false });
  const sourceUnits = (units?.length ? units : mockRentalUnits) as RentalUnit[];
  const initialUnits = sourceUnits.map((unit) => ({
    ...withRentalDetails(unit),
    price_per_day: Number(unit.price_per_day ?? unit.daily_rate ?? 0),
  }));
  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-7 max-w-3xl sm:mb-9">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">RentSpotPH catalogue</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Browse rentals</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base sm:leading-7">
            Find the perfect rental for your next project, trip, or adventure.
          </p>
        </div>

        <BrowseExperience units={initialUnits} initialCategory={params.category} initialSearch={params.search} />
      </main>

      <Footer />
    </>
  );
}
