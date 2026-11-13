import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Clock3, Star, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import BookingRequestForm from '@/components/booking/BookingRequestForm';
import { createClient } from '@/lib/supabase_server';
import { demoUnits } from '@/lib/demoUnits';
import { isUuid } from '@/lib/uuid';
import VerifyIdentityButton from '@/components/renter/verify-identity-button';
import {
  getIdentityState,
  isLicenseCoveredByPrimaryId,
  type IdState,
} from '@/lib/identity-status';
import { isAddOnCategory, isCameraCategory, type BookingAddOn } from '@/lib/pricing';

const PAGE_BG = '#fbfdff';

function Plate({ id }: { id: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border-2 border-[#102A4A] bg-white px-2.5 py-1 text-xs font-bold tracking-[0.2em] text-[#102A4A]">
      <span className="h-3 w-1 rounded-full bg-[#3E7DBB]" />
      RSP {id.slice(0, 6).toUpperCase()}
    </span>
  );
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
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
  const isAddOn = isAddOnCategory(unit.category);
  let cameraAddOns: BookingAddOn[] = [];
  if (isCameraCategory(unit.category)) {
    const { data: addOnRows, error: addOnError } = await supabase
      .from('tbl_units')
      .select('unit_id, unit_name, category, daily_rate')
      .eq('status', 'available');
    if (addOnError) throw new Error(`Unable to load camera add-ons: ${addOnError.message}`);
    cameraAddOns = (addOnRows ?? [])
      .filter((item) => isAddOnCategory(item.category))
      .map((item) => ({
        unit_id: String(item.unit_id),
        unit_name: item.unit_name,
        daily_rate: Number(item.daily_rate),
      }))
      .filter((item) => Number.isFinite(item.daily_rate) && item.daily_rate > 0);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let idState: IdState = 'none';
  let licenseViaPrimaryId = false;
  let latestLicense: {
    admin_status: string | null;
    license_expiry_date: string | null;
    rejection_reason: string | null;
  } | null = null;

  if (user && !isAddOn) {
    const [{ data: profile }, { data: identitySubmissions }, { data: licenseRows }] =
      await Promise.all([
        supabase
          .from('tbl_users')
          .select('verification_status')
          .eq('user_id', user.id)
          .maybeSingle(),

        supabase
          .from('tbl_kyc')
          .select('admin_status, didit_status, id_document_type, id_expiry_date')
          .eq('user_id', user.id)
          .eq('document_type', 'identity_verification')
          .order('created_at', { ascending: false }),

        supabase
          .from('tbl_driver_license_verifications')
          .select('admin_status, license_expiry_date, rejection_reason')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

    idState = getIdentityState(identitySubmissions, profile?.verification_status);
    licenseViaPrimaryId = isLicenseCoveredByPrimaryId(identitySubmissions);
    latestLicense = licenseRows?.[0] ?? null;
  }

  const requiresLicense = Boolean(unit.requires_driver_license);

  // Identity
  const isIdentityApproved = idState === 'approved';

  // Driver's license (same rules as the profile page)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const licenseStatus = (latestLicense?.admin_status || '').toLowerCase();
  const licenseExpiry = latestLicense?.license_expiry_date || null;
  const isLicenseExpired =
    licenseStatus === 'approved' && (!licenseExpiry || licenseExpiry < today);

  // Okay na ang license kung approved ang hiwalay na license,
  // O kung Driver's License mismo ang ginamit sa approved na primary ID
  const isLicenseApproved =
    (licenseStatus === 'approved' && !isLicenseExpired) || licenseViaPrimaryId;

  const isLicensePending = licenseStatus === 'pending' || licenseStatus === 'in review';
  const isLicenseRejected = licenseStatus === 'rejected';

  const licenseOk = !requiresLicense || isLicenseApproved;
  const canBook = isIdentityApproved && licenseOk;

  // What the side panel should say when the renter cannot book yet
  let gate: {
    title: string;
    text: string;
    showVerifyButton: boolean;
    declined: boolean;
    review: boolean;
  } = {
    title: 'Verify your identity',
    text: 'Identity verification is required before you can book rental units.',
    showVerifyButton: true,
    declined: false,
    review: false,
  };

  if (idState === 'rejected') {
    gate = {
      title: 'Verification declined',
      text: 'Your identity verification was not approved. Please try again with a clear photo of a valid ID.',
      showVerifyButton: true,
      declined: true,
      review: false,
    };
  } else if (idState === 'pending') {
    gate = {
      title: 'Identity under review',
      text: 'We received your identity verification. An admin is reviewing it, and you can book once it is approved.',
      showVerifyButton: false,
      declined: false,
      review: true,
    };
  } else if (isIdentityApproved && !licenseOk) {
    const licenseText = isLicensePending
      ? "Your driver's license is under review. You can book this unit once it is approved."
      : isLicenseRejected
        ? `Your driver's license was rejected${
            latestLicense?.rejection_reason ? `: ${latestLicense.rejection_reason}` : '.'
          } Please check your profile for next steps.`
        : isLicenseExpired
          ? "Your driver's license has expired. Please check your profile to submit a valid one."
          : "This vehicle requires a driver's license. The ID you verified with is not a driver's license, so please check your profile to submit your license details.";

    gate = {
      title: "Driver's license required",
      text: licenseText,
      showVerifyButton: false,
      declined: false,
      review: isLicensePending,
    };
  }

  const image = typeof unit.image_url === 'string' ? unit.image_url : '';
  const rating = typeof unit.avg_rating === 'number' ? unit.avg_rating : null;
  const rawDailyRate = unit.daily_rate ?? unit.price_per_day;
  const dailyRate = rawDailyRate !== null && rawDailyRate !== undefined ? Number(rawDailyRate) : null;

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] text-[#102A4A]" style={{ background: PAGE_BG }}>
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-28 sm:pt-32 lg:px-10">
          <Link href="/guest/browse" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F5C94]">
            <ChevronLeft className="h-4 w-4" /> Back to browse
          </Link>

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
              <article className="overflow-hidden rounded-[22px] bg-white ring-1 ring-[#A8C5E8]/70 shadow">
                <div className="relative aspect-[16/10] bg-[#A8C5E8]/30">
                  {image ? (
                    <Image src={image} alt={unit.unit_name} fill className="object-contain p-8" unoptimized={image.startsWith('http')} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-7xl font-semibold text-[#6E9BD3]">
                      {String(unit.unit_name ?? '').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute left-4 top-4">
                    <Plate id={String(unit.unit_id)} />
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-[#A8C5E8]/30 px-3 py-1 text-xs font-semibold text-[#1F5C94]">
                      {unit.category || 'Rental unit'}
                    </span>
                    {requiresLicense && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-300">
                        <ShieldAlert size={14} /> Driver's License Required
                      </span>
                    )}
                  </div>

                  <h1 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[42px]">
                    {unit.unit_name}
                  </h1>

                  <p className="mt-6 max-w-2xl whitespace-pre-line text-sm leading-7 text-[#173B66]/80 sm:text-base">
                    {unit.description || 'No description provided.'}
                  </p>
                </div>
              </article>
            </div>

            <aside className="min-w-0 lg:sticky lg:top-28">
              <section className="min-w-0 rounded-2xl border bg-white p-6 shadow">
                {isAddOn ? (
                  <>
                    <p className="inline-flex rounded-full bg-[#A8C5E8]/30 px-3 py-1 text-xs font-semibold text-[#1F5C94]">
                      Camera add-on
                    </p>
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight">View-only item</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      This accessory cannot be rented by itself. It is intended to be included with a camera rental.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {!user ? 'Ready to book?' : canBook ? 'Request this rental' : gate.title}
                    </h2>

                    <div className="mt-6 flex items-center justify-between border-t pt-5">
                      <span className="text-sm font-medium text-slate-500">Daily rate</span>
                      <span className="text-lg font-bold text-slate-900">
                        {dailyRate !== null ? `PHP ${dailyRate.toLocaleString()}/day` : 'On request'}
                      </span>
                    </div>

                    {!user ? (
                      <div className="mt-5 flex flex-col gap-3">
                        <Link href="/renter/auth/register" className="rounded-full bg-[#1F5C94] px-6 py-3 text-center text-sm font-semibold text-white">Register</Link>
                        <Link href="/renter/auth/login" className="rounded-full px-5 py-3 text-center text-sm font-semibold text-[#1F5C94] ring-1 ring-[#A8C5E8]">Log in</Link>
                      </div>
                    ) : !canBook ? (
                      <div className="mt-4 space-y-4">
                        <p className="text-sm leading-6 text-slate-600">{gate.text}</p>

                        {gate.review && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                            <Clock3 size={16} />
                            Under review
                          </span>
                        )}

                        {gate.showVerifyButton && <VerifyIdentityButton isDeclined={gate.declined} />}

                        <Link href="/renter/profile" className="block text-center text-sm font-semibold text-[#1F5C94] underline">
                          View profile & verification status
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-5 min-w-0 border-t pt-5">
                        <BookingRequestForm
                          unitId={String(unit.unit_id)}
                          dailyRate={dailyRate}
                          addOns={cameraAddOns}
                        />
                      </div>
                    )}
                  </>
                )}
              </section>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}