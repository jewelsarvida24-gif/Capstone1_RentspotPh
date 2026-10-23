import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "@/components/client-icons";

import RenterNavbar from "@/components/renter/renter-navbar";
import { createClient } from "@/lib/supabase_server";
import { createAdminClient } from "@/lib/supabase_admin";

const PAGE_BG = "#fbfdff";

/* ---------- helpers ---------- */

function statusLabel(status: string | null) {
  switch (status) {
    case "paid_awaiting_verification":
    case "pending":
      return { text: "Awaiting admin approval", dot: "bg-amber-400" };
    case "approved":
    case "confirmed":
      return { text: "Approved", dot: "bg-emerald-400" };
    case "rejected":
      return { text: "Rejected", dot: "bg-rose-400" };
    case "cancelled":
      return { text: "Cancelled", dot: "bg-slate-400" };
    default:
      return { text: status ?? "Unknown", dot: "bg-slate-400" };
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// Whole days between today (Manila time) and a YYYY-MM-DD date.
function daysFromToday(value: string | null) {
  if (!value) return 0;
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
  const diff = Date.parse(`${value.slice(0, 10)}T00:00:00Z`) - Date.parse(`${todayStr}T00:00:00Z`);
  return Math.round(diff / 86_400_000);
}

// Each ticket changes look with its status so renters can scan the list quickly.
function ticketTone(status: string | null) {
  switch (status) {
    case "approved":
    case "confirmed":
      return {
        closed: false,
        card: "bg-[#1F5C94] text-white shadow-[0_18px_36px_-12px_rgba(16,42,74,0.55),0_4px_10px_-2px_rgba(16,42,74,0.25)]",
        muted: "text-[#A8C5E8]",
        pill: "bg-white/15 text-white ring-white/30",
        divider: "border-white/20",
        tear: "border-white/40",
        notch: "",
        odo: "bg-[#102A4A]/60 text-white ring-white/20",
      };
    case "rejected":
    case "cancelled":
      return {
        closed: true,
        card: "bg-slate-100 text-slate-500 ring-1 ring-slate-200 shadow-[0_14px_28px_-14px_rgba(16,42,74,0.35),0_3px_8px_-2px_rgba(16,42,74,0.15)]",
        muted: "text-slate-400",
        pill: "bg-white text-slate-600 ring-slate-200",
        divider: "border-slate-200",
        tear: "border-slate-300",
        notch: "ring-1 ring-slate-200",
        odo: "",
      };
    default:
      return {
        closed: false,
        card: "bg-white text-[#102A4A] ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-12px_rgba(16,42,74,0.4),0_4px_10px_-2px_rgba(16,42,74,0.18)]",
        muted: "text-slate-500",
        pill: "bg-amber-50 text-amber-800 ring-amber-200",
        divider: "border-slate-200",
        tear: "border-slate-300",
        notch: "ring-1 ring-slate-200",
        odo: "bg-[#102A4A] text-white ring-[#102A4A]",
      };
  }
}

/* ---------- small themed pieces ---------- */

// Booking reference styled like a licence plate.
function Plate({ id, compact }: { id: string; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border-2 border-[#102A4A] bg-white font-bold text-[#102A4A] ${
        compact
          ? "gap-1.5 px-2 py-0.5 text-[11px] tracking-[0.12em]"
          : "gap-2 px-2.5 py-1 text-xs tracking-[0.2em]"
      }`}
    >
      <span className="h-3 w-1 rounded-full bg-[#3E7DBB]" />
      RSP {id.slice(0, 6).toUpperCase()}
    </span>
  );
}

// Countdown digits styled like an odometer.
function Odometer({
  value,
  className,
  small,
}: {
  value: number;
  className: string;
  small?: boolean;
}) {
  const digits = String(Math.max(0, value)).padStart(2, "0").split("");
  return (
    <div className="flex gap-1" aria-label={`${value}`}>
      {digits.map((d, i) => (
        <span
          key={i}
          className={`flex items-center justify-center rounded-md font-semibold tabular-nums ring-1 ${
            small ? "h-9 w-7 text-xl" : "h-14 w-9 text-3xl"
          } ${className}`}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

type IdState = "approved" | "pending" | "rejected" | "none";

const idTone = {
  approved: {
    header: "bg-[linear-gradient(90deg,#102A4A,#173B66,#1F5C94,#3E7DBB,#6E9BD3,#A8C5E8)]",
    sub: "text-[#102A4A]",
    border: "border-[#A8C5E8]",
    photo: "bg-[#A8C5E8]/30 text-[#1F5C94] ring-[#A8C5E8]",
    text: "text-[#1F5C94]",
    dot: "bg-[#3E7DBB]",
    bar: "bg-[#A8C5E8]",
    label: "ID verified",
    cta: null as string | null,
  },
  pending: {
    header: "bg-amber-500",
    sub: "text-amber-50",
    border: "border-amber-200",
    photo: "bg-amber-50 text-amber-600 ring-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    bar: "bg-amber-200",
    label: "Under review",
    cta: "View status" as string | null,
  },
  rejected: {
    header: "bg-rose-600",
    sub: "text-rose-100",
    border: "border-rose-200",
    photo: "bg-rose-50 text-rose-500 ring-rose-100",
    text: "text-rose-700",
    dot: "bg-rose-500",
    bar: "bg-rose-200",
    label: "Not accepted",
    cta: "Resubmit ID" as string | null,
  },
  none: {
    header: "bg-slate-500",
    sub: "text-slate-200",
    border: "border-slate-300",
    photo: "bg-slate-100 text-slate-400 ring-slate-200",
    text: "text-slate-600",
    dot: "bg-slate-400",
    bar: "bg-slate-200",
    label: "Not verified yet",
    cta: "Verify now" as string | null,
  },
};

// A passport-style "verified" stamp: double ring, text around the edge, star in the middle.
function VerifiedStamp() {
  const star = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 15 : 6.4;
    const a = ((-90 + i * 36) * Math.PI) / 180;
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute bottom-14 right-4 h-[84px] w-[84px] rotate-[-14deg] text-[#1F5C94] opacity-80"
      style={{ filter: "url(#stamp-rough)" }}
      aria-hidden
    >
      <defs>
        <path id="verified-ring" d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
      </defs>
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.9" strokeDasharray="1.5 2" />
      <text fill="currentColor" fontSize="8.6" fontWeight="800" letterSpacing="1.2">
        <textPath href="#verified-ring" textLength="210" lengthAdjust="spacing">
          VERIFIED RENTER ★ RENTSPOT.PH ★
        </textPath>
      </text>
      <polygon points={star} fill="currentColor" />
    </svg>
  );
}

// The renter's ID. Its colour follows the verification status.
function RenterIdCard({
  name,
  userId,
  state,
  photoUrl,
}: {
  name: string;
  userId: string;
  state: IdState;
  photoUrl?: string | null;
}) {
  const t = idTone[state];
  const initial = name.trim().charAt(0).toUpperCase() || "R";
  const pattern = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1];
  const bars = [...pattern, ...pattern, ...pattern];

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col items-center">
      <Link
        href="/renter/profile"
        aria-label={`Renter ID: ${t.label}`}
        className={`relative block w-full overflow-hidden rounded-2xl border bg-white shadow-[0_24px_50px_-26px_rgba(15,23,42,0.45)] transition-transform duration-300 hover:-translate-y-0.5 ${t.border}`}
      >
        <div
          className={`relative flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-white ${t.header}`}
        >
          <span>RentSpot.ph</span>
          <span
            className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-black/25"
            aria-hidden
          />
          <span className={t.sub}>Renter ID</span>
        </div>

        <div className="flex gap-4 p-4">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="h-28 w-24 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div
              className={`flex h-28 w-24 shrink-0 items-center justify-center rounded-lg text-4xl font-semibold ring-1 ${t.photo}`}
            >
              {initial}
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div>
              <p className="line-clamp-2 break-words text-xl font-semibold leading-tight tracking-[-0.02em] text-[#102A4A]">
                {name}
              </p>
              <p className="mt-1 text-xs text-slate-500">Renter</p>
            </div>

            <div className="space-y-2">
              <Plate id={userId} />
              <p className={`flex items-center gap-1.5 text-sm font-semibold ${t.text}`}>
                {state === "approved" ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m8 12 3 3 5-6" />
                  </svg>
                ) : (
                  <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                )}
                {t.label}
              </p>
            </div>
          </div>
        </div>

        {state === "approved" && <VerifiedStamp />}

        <div className="flex h-7 items-stretch justify-between gap-[2px] px-4" aria-hidden>
          {bars.map((w, i) => (
            <span key={i} className={t.bar} style={{ width: w }} />
          ))}
        </div>

        {t.cta ? (
          <p className="mt-4 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-[#1F5C94]">
            {t.cta}
          </p>
        ) : (
          <div className="h-4" />
        )}
      </Link>
    </div>
  );
}

// One reading on the overview, shown on odometer digits.
function StatTile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-[#A8C5E8]/70 transition hover:ring-[#6E9BD3]"
    >
      <p className="text-sm font-medium text-[#173B66]">{label}</p>
      <Odometer value={value} className="bg-[#102A4A] text-white ring-[#102A4A]" />
      <p className="text-xs leading-5 text-slate-500">{hint}</p>
    </Link>
  );
}

function Sprockets() {
  return (
    <div className="flex justify-between gap-2 overflow-hidden px-1" aria-hidden>
      {Array.from({ length: 48 }).map((_, i) => (
        <span key={i} className="h-2.5 w-4 shrink-0 rounded-[3px]" style={{ background: PAGE_BG }} />
      ))}
    </div>
  );
}

type Booking = {
  booking_id: string;
  unit_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  total_amount: number | null;
  reviewed_at?: string | null;
};
type Unit = { unit_id: string; category: string | null; description: string | null };

// A small rubber stamp for approved rentals. The rough-edge filter is defined once in the page.
function ApprovedStamp({ date }: { date?: string | null }) {
  return (
    <span
      className="inline-flex shrink-0 -rotate-6 flex-col items-center rounded border-[1.5px] border-red-600 bg-white/90 px-1.5 py-0.5 text-red-600"
      style={{ filter: "url(#stamp-rough)" }}
    >
      <span className="text-[10px] font-extrabold uppercase leading-none tracking-[0.14em]">
        Approved
      </span>
      {date && (
        <span className="mt-0.5 text-[7px] font-semibold leading-none tracking-wider tabular-nums">
          {formatDate(date)}
        </span>
      )}
    </span>
  );
}

function RentalTicket({ b, unit }: { b: Booking; unit?: Unit }) {
  const t = ticketTone(b.status);
  const s = statusLabel(b.status);
  const startsIn = daysFromToday(b.start_date);
  const endsIn = daysFromToday(b.end_date);

  const stub = t.closed
    ? null
    : startsIn > 0
      ? { top: "Starts in", value: startsIn, bottom: startsIn === 1 ? "day" : "days" }
      : endsIn >= 0
        ? { top: "Ends in", value: endsIn, bottom: endsIn === 1 ? "day" : "days" }
        : null;

  return (
    <Link
      href="/renter/my-rentals"
      className={`group relative flex h-full flex-col overflow-hidden rounded-[22px] transition-transform duration-300 hover:-translate-y-0.5 ${t.card}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <Plate id={b.booking_id} compact />
          {b.status === "approved" || b.status === "confirmed" ? (
            <ApprovedStamp date={b.reviewed_at} />
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${t.pill}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.text}
            </span>
          )}
        </div>

        <div>
          <p className="truncate text-xl font-semibold leading-tight tracking-[-0.03em]">
            {unit?.category || "Rental unit"}
          </p>
          {unit?.description && (
            <p className={`mt-1.5 line-clamp-2 text-xs leading-5 ${t.muted}`}>
              {unit.description}
            </p>
          )}
        </div>

        <div className={`mt-auto grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3 ${t.divider}`}>
          <div>
            <p className={`text-[11px] ${t.muted}`}>From</p>
            <p className="text-xs font-semibold tabular-nums">{formatDate(b.start_date)}</p>
          </div>
          <div>
            <p className={`text-[11px] ${t.muted}`}>Until</p>
            <p className="text-xs font-semibold tabular-nums">{formatDate(b.end_date)}</p>
          </div>
          <div className="col-span-2">
            <p className={`text-[11px] ${t.muted}`}>Total</p>
            <p className="text-sm font-semibold tabular-nums">
              ₱{Number(b.total_amount ?? 0).toLocaleString()}
            </p>
          </div>
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
            <Odometer small value={stub.value} className={t.odo} />
          </>
        ) : (
          <p className={`text-sm font-semibold ${t.closed ? "text-slate-500" : ""}`}>
            {t.closed ? "No longer active" : "Rental completed"}
          </p>
        )}
      </div>
    </Link>
  );
}

