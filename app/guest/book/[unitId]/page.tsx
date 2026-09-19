import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase_server';
import BookingForm from '@/components/booking/BookingForm';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { mockRentalUnits } from '@/lib/mockRentalUnits';
import { withRentalDetails } from '@/lib/rentalDetails';
import type { RentalUnit } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function BookingPage({ params }: { params: Promise<{ unitId: string }> }) {
  const supabase = await createClient();
  const { unitId } = await params;

  const { data: unit, error } = await supabase
    .from('tbl_units')
    .select('*')
    .eq('unit_id', unitId)
    .single();

  const sourceUnit = unit ?? mockRentalUnits.find((item) => String(item.unit_id) === unitId);
  if (error || !sourceUnit) {
    notFound();
  }

  const rentalUnit = withRentalDetails({ ...(sourceUnit as RentalUnit), price_per_day: Number(sourceUnit?.price_per_day ?? sourceUnit?.daily_rate ?? 0) });
  const isDrone = rentalUnit.category?.toLowerCase() === 'drone';

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-7 max-w-3xl sm:mb-9">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Rental booking</p>
          <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">{rentalUnit.unit_name}</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base sm:leading-7">Review the unit details, choose your dates, and send a booking request.</p>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] xl:gap-8">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex aspect-[16/9] min-h-52 items-center justify-center border-b border-neutral-200 bg-neutral-100">
              {rentalUnit.image_url ? <img src={String(rentalUnit.image_url)} alt={rentalUnit.unit_name} className="h-full w-full object-cover" /> : isDrone ? <div className="text-center"><p className="text-lg font-semibold uppercase tracking-[0.16em] text-neutral-500">Coming Soon</p><p className="mt-1 text-xs text-neutral-400">Drone rental</p></div> : <div className="text-center"><p className="text-sm font-semibold text-neutral-600">Rental image unavailable</p><p className="mt-1 text-xs text-neutral-400">{rentalUnit.category ?? 'Rental'} unit</p></div>}
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="grid gap-4 border-b border-neutral-100 pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Category</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">{rentalUnit.category ?? 'General'}{rentalUnit.location ? ` · ${String(rentalUnit.location)}` : ''}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Daily rate</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">₱{Number(rentalUnit.price_per_day ?? 0).toLocaleString()}</p>
                </div>
              </div>

              <div className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${rentalUnit.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {rentalUnit.status === 'available' ? 'Available' : 'Currently rented'}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Description</p>
                <p className="mt-2 text-base leading-7 text-neutral-600">
                  {rentalUnit.description || 'This rental unit is currently available for booking. Select your preferred dates to request a reservation.'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">What&apos;s included</p>
                <ul className="mt-2 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
                  {(rentalUnit.included_items ?? []).map((item) => <li key={item} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />{item}</li>)}
                </ul>
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <p className="text-sm font-semibold text-neutral-900">Reviews</p>
              </div>
            </div>
          </section>

          <BookingForm unit={rentalUnit} />
        </div>
      </main>

      <Footer />
    </>
  );
}
