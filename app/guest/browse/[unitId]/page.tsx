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

const PAGE_BG = '#fbfdff';

/* ---------- small themed pieces (shared with the dashboard and browse page) ---------- */

// Unit reference styled like a licence plate.
function Plate({ id }: { id: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border-2 border-[#102A4A] bg-white px-2.5 py-1 text-xs font-bold tracking-[0.2em] text-[#102A4A]">
      <span className="h-3 w-1 rounded-full bg-[#3E7DBB]" />
      RSP {id.slice(0, 6).toUpperCase()}
    </span>
  );
}

// The booking panel changes colour with the renter's verification status, like the renter ID.
const bookingTone = {
  guest: {
    header: 'bg-[linear-gradient(90deg,#102A4A,#173B66,#1F5C94,#3E7DBB,#6E9BD3,#A8C5E8)]',
    sub: 'text-[#A8C5E8]',
    border: 'border-[#A8C5E8]',
    text: 'text-slate-600',
    label: 'Booking request',
  },
  verified: {
    header: 'bg-[linear-gradient(90deg,#102A4A,#173B66,#1F5C94,#3E7DBB,#6E9BD3,#A8C5E8)]',
    sub: 'text-[#A8C5E8]',
    border: 'border-[#A8C5E8]',
    text: 'text-slate-600',
    label: 'ID verified',
  },
  pending: {
    header: 'bg-amber-500',
    sub: 'text-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    label: 'Under review',
  },
  rejected: {
    header: 'bg-rose-600',
    sub: 'text-rose-100',
    border: 'border-rose-200',
    text: 'text-rose-900',
    label: 'Not accepted',
  },
  none: {
    header: 'bg-slate-500',
    sub: 'text-slate-200',
    border: 'border-slate-300',
    text: 'text-slate-700',
    label: 'Not verified yet',
  },
};

const ctaPrimary =
  'inline-flex items-center justify-center rounded-full bg-[#1F5C94] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(16,42,74,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#173B66]';
const ctaSecondary =
  'inline-flex items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold text-[#173B66] ring-1 ring-[#A8C5E8] transition hover:bg-[#A8C5E8]/30 hover:text-[#1F5C94]';

/* ---------- page ---------- */

export default async function BookingPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const supabase = await createClient();

  const demoUnit = demoUnits.find(
    (candidate) => candidate.unit_id === unitId
  );

  const { data: databaseUnit } = isUuid(unitId)
    ? await supabase
        .from('tbl_units')
        .select('*')
        .eq('unit_id', unitId)
        .eq('status', 'available')
        .maybeSingle()
    : demoUnit
      ? await supabase
          .from('tbl_units')
          .select('*')
          .eq('unit_name', demoUnit.unit_name)
          .eq('status', 'available')
          .maybeSingle()
      : { data: null };

  if (databaseUnit && databaseUnit.unit_id !== unitId) {
    redirect(`/guest/browse/${databaseUnit.unit_id}`);
  }

  const unit = databaseUnit;

  if (!unit) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let verificationStatus: string | null = null;

  if (user) {
    const { data: kycSubmission } = await supabase
      .from('tbl_kyc')
      .select('admin_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    verificationStatus =
      kycSubmission?.admin_status?.toLowerCase() ?? null;
  }

  const isVerified = verificationStatus === 'approved';
  const isRejected = verificationStatus === 'rejected';
  const isPending =
    verificationStatus === 'pending' ||
    verificationStatus === 'in review';

  const image =
    typeof unit.image_url === 'string' ? unit.image_url : '';

  const rating =
    typeof unit.avg_rating === 'number' ? unit.avg_rating : null;

  const dailyRate =
    typeof unit.price_per_day === 'number'
      ? unit.price_per_day
      : null;

  const tone = !user
    ? bookingTone.guest
    : isVerified
      ? bookingTone.verified
      : isRejected
        ? bookingTone.rejected
        : isPending
          ? bookingTone.pending
          : bookingTone.none;

  return (
    <>
      <Navbar />

      <main
        className="min-h-[calc(100vh-80px)] text-[#102A4A]"
        style={{ background: PAGE_BG }}
      >
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-28 sm:pt-32 lg:px-10">
          <Link
            href="/guest/browse"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F5C94] transition hover:text-[#173B66]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to browse
          </Link>

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
              {/* UNIT TICKET */}
              <article className="overflow-hidden rounded-[22px] bg-white ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-12px_rgba(16,42,74,0.4),0_4px_10px_-2px_rgba(16,42,74,0.18)]">
                <div className="relative aspect-[16/10] bg-[#A8C5E8]/30">
                  {image ? (
                    <Image
                      src={image}
                      alt={unit.unit_name}
                      fill
                      className="object-contain p-8"
                      unoptimized={image.startsWith('http')}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-7xl font-semibold text-[#6E9BD3]">
                      {String(unit.unit_name ?? '')
                        .trim()
                        .charAt(0)
                        .toUpperCase() || 'R'}
                    </div>
                  )}

                  <div className="absolute left-4 top-4">
                    <Plate id={String(unit.unit_id)} />
                  </div>

                  {rating !== null && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#102A4A]/85 px-3 py-1.5 text-xs font-semibold tabular-nums text-white">
                      <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                      {rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* tear line */}
                <div className="relative border-t-2 border-dashed border-slate-300">
                  <span
                    className="absolute left-0 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-slate-200"
                    style={{ background: PAGE_BG }}
                  />
                  <span
                    className="absolute right-0 top-0 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-slate-200"
                    style={{ background: PAGE_BG }}
                  />
                </div>

                <div className="p-6 sm:p-8">
                  <span className="inline-flex items-center rounded-full bg-[#A8C5E8]/30 px-3 py-1 text-xs font-semibold text-[#1F5C94]">
                    {unit.category || 'Rental unit'}
                  </span>

                  <h1 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[42px]">
                    {unit.unit_name}
                  </h1>

                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
                    {rating !== null ? (
                      <>
                        <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                        <span className="tabular-nums">{rating.toFixed(1)} / 5</span>
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 text-slate-300" />
                        <span className="text-slate-500">No ratings yet</span>
                      </>
                    )}
                  </div>

                  <p className="mt-6 max-w-2xl whitespace-pre-line text-sm leading-7 text-[#173B66]/80 sm:text-base">
                    {unit.description ||
                      'No description has been provided for this rental unit.'}
                  </p>
                </div>
              </article>

              {/* REVIEWS */}
              <section className="mt-10" aria-labelledby="reviews-heading">
                <span
                  className="mb-4 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#102A4A,#3E7DBB,#A8C5E8)]"
                  aria-hidden
                />
                <h2
                  id="reviews-heading"
                  className="text-3xl font-semibold tracking-[-0.04em]"
                >
                  Reviews
                </h2>

                <div className="mt-6 flex min-h-[140px] items-center rounded-[22px] border-2 border-dashed border-[#6E9BD3] bg-white/60 p-6 sm:p-8">
                  <p className="max-w-md text-sm leading-6 text-[#3E7DBB]">
                    Reviews for this unit will show up here once renters have rated it.
                  </p>
                </div>
              </section>
            </div>

            {/* BOOKING TICKET */}
            <aside
              className="lg:sticky lg:top-28"
              aria-labelledby="booking-heading"
            >
              <section
                className={`relative overflow-hidden rounded-2xl border bg-white shadow-[0_24px_50px_-26px_rgba(15,23,42,0.45)] ${tone.border}`}
                aria-labelledby="booking-heading"
              >
                <div
                  className={`relative flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-white ${tone.header}`}
                >
                  <span>RentSpot.ph</span>
                  <span
                    className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-black/25"
                    aria-hidden
                  />
                  <span className={tone.sub}>{tone.label}</span>
                </div>

                <div className="p-6">
                  <h2
                    id="booking-heading"
                    className="text-2xl font-semibold leading-tight tracking-[-0.03em]"
                  >
                    {!user
                      ? 'Ready to book this unit?'
                      : isVerified
                        ? 'Request this rental'
                        : 'Identity verification required'}
                  </h2>

                  {!user ? (
                    <>
                      <p className={`mt-2 text-sm leading-6 ${tone.text}`}>
                        Register or log in to continue with your booking.
                      </p>

                      <div className="mt-5 flex flex-col gap-3">
                        <Link href="/renter/auth/register" className={ctaPrimary}>
                          Register
                        </Link>

                        <Link href="/auth/login" className={ctaSecondary}>
                          Log in
                        </Link>
                      </div>
                    </>
                  ) : !isVerified ? (
                    <>
                      <p className={`mt-3 text-sm leading-6 ${tone.text}`}>
                        {isRejected
                          ? 'Your identity verification was rejected. Please review your verification status and resubmit your documents before booking.'
                          : isPending
                            ? 'Your identity verification is awaiting admin approval. You can browse rentals, but booking is unavailable until your identity is approved.'
                            : 'Identity verification is required before you can book. Complete your verification and wait for admin approval.'}
                      </p>

                      <div className="mt-5 flex flex-col items-start gap-3">
                        <VerifyIdentityButton isDeclined={isRejected} />

                        <Link
                          href="/renter/profile"
                          className="text-sm font-semibold text-[#1F5C94] underline underline-offset-4 transition hover:text-[#173B66]"
                        >
                          View verification status
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className={`mt-2 text-sm leading-6 ${tone.text}`}>
                        Your identity has been approved. Choose your rental
                        dates and submit your booking request.
                      </p>

                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <BookingRequestForm
                          unitId={String(unit.unit_id)}
                          dailyRate={dailyRate}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* tear-off stub: the daily rate */}
                <div className="relative border-t-2 border-dashed border-slate-300 px-6 py-5">
                  <span
                    className="absolute left-0 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-slate-200"
                    style={{ background: PAGE_BG }}
                  />
                  <span
                    className="absolute right-0 top-0 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-slate-200"
                    style={{ background: PAGE_BG }}
                  />
                  <p className="text-xs text-slate-500">Daily rate</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                    {dailyRate !== null
                      ? `₱${dailyRate.toLocaleString()}`
                      : 'Price available on request'}
                    {dailyRate !== null && (
                      <span className="text-sm font-medium text-slate-500"> / day</span>
                    )}
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}