import { BrowseExperience } from '@/components/booking/BrowseExperience';
import { createClient } from '@/lib/supabase_server';
import { mockRentalUnits } from '@/lib/mockRentalUnits';
import type { RentalUnit } from '@/lib/types';
import RenterNavbar from '@/components/renter/renter-navbar';
import Footer from '@/components/layout/footer';

interface Props { searchParams: Promise<{ category?: string; search?: string }> | { category?: string; search?: string }; }

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: units } = await supabase.from('tbl_units').select('*').order('created_at', { ascending: false });
  const sourceUnits = (units?.length ? units : mockRentalUnits) as RentalUnit[];
  const initialUnits = sourceUnits.map((unit) => ({
    ...unit,
    image_url: '',
    price_per_day: Number(unit.price_per_day ?? unit.daily_rate ?? 0),
  }));
  return (
    <>
      <RenterNavbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Browse Rentals</h1>
          <p className="mt-2 text-sm text-neutral-600 sm:text-base">
            Find the perfect rental for your next project, trip, or adventure.
          </p>
        </div>

        <BrowseExperience units={initialUnits} />
      </main>

      <Footer />
    </>
  );
}
