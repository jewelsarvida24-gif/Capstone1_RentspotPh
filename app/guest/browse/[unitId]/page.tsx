<<<<<<< HEAD
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';
import { getListingById } from '@/lib/listing-catalog';

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  maximumFractionDigits: 0,
});

export default async function ListingDetailsPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const unit = getListingById(unitId);

  if (!unit) {
    notFound();
  }

  const isAvailable = unit.status === 'available';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/guest/browse"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            &larr; Back to listings
          </Link>

          <article className="mt-5 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
            <div className="relative min-h-72 bg-slate-100 sm:min-h-[28rem]">
              {unit.imageUrl ? (
                <Image
                  src={unit.imageUrl}
                  alt={unit.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-6"
                />
              ) : (
                <div className="flex h-full min-h-72 items-center justify-center text-slate-500">
                  Photo coming soon
                </div>
              )}
            </div>

            <div className="flex flex-col p-6 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                {unit.category}
              </p>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                  {unit.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    isAvailable
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {unit.description ? (
                <p className="mt-5 leading-7 text-slate-600">
                  {unit.description}
                </p>
              ) : (
                <p className="mt-5 leading-7 text-slate-600">
                  Explore this rental unit in detail and check its availability before booking.
                </p>
              )}

              {unit.includedItems?.length ? (
                <div className="mt-7">
                  <h2 className="font-bold text-slate-900">Included items</h2>
                  <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
                    {unit.includedItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-auto pt-8">
                <p className="text-sm text-slate-500">Rental rate</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-950">
                  {unit.pricePerDay !== undefined
                    ? `₱${pesoFormatter.format(unit.pricePerDay)}`
                    : 'Daily rate coming soon'}
                  {unit.pricePerDay !== undefined ? (
                    <span className="ml-1 text-base font-medium text-slate-500">
                      / day
                    </span>
                  ) : null}
                </p>
                {isAvailable ? (
                  <Link
                    href="/auth/login"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white transition hover:bg-blue-800 sm:w-auto"
                  >
                    Book Now
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-label={`${unit.name} is unavailable for booking`}
                    className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-200 px-5 py-3 text-base font-bold text-slate-500 sm:w-auto"
                  >
                    Unavailable
                  </button>
                )}
              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
=======
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Star } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import BookingRequestForm from '@/components/booking/BookingRequestForm';
import { createClient } from '@/lib/supabase_server';
import { demoUnits } from '@/lib/demoUnits';
import { isUuid } from '@/lib/uuid';
import VerifyIdentityButton from '@/components/renter/verify-identity-button';

export default async function BookingPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const supabase = await createClient();
  const demoUnit = demoUnits.find((candidate) => candidate.unit_id === unitId);
  const { data: databaseUnit } = isUuid(unitId)
    ? await supabase.from('tbl_units').select('*').eq('unit_id', unitId).eq('status', 'available').maybeSingle()
    : demoUnit
      ? await supabase.from('tbl_units').select('*').eq('unit_name', demoUnit.unit_name).eq('status', 'available').maybeSingle()
      : { data: null };
  if (databaseUnit && databaseUnit.unit_id !== unitId) {
    redirect(`/guest/browse/${databaseUnit.unit_id}`);
  }
  const unit = databaseUnit;
  if (!unit) notFound();
  const { data: { user } } = await supabase.auth.getUser();
  let verificationStatus: string | null = null;
  if (user) {
    const { data: kycSubmission } = await supabase
      .from('tbl_kyc')
      .select('admin_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    verificationStatus = kycSubmission?.admin_status?.toLowerCase() ?? null;
  }
  const isVerified = verificationStatus === 'approved';
  const image = typeof unit.image_url === 'string' ? unit.image_url : '';
  const rating = typeof unit.avg_rating === 'number' ? unit.avg_rating : null;
  const dailyRate = typeof unit.price_per_day === 'number' ? unit.price_per_day : null;

  return <>
    <Navbar />
    <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_left,_#eff6ff,_transparent_42%),#f8fafc]">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <Link href="/guest/browse" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-blue-600"><ChevronLeft className="h-4 w-4" /> Back to browse</Link>
            <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid md:grid-cols-[1.1fr_0.9fr]">
                <div className="relative flex min-h-72 items-center justify-center bg-slate-100 p-8 sm:min-h-96">{image ? <Image src={image} alt={unit.unit_name} fill className="object-contain p-8" unoptimized={image.startsWith('http')} /> : <p className="text-sm font-medium text-slate-400">Image not available</p>}</div>
                <div className="flex flex-col p-6 sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">{unit.category || 'Rental unit'}</p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-900">{unit.unit_name}</h1>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold">{rating !== null ? <><Star className="h-4 w-4 fill-amber-400 text-amber-500" /><span className="text-slate-800">{rating.toFixed(1)}</span></> : <><Star className="h-4 w-4 text-slate-300" /><span className="text-slate-500">No ratings yet</span></>}</div>
                  <p className="mt-6 text-sm leading-6 text-slate-600">{unit.description || 'No description has been provided for this rental unit.'}</p>
                </div>
              </div>
              <section className="border-t border-slate-200 px-6 py-6 sm:px-8" aria-labelledby="reviews-heading">
                <div className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /><h2 id="reviews-heading" className="text-lg font-bold text-slate-900">Reviews</h2></div>
                <p className="mt-3 text-sm text-slate-500">Review information is not available for this unit yet.</p>
              </section>
            </article>
          </div>

          <aside className="lg:sticky lg:top-6" aria-labelledby="booking-heading">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="booking-heading">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Booking request</p>
              <h2 id="booking-heading" className="mt-2 text-xl font-bold text-slate-900">{user ? 'Request this rental' : 'Ready to book this unit?'}</h2>
              {!user ? <>
                <p className="mt-2 text-sm text-slate-600">Register or log in to continue with your booking.</p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link href="/auth/register" className="btn-primary inline-flex items-center justify-center px-5 py-3">Register</Link>
                  <Link href="/auth/login" className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">Log In</Link>
                </div>
              </> : user ? <>
                <p className="mt-2 text-sm text-slate-500">Choose your rental dates and send a request. The team will confirm availability.</p>
                <div className="mt-5 border-t border-slate-100 pt-5"><BookingRequestForm unitId={String(unit.unit_id)} /></div>
              </> : <>
                <p className="mt-3 text-sm leading-6 text-amber-900">Identity verification is required before you can book. You can continue browsing, but date selection and booking are unavailable until your account is verified.</p>
                <div className="mt-4 flex flex-col items-start gap-3">
                  <VerifyIdentityButton isDeclined={verificationStatus === 'rejected'} />
                  <Link href="/renter/profile" className="text-sm font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900">View verification status</Link>
                </div>
              </>}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm font-medium text-slate-500">Daily rate</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{dailyRate !== null ? `PHP ${dailyRate.toLocaleString()}` : 'Price available on request'}<span className="text-sm font-medium text-slate-500">{dailyRate !== null ? ' / day' : ''}</span></p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  </>;
>>>>>>> origin/testing-v4
}
