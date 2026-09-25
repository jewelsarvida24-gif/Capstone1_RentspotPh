import { createClient } from '@/lib/supabase_server';
import RenterNavbar from '@/components/renter/renter-navbar';
import { RentalManagement } from '@/components/renter/RentalManagement';
import type { RentalBooking } from '@/lib/types';

export default async function MyRentalsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  let bookings: RentalBooking[] = [];
  if (userData.user) {
    const { data } = await supabase.from('tbl_bookings').select('*, tbl_units(*)').eq('user_id', userData.user.id).order('start_date', { ascending: false });
    bookings = (data ?? []).map((booking) => ({
      ...booking,
      booking_status: booking.status ?? 'pending',
    })) as RentalBooking[];
  }
  const { data: profile } = userData.user
    ? await supabase.from('tbl_users').select('first_name, last_name').eq('user_id', userData.user.id).maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfdff] text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"><div className="absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-sky-200/35 blur-3xl" /><div className="absolute -left-56 top-[35%] h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" /></div>
      <RenterNavbar firstName={profile?.first_name ?? undefined} lastName={profile?.last_name ?? undefined} />
      <main className="mx-auto min-h-[calc(100vh-64px)] max-w-[1100px] px-6 pb-28 pt-10 lg:px-10"><div className="mb-8"><p className="text-sm font-semibold tracking-[0.14em] text-blue-600">RENTAL MANAGEMENT</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">My rentals</h1><p className="mt-3 text-base leading-7 text-slate-600">Track reservations, active rentals, returns, and feedback in one place.</p></div><RentalManagement bookings={bookings} /></main>
    </div>
  );
}
