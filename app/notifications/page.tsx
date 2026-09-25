import { redirect } from 'next/navigation';
import RenterNavbar from '@/components/renter/renter-navbar';
import NotificationList from '@/components/notifications/NotificationList';
import { createClient } from '@/lib/supabase_server';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/auth/login?redirectTo=/notifications');
  const { data: profile } = await supabase.from('tbl_users').select('first_name, last_name').eq('user_id', auth.user.id).maybeSingle();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfdff] text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute -left-56 top-[35%] h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
      </div>
      <RenterNavbar firstName={profile?.first_name ?? undefined} lastName={profile?.last_name ?? undefined} />
      <main className="mx-auto max-w-[1100px] px-6 pb-28 pt-10 lg:px-10">
        <p className="text-sm font-semibold tracking-[0.14em] text-blue-600">YOUR ACCOUNT</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Notifications</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">Stay up to date with your bookings, payments, and verification.</p>
        <section className="mt-8 overflow-hidden rounded-[30px] border border-white/80 bg-white/85 shadow-[0_20px_70px_rgba(37,99,235,0.08)] backdrop-blur-2xl"><NotificationList /></section>
      </main>
    </div>
  );
}
