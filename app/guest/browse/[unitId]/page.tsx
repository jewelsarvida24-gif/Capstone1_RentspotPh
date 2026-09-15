import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import BookingRequestForm from '@/components/booking/BookingRequestForm';
import { createClient } from '@/lib/supabase_server';
import { demoUnits } from '@/lib/demoUnits';

export default async function BookingPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const supabase = await createClient();
  const { data: databaseUnit } = await supabase.from('tbl_units').select('*').eq('unit_id', unitId).eq('status', 'available').maybeSingle();
  const unit = databaseUnit || demoUnits.find((demoUnit) => demoUnit.unit_id === unitId);
  if (!unit) notFound();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirectTo=/guest/browse/${unitId}`);
  return <><Navbar /><main className="mx-auto max-w-4xl px-6 py-10"><Link href="/guest/browse" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-blue-600"><ChevronLeft className="h-4 w-4" /> Back to browse</Link><div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Booking request</p><h1 className="mt-2 text-3xl font-bold text-neutral-900">{unit.unit_name}</h1><p className="mt-2 text-sm text-neutral-500">Choose your rental dates and send a request. The team will confirm availability.</p><div className="mt-8 border-t border-neutral-100 pt-8"><BookingRequestForm unitId={String(unit.unit_id)} /></div></div></main></>;
}
