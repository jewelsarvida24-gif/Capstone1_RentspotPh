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
    <><Navbar /><main className="mx-auto min-h-[calc(100vh-160px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Rental management</p><h1 className="mt-2 text-3xl font-bold text-neutral-900">My rentals</h1><p className="mt-2 text-neutral-600">Track reservations, active rentals, returns, and feedback in one place.</p></div><RentalManagement bookings={bookings} /></main><Footer /></>
  );
}
