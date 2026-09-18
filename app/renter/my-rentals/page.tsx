import { createClient } from '@/lib/supabase_server';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { RentalManagement } from '@/components/renter/RentalManagement';
import type { RentalBooking } from '@/lib/types';

export default async function MyRentalsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  let bookings: RentalBooking[] = [];
  if (userData.user) {
    const { data } = await supabase.from('tbl_bookings').select('*, tbl_units(*)').eq('user_id', userData.user.id).order('start_date', { ascending: false });
    bookings = (data ?? []) as RentalBooking[];
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-160px)] w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-7 max-w-3xl sm:mb-9">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Rental management</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">My rentals</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base sm:leading-7">Track reservations, active rentals, returns, and feedback in one place.</p>
        </div>
        <RentalManagement bookings={bookings} />
      </main>
      <Footer />
    </>
  );
}
