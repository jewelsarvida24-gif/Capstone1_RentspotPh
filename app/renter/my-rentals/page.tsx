import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Camera,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  Smartphone,
} from "lucide-react";

import RenterNavbar from "@/components/renter/renter-navbar";
import { createAdminClient } from "@/lib/supabase_admin";
import { createClient } from "@/lib/supabase_server";

export const dynamic = "force-dynamic";

const PAGE_BG = "#fbfdff";

type UnitRow = {
  unit_id: string;
  category: string | null;
  description: string | null;
  daily_rate: number | string | null;
  image_url: string | null;
};

type PaymentRow = {
  payment_id: string;
  booking_id: string;
  amount_paid: number | string | null;
  payment_method: string | null;
  payment_status: string | null;
  paid_at: string | null;
};

type BookingRow = {
  booking_id: string;
  user_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  pickup_date: string | null;
  total_amount: number | string | null;
  status: string | null;
  reviewed_at: string | null;
  created_at: string | null;
};

/* ---------- helpers ---------- */

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const cleanDate = value.slice(0, 10);
  const date = new Date(`${cleanDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return cleanDate;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatPeso(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function normalized(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

// Whole days between today (Manila time) and a YYYY-MM-DD date.
function daysFromToday(value: string | null | undefined) {
  if (!value) return 0;
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
  const diff = Date.parse(`${value.slice(0, 10)}T00:00:00Z`) - Date.parse(`${todayStr}T00:00:00Z`);
  return Math.round(diff / 86_400_000);
}

type StatusKind = "approved" | "closed" | "pending";

function getDisplayStatus(bookingStatus: string | null, paymentStatus: string | null) {
  const booking = normalized(bookingStatus);
  const payment = normalized(paymentStatus);

  if (["rejected", "declined", "admin_rejected"].includes(booking)) {
    return {
      kind: "closed" as StatusKind,
      label: "Rejected",
      className: "border-rose-200 bg-rose-50 text-rose-700",
      description: "The Admin did not approve this booking.",
    };
  }
  if (["expired", "payment_expired"].includes(booking) || payment === "expired") {
    return {
      kind: "closed" as StatusKind,
      label: "Payment Expired",
      className: "border-amber-200 bg-amber-50 text-amber-800",
      description: "This payment session has expired.",
    };
  }
  if (["cancelled", "canceled"].includes(booking) || ["cancelled", "canceled"].includes(payment)) {
    return {
      kind: "closed" as StatusKind,
      label: "Cancelled",
      className: "border-slate-200 bg-white text-slate-700",
      description: "This booking was cancelled.",
    };
  }
  if (["approved", "confirmed", "accepted"].includes(booking)) {
    return {
      kind: "approved" as StatusKind,
      label: "Approved",
      className: "border-white/30 bg-white/15 text-white",
      description: "The Admin approved this booking.",
    };
  }
  if (
    ["pending_review", "pending_admin_review", "under_review", "waiting_for_admin_approval", "for_review"].includes(
      booking
    )
  ) {
    return {
      kind: "pending" as StatusKind,
      label: "Pending",
      className: "border-[#A8C5E8] bg-[#A8C5E8]/25 text-[#1F5C94]",
      description: "The booking is waiting for an Admin decision.",
    };
  }
  if (["paid", "succeeded", "success", "completed", "processed"].includes(payment)) {
    return {
      kind: "pending" as StatusKind,
      label: "Pending",
      className: "border-[#A8C5E8] bg-[#A8C5E8]/25 text-[#1F5C94]",
      description: "Payment is recorded. The booking is waiting for an Admin decision.",
    };
  }
  if (["pending_payment", "awaiting_payment", "payment_pending"].includes(booking) || !booking) {
    return {
      kind: "pending" as StatusKind,
      label: "Pending",
      className: "border-[#A8C5E8] bg-[#A8C5E8]/25 text-[#1F5C94]",
      description:
        "Your checkout is awaiting payment confirmation. You do not need to restart checkout from My Rentals. Once payment is verified, your booking can proceed to Admin review.",
    };
  }
  return {
    kind: "pending" as StatusKind,
    label: (bookingStatus ?? "Pending").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    className: "border-slate-200 bg-slate-50 text-slate-700",
    description: "Your latest booking status is shown here.",
  };
}

function getCategoryIcon(category: string | null | undefined) {
  const value = normalized(category);
  if (value.includes("vehicle") || value.includes("car")) return CarFront;
  if (value.includes("phone") || value.includes("smartphone")) return Smartphone;
  return Camera;
}

// Each ticket changes look with its status so renters can scan the list quickly.
function ticketTone(kind: StatusKind) {
  switch (kind) {
    case "approved":
      return {
        closed: false,
        card: "bg-[#1F5C94] text-white shadow-[0_18px_36px_-12px_rgba(16,42,74,0.55),0_4px_10px_-2px_rgba(16,42,74,0.25)]",
        muted: "text-[#A8C5E8]",
        divider: "border-white/20",
        tear: "border-white/40",
        notch: "",
        odo: "bg-[#102A4A]/60 text-white ring-white/20",
        thumb: "bg-white/15 text-white",
      };
    case "closed":
      return {
        closed: true,
        card: "bg-slate-100 text-slate-500 ring-1 ring-slate-200 shadow-[0_14px_28px_-14px_rgba(16,42,74,0.35),0_3px_8px_-2px_rgba(16,42,74,0.15)]",
        muted: "text-slate-400",
        divider: "border-slate-200",
        tear: "border-slate-300",
        notch: "ring-1 ring-slate-200",
        odo: "",
        thumb: "bg-white text-slate-400",
      };
    default:
      return {
        closed: false,
        card: "bg-white text-[#102A4A] ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-12px_rgba(16,42,74,0.4),0_4px_10px_-2px_rgba(16,42,74,0.18)]",
        muted: "text-slate-500",
        divider: "border-slate-200",
        tear: "border-slate-300",
        notch: "ring-1 ring-[#A8C5E8]/70",
        odo: "bg-[#102A4A] text-white ring-[#102A4A]",
        thumb: "bg-[#A8C5E8]/30 text-[#1F5C94]",
      };
  }
}

/* ---------- small themed pieces ---------- */

// Booking reference styled like a licence plate.
function Plate({ id }: { id: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-[#102A4A] bg-white px-2 py-0.5 text-[11px] font-bold tracking-[0.12em] text-[#102A4A]">
      <span className="h-3 w-1 rounded-full bg-[#3E7DBB]" />
      RSP {id.slice(0, 6).toUpperCase()}
    </span>
  );
}

// Countdown digits styled like an odometer.
function Odometer({ value, className }: { value: number; className: string }) {
  const digits = String(Math.max(0, value)).padStart(2, "0").split("");
  return (
    <div className="flex gap-1" aria-label={`${value}`}>
      {digits.map((d, i) => (
        <span
          key={i}
          className={`flex h-9 w-7 items-center justify-center rounded-md text-xl font-semibold tabular-nums ring-1 ${className}`}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

// A flat clothespin that clips a ticket to the line.
function Clothespin() {
  return (
    <span
      className="absolute -top-7 left-1/2 z-20 h-9 w-3.5 -translate-x-1/2 rounded-[3px] bg-[#3E7DBB] ring-1 ring-[#173B66]/30"
      aria-hidden
    >
      <span className="absolute left-1/2 top-[13px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#173B66]" />
      <span className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-[#173B66]/50" />
    </span>
  );
}

// One ticket hanging from the line. Neighbouring slots draw one continuous line across the row.
function HangSlot({ children, tilt }: { children: React.ReactNode; tilt: number }) {
  return (
    <div className="relative pt-8">
      <span className="absolute -left-4 -right-4 top-[10px] h-[3px] rounded-full bg-[#3E7DBB]" aria-hidden />
      <div
        className="relative z-10 transition-transform duration-500 hover:!rotate-0"
        style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "50% -21px" }}
      >
        <Clothespin />
        {children}
      </div>
    </div>
  );
}

const TILTS = [-1.6, 1.1, -0.8, 1.7];

// A small rubber stamp for approved rentals. The rough-edge filter is defined once in the page.
function ApprovedStamp({ date }: { date?: string | null }) {
  return (
    <span
      className="inline-flex shrink-0 -rotate-6 flex-col items-center rounded border-[1.5px] border-red-600 bg-white/90 px-1.5 py-0.5 text-red-600"
      style={{ filter: "url(#stamp-rough)" }}
    >
      <span className="text-[10px] font-extrabold uppercase leading-none tracking-[0.14em]">Approved</span>
      {date && (
        <span className="mt-0.5 text-[7px] font-semibold leading-none tracking-wider tabular-nums">
          {formatDate(date)}
        </span>
      )}
    </span>
  );
}

function RentalTicket({
  booking,
  unit,
  payment,
}: {
  booking: BookingRow;
  unit?: UnitRow;
  payment?: PaymentRow;
}) {
  const status = getDisplayStatus(booking.status, payment?.payment_status ?? null);
  const t = ticketTone(status.kind);
  const CategoryIcon = getCategoryIcon(unit?.category);
  const unitName = unit?.category || "Rental unit";

  const startsIn = daysFromToday(booking.start_date);
  const endsIn = daysFromToday(booking.end_date);
  const stub = t.closed
    ? null
    : startsIn > 0
      ? { top: "Starts in", value: startsIn, bottom: startsIn === 1 ? "day" : "days" }
      : endsIn >= 0
        ? { top: "Ends in", value: endsIn, bottom: endsIn === 1 ? "day" : "days" }
        : null;

  const paid = ["paid", "succeeded", "success", "completed", "processed"].includes(
    normalized(payment?.payment_status)
  );
  const paymentLabel = (payment?.payment_status || "Not recorded")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[22px] transition-transform duration-300 hover:-translate-y-1 ${t.card}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Plate id={booking.booking_id} />
          {status.kind === "approved" ? (
            <ApprovedStamp date={booking.reviewed_at} />
          ) : (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${status.className}`}
            >
              {status.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${t.thumb}`}
          >
            {unit?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={unit.image_url} alt={unitName} className="h-full w-full object-cover" />
            ) : (
              <CategoryIcon size={22} strokeWidth={1.6} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold leading-tight tracking-[-0.03em]">{unitName}</p>
            <p className={`mt-0.5 line-clamp-2 text-xs leading-5 ${t.muted}`}>
              {unit?.description || "Your selected rental unit."}
            </p>
          </div>
        </div>

        <div className={`mt-auto grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3 ${t.divider}`}>
          <div>
            <p className={`text-[11px] ${t.muted}`}>From</p>
            <p className="text-xs font-semibold tabular-nums">{formatDate(booking.start_date)}</p>
          </div>
          <div>
            <p className={`text-[11px] ${t.muted}`}>Until</p>
            <p className="text-xs font-semibold tabular-nums">{formatDate(booking.end_date)}</p>
          </div>
          <div>
            <p className={`text-[11px] ${t.muted}`}>Pickup</p>
            <p className="text-xs font-semibold tabular-nums">{formatDate(booking.pickup_date)}</p>
          </div>
          <div>
            <p className={`text-[11px] ${t.muted}`}>Total</p>
            <p className="text-sm font-semibold tabular-nums">{formatPeso(booking.total_amount)}</p>
          </div>
        </div>

        <div className={`flex flex-col gap-1.5 border-t pt-3 ${t.divider}`}>
          <p className="inline-flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {paid ? <CheckCircle2 size={13} /> : <CreditCard size={13} />}
            {paymentLabel}
            {payment?.paid_at ? (
              <span className={`font-normal ${t.muted}`}>· {formatDate(payment.paid_at)}</span>
            ) : null}
          </p>
          <p className={`line-clamp-3 text-[11px] leading-4 ${t.muted}`}>{status.description}</p>
        </div>
      </div>

      {/* tear-off stub */}
      <div
        className={`relative flex items-center justify-between gap-3 border-t-2 border-dashed px-5 py-3 ${t.tear}`}
      >
        <span
          className={`absolute left-0 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ${t.notch}`}
          style={{ background: PAGE_BG }}
        />
        <span
          className={`absolute right-0 top-0 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full ${t.notch}`}
          style={{ background: PAGE_BG }}
        />
        {stub ? (
          <>
            <p className={`text-xs ${t.muted}`}>
              {stub.top} <span className="font-semibold">{stub.bottom}</span>
            </p>
            <Odometer value={stub.value} className={t.odo} />
          </>
        ) : (
          <p className={`text-sm font-semibold ${t.closed ? "text-slate-500" : ""}`}>
            {t.closed ? "No longer active" : "Rental completed"}
          </p>
        )}
      </div>
    </article>
  );
}

/* ---------- page ---------- */

export default async function RenterMyRentalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/renter/my-rentals");
  }

  const [profileResult, kycResult] = await Promise.all([
    supabase
      .from("tbl_users")
      .select("first_name, last_name, email, phone_number")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("tbl_kyc")
      .select("admin_status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const isVerified = normalized(kycResult.data?.admin_status) === "approved";
  const adminSupabase = createAdminClient();

  // Use the signed-in user's ID on the server so renters can only see their own bookings.
  const { data: bookingRows, error: bookingsError } = await adminSupabase
    .from("tbl_bookings")
    .select(
      "booking_id, user_id, unit_id, start_date, end_date, pickup_date, total_amount, status, reviewed_at, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const bookings = (bookingRows ?? []) as BookingRow[];
  const unitIds = [...new Set(bookings.map((booking) => booking.unit_id).filter(Boolean))];
  const bookingIds = bookings.map((booking) => booking.booking_id).filter(Boolean);

  let units: UnitRow[] = [];
  let payments: PaymentRow[] = [];
  let relatedDataError: string | null = null;

  if (unitIds.length > 0) {
    const { data, error } = await adminSupabase
      .from("tbl_units")
      .select("unit_id, category, description, daily_rate, image_url")
      .in("unit_id", unitIds);
    if (error) relatedDataError = error.message;
    units = (data ?? []) as UnitRow[];
  }

  if (bookingIds.length > 0) {
    const { data, error } = await adminSupabase
      .from("tbl_payments")
      .select("payment_id, booking_id, amount_paid, payment_method, payment_status, paid_at")
      .in("booking_id", bookingIds);
    if (error && !relatedDataError) relatedDataError = error.message;
    payments = (data ?? []) as PaymentRow[];
  }

  const unitById = new Map(units.map((unit) => [unit.unit_id, unit]));
  const paymentByBookingId = new Map(payments.map((payment) => [payment.booking_id, payment]));
  const firstName = profile?.first_name || "there";

  return (
    <div className="min-h-screen overflow-x-hidden text-[#102A4A]" style={{ background: PAGE_BG }}>
      <RenterNavbar
        firstName={profile?.first_name || undefined}
        lastName={profile?.last_name || undefined}
        needsVerification={!isVerified}
      />

      {/* The navbar floats over the page, so the top padding keeps content clear of it. */}
      <main className="mx-auto max-w-[1280px] px-6 pb-28 pt-28 sm:pt-32 lg:px-10">
        {/* ink texture used by the approved stamp */}
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id="stamp-rough" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
          </filter>
        </svg>

        {/* HEADER */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span
              className="mb-4 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#102A4A,#3E7DBB,#A8C5E8)]"
              aria-hidden
            />
            <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.055em] text-[#102A4A] sm:text-[56px]">
              My Rentals
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#173B66]/80">
              Hi {firstName}, every booking on your account is here, newest first.
            </p>
          </div>

          {/* notice to the renter: a paper note pinned up, no board behind it */}
          <aside className="relative mt-3 w-full rotate-[1.4deg] rounded-xl bg-white shadow-[0_10px_24px_-14px_rgba(16,42,74,0.45)] ring-1 ring-red-200 sm:max-w-[340px]">
            {/* pushpin */}
            <span
              className="absolute -top-3 left-1/2 z-10 h-5 w-5 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_3px_5px_rgba(16,42,74,0.35)] ring-2 ring-red-700/30"
              aria-hidden
            >
              <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-white/70" />
            </span>
            <div className="flex flex-col gap-2.5 px-5 pb-4 pt-6">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 ring-1 ring-red-200">
                <AlertTriangle size={12} />
                Notice
              </span>
              <p className="text-xs leading-5 text-[#173B66]">
                Admin booking decisions are scheduled daily at
                <span className="mx-1.5 inline-flex gap-1 align-middle">
                  <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-red-700">
                    11:00 AM
                  </span>
                  <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-red-700">
                    11:00 PM
                  </span>
                </span>
                Philippine Time (PHT). Check this page to monitor payment verification and your booking status.
              </p>
            </div>
          </aside>
        </section>

        {/* THE CLOTHESLINE */}
        <section className="mt-16 lg:mt-20">
          {bookingsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
              We couldn&apos;t load your bookings right now. Please refresh the page.{" "}
              <span className="mt-2 block break-words text-xs">{bookingsError.message}</span>
            </div>
          ) : (
            <>
              {relatedDataError ? (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Some rental or payment details could not be loaded right now. Your booking records are still
                  shown where available.
                </div>
              ) : null}

              <p className="mb-2 text-sm text-[#3E7DBB]">
                {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
              </p>

              {bookings.length === 0 ? (
                <HangSlot tilt={0}>
                  <Link
                    href="/guest/browse"
                    aria-label="Browse available units"
                    className="group grid min-h-[200px] grid-cols-[1fr_7rem] overflow-hidden rounded-[22px] border-2 border-dashed border-[#6E9BD3] bg-white/60 transition hover:border-[#1F5C94] hover:bg-[#A8C5E8]/20"
                  >
                    <div className="flex flex-col justify-between gap-5 p-6 sm:p-8">
                      <span className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-dashed border-[#6E9BD3] px-2.5 py-1 text-xs font-bold tracking-[0.2em] text-[#6E9BD3]">
                        RSP ------
                      </span>
                      <div>
                        <p className="text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#102A4A] sm:text-3xl">
                          Nothing hanging here yet.
                        </p>
                        <p className="mt-2 max-w-md text-sm leading-6 text-[#3E7DBB]">
                          Once you create a booking, its ticket will be clipped to the line.
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#1F5C94]">Browse available units</p>
                    </div>
                    <div className="flex items-center justify-center border-l-2 border-dashed border-[#6E9BD3] text-[#3E7DBB] transition group-hover:border-[#1F5C94]">
                      <ArrowUpRight
                        size={32}
                        className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                </HangSlot>
              ) : (
                <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                  {bookings.map((booking, i) => (
                    <li key={booking.booking_id}>
                      <HangSlot tilt={TILTS[i % TILTS.length]}>
                        <RentalTicket
                          booking={booking}
                          unit={unitById.get(booking.unit_id)}
                          payment={paymentByBookingId.get(booking.booking_id)}
                        />
                      </HangSlot>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}