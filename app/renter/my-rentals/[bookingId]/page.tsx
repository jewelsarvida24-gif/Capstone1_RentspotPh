import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase_server';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { statusLabel } from '@/lib/rentalStatus';
import type { RentalBooking } from '@/lib/types';

export default async function RentalDetailsPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) notFound();
  const { bookingId } = await params;
  const { data: booking, error } = await supabase.from('tbl_bookings').select('*, tbl_units(*)').eq('booking_id', bookingId).eq('user_id', userData.user.id).single();
  if (error || !booking) notFound();
  const rental = booking as RentalBooking;
  const unit = rental.tbl_units;

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-160px)] w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link href="/renter/my-rentals" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
          <span aria-hidden="true">←</span>&nbsp;Back to my rentals
        </Link>

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] xl:items-start">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex aspect-[16/8] min-h-48 items-center justify-center border-b border-neutral-200 bg-neutral-100 sm:aspect-[16/7]">
              <span className="rounded-full border border-dashed border-neutral-300 bg-white/80 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Image coming soon
              </span>
            </div>
            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Rental details</p>
                <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-neutral-900">{unit?.unit_name || `Rental #${rental.booking_id}`}</h1>
                <p className="mt-2 text-sm text-neutral-500">Booking #{rental.booking_id}</p>
              </div>
              <p className="leading-7 text-neutral-600">{unit?.description || 'Your rental details and booking schedule are shown here.'}</p>
              <dl className="grid gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-2">
                <div><dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Category</dt><dd className="mt-1 font-semibold text-neutral-900">{unit?.category || 'Rental'}</dd></div>
                <div><dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Location</dt><dd className="mt-1 break-words font-semibold text-neutral-900">{String(unit?.location || 'Metro Manila')}</dd></div>
              </dl>
            </div>
          </section>

          <aside className="h-fit min-w-0 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-neutral-900">Booking summary</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{statusLabel(rental.booking_status)}</span>
            </div>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4"><dt className="text-neutral-500">Start date</dt><dd className="break-words text-right font-semibold text-neutral-900">{rental.start_date}</dd></div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4"><dt className="text-neutral-500">End date</dt><dd className="break-words text-right font-semibold text-neutral-900">{rental.end_date}</dd></div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4"><dt className="text-neutral-500">Rental duration</dt><dd className="text-right font-semibold text-neutral-900">{rental.total_days || 0} day(s)</dd></div>
              <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-4"><dt className="text-neutral-500">Total</dt><dd className="text-right text-xl font-bold text-blue-600">₱{Number(rental.total_amount || 0).toLocaleString()}</dd></div>
            </dl>
            {rental.notes ? <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600"><p className="font-semibold text-neutral-800">Notes</p><p className="mt-1 break-words">{rental.notes}</p></div> : null}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}