const flowSteps = [
  {
    title: "Find something you love",
    text: "Explore cameras, smartphones, vehicles, and other available units.",
    href: "/guest/browse",
  },
  {
    title: "Choose when you need it",
    text: "Pick your rental dates and check availability before booking.",
    href: null,
  },
  {
    title: "Get your account ready",
    text: "Complete your profile and ID verification when required.",
    href: "/renter/profile",
  },
  {
    title: "Pick it up and go",
    text: "Once everything is approved, pick up your rental and enjoy.",
    href: null,
  },
];

/* ---------- page ---------- */

export default async function RenterDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/renter/dashboard");
  }

  const adminSupabase = createAdminClient();

  const [{ data: profile }, { data: kycSubmission }, { data: bookings }] = await Promise.all([
    supabase
      .from("tbl_users")
      .select("first_name, last_name, email, phone_number, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("tbl_kyc")
      .select("admin_status, didit_status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Admin client skips RLS, but it is still filtered to the signed-in user only.
    adminSupabase
      .from("tbl_bookings")
      .select("booking_id, unit_id, start_date, end_date, status, total_amount, reviewed_at, created_at")
      .eq("user_id", user.id)
      .not("status", "in", "(pending_payment,expired,payment_setup_failed)")
      .order("created_at", { ascending: false }),
  ]);

  const all = (bookings ?? []) as Booking[];
  const list = all.slice(0, 8); // latest eight show as tickets (2 rows of 4)

  const isApproved = (b: Booking) => b.status === "approved" || b.status === "confirmed";
  const isAwaiting = (b: Booking) =>
    b.status === "pending" || b.status === "paid_awaiting_verification";

  const activeCount = all.filter(
    (b) => isApproved(b) && daysFromToday(b.start_date) <= 0 && daysFromToday(b.end_date) >= 0
  ).length;
  const upcomingCount = all.filter((b) => isApproved(b) && daysFromToday(b.start_date) > 0).length;
  const awaitingCount = all.filter(isAwaiting).length;
  const completedCount = all.filter((b) => isApproved(b) && daysFromToday(b.end_date) < 0).length;

  // Earliest approved rental that hasn't started yet.
  const nextPickup = all
    .filter((b) => isApproved(b) && daysFromToday(b.start_date) >= 0)
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""))[0];

  // Unit names for the ticket cards and the pickup reminder
  const unitIds = [
    ...new Set([...list.map((b) => b.unit_id), ...(nextPickup ? [nextPickup.unit_id] : [])]),
  ];
  const { data: units } = unitIds.length
    ? await adminSupabase
        .from("tbl_units")
        .select("unit_id, category, description")
        .in("unit_id", unitIds)
    : { data: [] as Unit[] };

  const firstName = profile?.first_name || user.user_metadata?.first_name || "there";

  const kycStatus = kycSubmission?.admin_status || "Not started";
  const normalizedStatus = kycStatus.toLowerCase();
  const isVerified = normalizedStatus === "approved";
  const idState: IdState =
    normalizedStatus === "approved"
      ? "approved"
      : normalizedStatus === "pending"
        ? "pending"
        : normalizedStatus === "rejected"
          ? "rejected"
          : "none";
  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || firstName;

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

        {/* HERO */}
        <section className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          {/* LEFT */}
          <div>
            <h1 className="max-w-xl text-[46px] font-semibold leading-[1.02] tracking-[-0.055em] text-[#102A4A] sm:text-[56px] lg:text-[64px]">
              Good to see you, {firstName}.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-[#173B66]/80 sm:text-lg">
              What are you looking for today? Explore available rentals, plan your booking, and get
              ready for your next experience.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/guest/browse"
                className="group inline-flex items-center gap-2 rounded-full bg-[#1F5C94] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(16,42,74,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#173B66] hover:shadow-[0_16px_34px_rgba(16,42,74,0.3)]"
              >
                Explore rentals
                <ArrowUpRight
                  size={17}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href="/renter/my-rentals"
                className="rounded-full px-5 py-3.5 text-sm font-semibold text-[#173B66] transition hover:bg-[#A8C5E8]/30 hover:text-[#1F5C94]"
              >
                My rentals
              </Link>
            </div>
          </div>

          {/* RIGHT: the renter ID */}
          <div className="mx-auto w-full max-w-[440px]">
            <RenterIdCard
              name={fullName}
              userId={user.id}
              state={idState}
              photoUrl={profile?.avatar_url}
            />
          </div>
        </section>

        {/* OVERVIEW: the dashboard readings */}
        {all.length > 0 && (
          <section className="mt-20 lg:mt-24">
            <div className="flex items-end justify-between">
              <div>
                <span className="mb-4 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#102A4A,#3E7DBB,#A8C5E8)]" aria-hidden />
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#102A4A] sm:text-4xl">
                  Overview
                </h2>
                <p className="mt-2 text-sm text-[#3E7DBB]">Where your rentals stand right now.</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile
                label="Active now"
                value={activeCount}
                hint={activeCount > 0 ? "Rentals you have right now" : "No rental in use"}
                href="/renter/my-rentals"
              />
              <StatTile
                label="Upcoming"
                value={upcomingCount}
                hint={
                  nextPickup && daysFromToday(nextPickup.start_date) > 0
                    ? `Next pickup ${formatDate(nextPickup.start_date)}`
                    : "Nothing scheduled"
                }
                href="/renter/my-rentals"
              />
              <StatTile
                label="Awaiting approval"
                value={awaitingCount}
                hint={awaitingCount > 0 ? "Our admin is reviewing" : "Nothing waiting"}
                href="/renter/my-rentals"
              />
              <StatTile
                label="Completed"
                value={completedCount}
                hint="Rentals you have finished"
                href="/renter/my-rentals"
              />
            </div>
          </section>
        )}

        {/* MY RENTALS: tickets */}
        <section className="mt-20 lg:mt-24">
          <div className="flex items-end justify-between">
            <div>
              <span className="mb-4 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#102A4A,#3E7DBB,#A8C5E8)]" aria-hidden />
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#102A4A] sm:text-4xl">
                My Rentals
              </h2>
              <p className="mt-2 text-sm text-[#3E7DBB]">Your latest bookings, newest first.</p>
            </div>

            <Link
              href="/renter/my-rentals"
              className="hidden text-sm font-semibold text-[#1F5C94] transition hover:text-[#173B66] sm:block"
            >
              Rental history →
            </Link>
          </div>

          {list.length > 0 ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((b) => (
                <li key={b.booking_id}>
                  <RentalTicket b={b} unit={units?.find((u) => u.unit_id === b.unit_id)} />
                </li>
              ))}
            </ul>
          ) : (
            <Link
              href="/guest/browse"
              aria-label="Explore available units"
              className="group mt-8 grid min-h-[240px] grid-cols-[1fr_9rem] overflow-hidden rounded-[26px] border-2 border-dashed border-[#6E9BD3] bg-white/60 transition hover:border-[#1F5C94] hover:bg-[#A8C5E8]/20"
            >
              <div className="flex flex-col justify-between gap-6 p-7 sm:p-9">
                <span className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-dashed border-[#6E9BD3] px-2.5 py-1 text-xs font-bold tracking-[0.2em] text-[#6E9BD3]">
                  RSP ------
                </span>
                <div>
                  <p className="text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#102A4A]">
                    Your rental shelf is empty.
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[#3E7DBB]">
                    Once you make a booking, your upcoming and previous rentals will appear here.
                  </p>
                </div>
                <p className="text-sm font-semibold text-[#1F5C94]">Explore available units</p>
              </div>
              <div className="flex items-center justify-center border-l-2 border-dashed border-[#6E9BD3] text-[#3E7DBB] transition group-hover:border-[#1F5C94]">
                <ArrowUpRight
                  size={34}
                  className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </div>
            </Link>
          )}
        </section>

        {/* RENTAL FLOW: a strip of film */}
        <section className="mt-20 lg:mt-24">
          <div className="max-w-2xl">
            <span className="mb-4 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#102A4A,#3E7DBB,#A8C5E8)]" aria-hidden />
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#102A4A] sm:text-4xl">
              From browsing to pickup.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#3E7DBB]">
              Everything you need for a smooth rental experience, without the unnecessary steps.
            </p>
          </div>

          <div className="mt-8 rounded-2xl bg-[#102A4A] px-3 py-3 shadow-[0_24px_50px_-24px_rgba(16,42,74,0.6)]">
            <Sprockets />
            <ol className="my-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {flowSteps.map((s, i) => {
                const body = (
                  <>
                    <p className="text-3xl font-semibold tabular-nums text-[#6E9BD3]">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-6 text-lg font-semibold leading-snug text-white">{s.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#A8C5E8]">{s.text}</p>
                    {i === 2 && !isVerified && (
                      <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                        Needs your attention
                      </p>
                    )}
                  </>
                );
                const cls = "block h-full rounded-lg bg-[#173B66] p-5 ring-1 ring-white/10 transition";
                return (
                  <li key={s.title}>
                    {s.href ? (
                      <Link href={s.href} className={`${cls} hover:bg-[#1F5C94]/80`}>
                        {body}
                      </Link>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
            <Sprockets />
          </div>
        </section>
      </main>
    </div>
  );
}