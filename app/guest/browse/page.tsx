import { createClient } from '@/lib/supabase_server';
import { mockRentalUnits } from '@/lib/mockRentalUnits';
import type { RentalUnit } from '@/lib/types';
import RenterNavbar from '@/components/renter/renter-navbar';
import Footer from '@/components/layout/footer';
import { BrowseExperience } from '@/components/booking/BrowseExperience';

type BrowsePageProps = {
  searchParams: Promise<{ category?: string; search?: string }>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: units, error } = await supabase
    .from('tbl_units')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Could not load rental units:', error);
  }

  const sourceUnits = units?.length
    ? (units as RentalUnit[])
    : error
      ? []
      : mockRentalUnits;
  const initialUnits = sourceUnits.map((unit) => ({
    ...unit,
    image_url: typeof unit.image_url === 'string' ? unit.image_url : '',
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
        <BrowseExperience
          units={initialUnits}
          initialCategory={params.category}
          initialSearch={params.search}
          loadError={error ? 'Rental units could not be loaded. Please try again later.' : ''}
        />
      </main>
      <Footer />
    </>
  );
}
