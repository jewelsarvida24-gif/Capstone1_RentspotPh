import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase_server';
import BookingForm from '@/components/booking/BookingForm';
import RenterNavbar from '@/components/renter/renter-navbar';
import Footer from '@/components/layout/footer';

export default async function BookingPage({ params }: { params: Promise<{ unitId: string }> }) {
  const supabase = await createClient();
  const { unitId } = await params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=/guest/book/${encodeURIComponent(unitId)}`);
  }

  const { data: unit, error } = await supabase
    .from('tbl_units')
    .select('*')
    .eq('unit_id', unitId)
    .single();

  if (error || !unit) {
    notFound();
  }

  const rentalUnit = { ...unit, image_url: '', price_per_day: Number(unit.price_per_day ?? unit.daily_rate ?? 0) };

  return (
    <>
      <RenterNavbar />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Rental booking</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">{rentalUnit.unit_name}</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex h-72 items-center justify-center border-b border-neutral-200 bg-neutral-100">
              <span className="rounded-full border border-dashed border-neutral-300 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Image coming soon</span>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-neutral-500">Category</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">{rentalUnit.category ?? 'General'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-[0.16em] text-neutral-500">Daily rate</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">₱{Number(rentalUnit.price_per_day ?? 0).toLocaleString()}</p>
                </div>
              </div>

              <div className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${unit.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {rentalUnit.status === 'available' ? 'Available' : 'Currently rented'}
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-neutral-500">Description</p>
                <p className="mt-2 text-base leading-7 text-neutral-600">
                  {rentalUnit.description || 'This rental unit is currently available for booking. Select your preferred dates to request a reservation.'}
                </p>
              </div>
            </div>
          </div>

          <BookingForm unit={rentalUnit} />
        </div>
      </main>

      <Footer />
    </>
  );
}
