import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase_server';
import BookingForm from '@/components/booking/BookingForm';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export default async function BookingPage({ params }: { params: { unitId: string } }) {
  const supabase = await createClient();

  const { data: unit, error } = await supabase
    .from('tbl_units')
    .select('*')
    .eq('unit_id', params.unitId)
    .single();

  if (error || !unit) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Rental booking</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">{unit.unit_name}</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex h-72 items-center justify-center bg-gradient-to-br from-blue-50 to-neutral-100 text-neutral-500">
              {unit.image_url ? (
                <img src={unit.image_url} alt={unit.unit_name} className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">{unit.category ?? 'Rental'}</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-700">{unit.unit_name}</p>
                </div>
              )}
            </div>

            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-neutral-500">Category</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">{unit.category ?? 'General'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-[0.16em] text-neutral-500">Daily rate</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">₱{Number(unit.price_per_day ?? 0).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-neutral-500">Description</p>
                <p className="mt-2 text-base leading-7 text-neutral-600">
                  {unit.description || 'This rental unit is currently available for booking. Select your preferred dates to request a reservation.'}
                </p>
              </div>
            </div>
          </div>

          <BookingForm unit={unit} />
        </div>
      </main>

      <Footer />
    </>
  );
}
