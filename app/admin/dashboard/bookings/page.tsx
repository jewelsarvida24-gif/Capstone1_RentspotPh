"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const PAGE_BG = "#fbfdff";

type Renter = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
} | null;

type Unit = {
  unit_id: string;
  category: string | null;
  description: string | null;
  daily_rate: number | string | null;
  status: string | null;
  image_url: string | null;
} | null;

type Payment = {
  payment_id: string;
  booking_id: string;
  amount_paid: number | string | null;
  payment_method: string | null;
  payment_status: string | null;
  paid_at: string | null;
  refund_status: string | null;
  refund_mode: string | null;
  refund_reason: string | null;
  refunded_at: string | null;
} | null;

type AdminBooking = {
  booking_id: string;
  user_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  pickup_date: string | null;
  total_amount: number | string | null;
  status: string | null;
  created_at: string | null;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  renter: Renter;
  unit: Unit;
  payment: Payment;
};

type ApiResponse = {
  bookings?: AdminBooking[];
  test_mode?: boolean;
  error?: string;
  message?: string;
};

type BookingFilter = "all" | "needs_review" | "approved" | "rejected" | "other";

// Statuses that put a booking in the admin's review queue.
const REVIEW_STATUSES = ["pending_admin_review", "paid_awaiting_verification"];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

function peso(value: number | string | null | undefined) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2,
      }).format(amount)
    : "—";
}

function humanizeStatus(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

// Pill, dot and left rail colours for each booking status.
function statusMeta(value: string | null | undefined) {
  const status = value?.toLowerCase() ?? "";
  if (REVIEW_STATUSES.includes(status)) {
    return { stamp: "border-amber-600 text-amber-600", rail: "bg-amber-400" };
  }
  switch (status) {
    case "approved":
    case "confirmed":
      return { stamp: "border-emerald-600 text-emerald-600", rail: "bg-emerald-400" };
    case "rejected":
    case "cancelled":
    case "expired":
    case "payment_setup_failed":
      return { stamp: "border-red-600 text-red-600", rail: "bg-rose-400" };
    case "pending_payment":
      return { stamp: "border-sky-600 text-sky-600", rail: "bg-sky-400" };
    default:
      return { stamp: "border-slate-500 text-slate-500", rail: "bg-slate-300" };
  }
}

function renterName(renter: Renter) {
  if (!renter) return "Renter details unavailable";
  const name = [renter.first_name, renter.last_name].filter(Boolean).join(" ").trim();
  return name || renter.email || "Renter";
}

/* ---------- small themed pieces ---------- */

// Booking reference styled like a licence plate.
function Plate({ id, large }: { id: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border-2 border-[#102A4A] bg-white font-bold text-[#102A4A] ${
        large ? "gap-2 px-3 py-1 text-sm tracking-[0.2em]" : "gap-1.5 px-2 py-0.5 text-[11px] tracking-[0.12em]"
      }`}
    >
      <span className="h-3 w-1 rounded-full bg-[#3E7DBB]" />
      RSP {id.slice(0, 6).toUpperCase()}
    </span>
  );
}

// The status as a rubber stamp. Only the colour changes with the status.
function StatusStamp({ status, large }: { status: string | null | undefined; large?: boolean }) {
  const meta = statusMeta(status);
  const label = REVIEW_STATUSES.includes(status?.toLowerCase() ?? "") ? "Needs review" : humanizeStatus(status);
  return (
    <span
      className={`inline-flex shrink-0 -rotate-6 items-center rounded border-2 bg-white/90 font-extrabold uppercase leading-none ${
        large ? "px-3 py-1.5 text-sm tracking-[0.16em]" : "px-2 py-1 text-[10px] tracking-[0.14em]"
      } ${meta.stamp}`}
      style={{ filter: "url(#stamp-rough)" }}
    >
      {label}
    </span>
  );
}

function SectionBar() {
  return (
    <span
      className="mb-4 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#102A4A,#3E7DBB,#A8C5E8)]"
      aria-hidden
    />
  );
}

// A map-pin marker with the count inside. No card around it.
function PinStat({
  label,
  value,
  hint,
  color,
  attention,
}: {
  label: string;
  value: number;
  hint: string;
  color: string;
  attention?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 lg:border-l lg:border-[#A8C5E8]/60 lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
      <div className="relative h-[68px] w-14 shrink-0" aria-label={`${value}`}>
        {attention && (
          <span
            className="absolute left-1/2 top-1 h-12 w-12 -translate-x-1/2 animate-ping rounded-full opacity-30"
            style={{ background: color }}
            aria-hidden
          />
        )}
        <span
          className="absolute left-1/2 top-1 flex h-12 w-12 -translate-x-1/2 -rotate-45 items-center justify-center rounded-full rounded-bl-none shadow-[0_8px_16px_-6px_rgba(16,42,74,0.55)]"
          style={{ background: color }}
        >
          <span className="rotate-45 text-xl font-semibold tabular-nums text-white">{value}</span>
        </span>
        <span
          className="absolute bottom-0 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-[#102A4A]/25 blur-[2px]"
          aria-hidden
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#102A4A]">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

function Detail({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[#3E7DBB]">{label}</p>
      <p className={`mt-1 break-words text-sm ${strong ? "font-semibold tabular-nums text-[#102A4A]" : "font-medium text-[#173B66]"}`}>
        {value}
      </p>
    </div>
  );
}

/* ---------- page ---------- */

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [search, setSearch] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testMode, setTestMode] = useState(false);

  const loadBookings = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to load bookings.");
      const rows = Array.isArray(payload.bookings) ? payload.bookings : [];
      setBookings(rows);
      setTestMode(Boolean(payload.test_mode));
      setSelectedBookingId((current) =>
        current && rows.some((booking) => booking.booking_id === current)
          ? current
          : rows[0]?.booking_id ?? null
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unexpected error loading bookings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const isReviewQueue = (booking: AdminBooking) => REVIEW_STATUSES.includes(booking.status?.toLowerCase() ?? "");

  const counts = useMemo(
    () => ({
      all: bookings.length,
      needs_review: bookings.filter(isReviewQueue).length,
      approved: bookings.filter((booking) => booking.status?.toLowerCase() === "approved").length,
      rejected: bookings.filter((booking) => booking.status?.toLowerCase() === "rejected").length,
      other: bookings.filter(
        (booking) =>
          ![...REVIEW_STATUSES, "approved", "rejected"].includes(booking.status?.toLowerCase() ?? "")
      ).length,
    }),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const status = booking.status?.toLowerCase() ?? "";
      const matchesFilter =
        filter === "all" ||
        (filter === "needs_review" && REVIEW_STATUSES.includes(status)) ||
        (filter === "approved" && status === "approved") ||
        (filter === "rejected" && status === "rejected") ||
        (filter === "other" && ![...REVIEW_STATUSES, "approved", "rejected"].includes(status));
      const searchable = [
        booking.booking_id,
        booking.unit?.category ?? "",
        booking.unit_id,
        renterName(booking.renter),
        booking.renter?.email ?? "",
        booking.status ?? "",
        booking.payment?.payment_status ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [bookings, filter, search]);

  const selectedBooking =
    filteredBookings.find((booking) => booking.booking_id === selectedBookingId) ??
    bookings.find((booking) => booking.booking_id === selectedBookingId) ??
    null;

  useEffect(() => {
    setRejectionReason("");
    setSuccess("");
  }, [selectedBookingId]);

  const canReview = selectedBooking?.status?.toLowerCase() === "paid_awaiting_verification";

  const submitDecision = async (decision: "approved" | "rejected") => {
    if (!selectedBooking || !canReview) return;
    const reason = rejectionReason.trim();
    if (decision === "rejected" && !reason) {
      setError("A rejection reason is required.");
      return;
    }
    if (decision === "rejected" && reason.length > 1000) {
      setError("The rejection reason must be 1,000 characters or fewer.");
      return;
    }

    const prompt =
      decision === "approved"
        ? "Approve this paid booking?"
        : testMode
          ? "Reject this booking and record a simulated TEST MODE refund? No real money will be returned."
          : "Reject this paid booking? The test-mode refund flow is not enabled on this server.";
    if (!testMode && decision === "rejected") {
      setError("Refund handling is currently configured for PayMongo TEST MODE only. No rejection was submitted.");
      return;
    }
    if (!window.confirm(prompt)) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: selectedBooking.booking_id,
          decision,
          reason: decision === "rejected" ? reason : null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to save booking decision.");
      setSuccess(payload.message || (decision === "approved" ? "Booking approved." : "Booking rejected."));
      setRejectionReason("");
      await loadBookings(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error saving the decision.");
    } finally {
      setSubmitting(false);
    }
  };

  const filters: { id: BookingFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "needs_review", label: "Needs review", count: counts.needs_review },
    { id: "approved", label: "Approved", count: counts.approved },
    { id: "rejected", label: "Rejected", count: counts.rejected },
    { id: "other", label: "Other", count: counts.other },
  ];

  return (
    <main className="min-h-screen px-4 pb-20 pt-8 text-[#102A4A] sm:px-6 lg:px-10" style={{ background: PAGE_BG }}>
      {/* ink texture used by the status stamps */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="stamp-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
        </filter>
      </svg>
      <div className="mx-auto max-w-[1440px]">
        {/* HEADER */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <SectionBar />
            <span className="inline-flex items-center gap-2 rounded-full bg-[#102A4A] px-3 py-1 text-xs font-medium text-[#A8C5E8]">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin workspace
            </span>
            <h1 className="mt-4 text-[38px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[48px]">
              Booking management
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void loadBookings(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#1F5C94] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(16,42,74,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#173B66] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </header>

        {/* READINGS */}
        <div className="mt-10 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <PinStat label="Total bookings" value={counts.all} hint="Everything on record" color="#173B66" />
          <PinStat
            label="Needs review"
            value={counts.needs_review}
            hint={counts.needs_review > 0 ? "Paid and waiting on you" : "Queue is clear"}
            color="#f59e0b"
            attention={counts.needs_review > 0}
          />
          <PinStat label="Approved" value={counts.approved} hint="Cleared for pickup" color="#059669" />
          <PinStat label="Rejected" value={counts.rejected} hint="Declined and refunded" color="#e11d48" />
        </div>

        {/* NOTICES */}
        <div className="mt-6 space-y-3 empty:hidden">
          {error && (
            <div role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
              {success}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
          {/* QUEUE */}
          <section className="overflow-hidden rounded-[26px] bg-white ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-18px_rgba(16,42,74,0.35)]">
            <div className="bg-[#0b1f38] p-5">
              <span className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-white/10" aria-hidden />
              <div className="flex items-center rounded-full bg-[#0f2a4a] ring-1 ring-cyan-300/50 shadow-[0_0_12px_rgba(34,211,238,0.25)] transition focus-within:ring-cyan-300 focus-within:shadow-[0_0_22px_rgba(34,211,238,0.55)]">
                <Search className="ml-4 h-4 w-4 shrink-0 text-cyan-300" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search bookings"
                  aria-label="Search bookings"
                  className="min-w-0 flex-1 bg-transparent py-3 pl-3 pr-2 text-sm text-white outline-none placeholder:text-[#A8C5E8]/60"
                />
                <span className="h-5 w-px shrink-0 bg-white/15" aria-hidden />
                <div className="relative shrink-0">
                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value as BookingFilter)}
                    aria-label="Filter by status"
                    className="cursor-pointer appearance-none rounded-full bg-transparent py-3 pl-4 pr-9 text-sm font-medium text-white outline-none"
                  >
                    {filters.map((item) => (
                      <option key={item.id} value={item.id} className="bg-[#0b1f38] text-white">
                        {item.label} ({item.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8C5E8]" />
                </div>
              </div>
            </div>

            <div className="max-h-[760px] space-y-3 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#3E7DBB]">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Loading bookings…
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[#6E9BD3] bg-white/60 px-5 py-12 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-[#6E9BD3]" />
                  <p className="mt-3 font-semibold text-[#102A4A]">No bookings found</p>
                  <p className="mt-1 text-sm text-[#3E7DBB]">Try another filter or refresh the list.</p>
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const active = booking.booking_id === selectedBooking?.booking_id;
                  const meta = statusMeta(booking.status);
                  const paymentStatus = booking.payment?.payment_status?.toLowerCase() ?? "missing";
                  return (
                    <button
                      key={booking.booking_id}
                      type="button"
                      onClick={() => setSelectedBookingId(booking.booking_id)}
                      aria-current={active ? "true" : undefined}
                      className={`relative w-full overflow-hidden rounded-2xl py-4 pl-6 pr-4 text-left transition ${
                        active
                          ? "bg-[#A8C5E8]/20 ring-2 ring-[#1F5C94]"
                          : "bg-white ring-1 ring-slate-200 hover:ring-[#6E9BD3]"
                      }`}
                    >
                      <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.rail}`} aria-hidden />
                      <div className="flex items-center justify-between gap-2">
                        <Plate id={booking.booking_id} />
                        <StatusStamp status={booking.status} />
                      </div>
                      <p className="mt-3 truncate text-base font-semibold tracking-[-0.02em]">
                        {booking.unit?.category || "Rental unit"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{renterName(booking.renter)}</p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs">
                        <span className="tabular-nums text-slate-500">
                          {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">{peso(booking.total_amount)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            paymentStatus === "paid" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Payment: {humanizeStatus(paymentStatus)}
                        </span>
                        {booking.payment?.refund_status && booking.payment.refund_status !== "not_applicable" && (
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800">
                            Refund: {humanizeStatus(booking.payment.refund_status)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* CASE FILE */}
          <section className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            {!selectedBooking ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-[#6E9BD3] bg-white/60 text-center">
                <CreditCard className="h-9 w-9 text-[#6E9BD3]" />
                <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">Select a booking</p>
                <p className="mt-1 text-sm text-[#3E7DBB]">Details and admin actions will appear here.</p>
              </div>
            ) : (
              <article className="overflow-hidden rounded-[26px] bg-white ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-12px_rgba(16,42,74,0.4),0_4px_10px_-2px_rgba(16,42,74,0.18)]">
                {/* header band */}
                <div className="flex flex-col gap-3 bg-[linear-gradient(90deg,#102A4A,#173B66,#1F5C94)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#A8C5E8]">Booking details</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Plate id={selectedBooking.booking_id} large />
                      <span className="text-xs text-[#A8C5E8]">Created {formatDateTime(selectedBooking.created_at)}</span>
                    </div>
                  </div>
                  <StatusStamp status={selectedBooking.status} large />
                </div>

                <div className="space-y-6 p-6 sm:p-7">
                  {/* unit */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="h-28 w-full overflow-hidden rounded-2xl bg-[#A8C5E8]/30 ring-1 ring-[#A8C5E8] sm:w-40 sm:shrink-0">
                      {selectedBooking.unit?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedBooking.unit.image_url}
                          alt={selectedBooking.unit.category || "Rental unit"}
                          width={560}
                          height={320}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl font-semibold text-[#6E9BD3]">
                          {(selectedBooking.unit?.category || "R").trim().charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-semibold leading-tight tracking-[-0.04em]">
                        {selectedBooking.unit?.category || "Rental unit"}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {selectedBooking.unit?.description || "No unit description available."}
                      </p>
                    </div>
                  </div>

                  {/* facts */}
                  <div className="grid gap-x-6 gap-y-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
                    <Detail label="Renter" value={renterName(selectedBooking.renter)} />
                    <Detail label="Email" value={selectedBooking.renter?.email || "—"} />
                    <Detail label="Phone" value={selectedBooking.renter?.phone_number || "—"} />
                    <Detail label="Pickup date" value={formatDate(selectedBooking.pickup_date)} />
                    <Detail
                      label="Rental period"
                      value={`${formatDate(selectedBooking.start_date)} – ${formatDate(selectedBooking.end_date)}`}
                    />
                    <Detail label="Total amount" value={peso(selectedBooking.total_amount)} strong />
                    <Detail label="Booking ID" value={selectedBooking.booking_id} />
                    <Detail label="Unit ID" value={selectedBooking.unit_id} />
                  </div>

                  {/* payment */}
                  <div className="rounded-2xl bg-[#102A4A] p-5 text-white">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CreditCard className="h-4 w-4 text-[#6E9BD3]" /> Payment record
                    </div>
                    {selectedBooking.payment ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {[
                          ["Payment status", humanizeStatus(selectedBooking.payment.payment_status)],
                          ["Method", selectedBooking.payment.payment_method || "—"],
                          ["Paid at", formatDateTime(selectedBooking.payment.paid_at)],
                          ["Refund status", humanizeStatus(selectedBooking.payment.refund_status || "not_applicable")],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <p className="text-xs font-medium text-[#6E9BD3]">{label}</p>
                            <p className="mt-1 break-words text-sm font-medium">{value}</p>
                          </div>
                        ))}
                        {selectedBooking.payment.refund_reason && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-medium text-[#6E9BD3]">Refund note</p>
                            <p className="mt-1 text-sm font-medium">{selectedBooking.payment.refund_reason}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[#A8C5E8]">No payment record was found for this booking.</p>
                    )}
                  </div>

                  {selectedBooking.rejection_reason && (
                    <div className="rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-rose-900 ring-1 ring-rose-200">
                      <p className="font-semibold">Rejection reason</p>
                      <p className="mt-1 whitespace-pre-wrap">{selectedBooking.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* tear-off stub: the decision */}
                <div className="relative border-t-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-6 sm:px-7">
                  <span
                    className="absolute left-0 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-slate-200"
                    style={{ background: PAGE_BG }}
                  />
                  <span
                    className="absolute right-0 top-0 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-slate-200"
                    style={{ background: PAGE_BG }}
                  />
                  {canReview ? (
                    <div>
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                          <p className="font-semibold">Ready for your decision</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Payment is recorded as paid. Check the dates and unit before approving or rejecting.
                          </p>
                        </div>
                      </div>
                      <label className="mt-4 block text-sm font-semibold text-[#173B66]">
                        Rejection reason{" "}
                        <span className="font-normal text-slate-500">(required only when rejecting)</span>
                        <textarea
                          value={rejectionReason}
                          onChange={(event) => setRejectionReason(event.target.value)}
                          maxLength={1000}
                          rows={3}
                          placeholder="Explain why this booking cannot be approved…"
                          className="mt-2 w-full resize-y rounded-xl border border-[#A8C5E8] bg-white px-3 py-2.5 text-sm leading-6 text-[#102A4A] outline-none focus:border-[#3E7DBB] focus:ring-4 focus:ring-[#A8C5E8]/40"
                        />
                      </label>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => void submitDecision("approved")}
                          disabled={submitting}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(5,150,105,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve booking
                        </button>
                        <button
                          type="button"
                          onClick={() => void submitDecision("rejected")}
                          disabled={submitting || !rejectionReason.trim() || !testMode}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-300 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" /> Reject + test refund
                        </button>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        Decisions are available only for paid bookings awaiting verification. Reject is enabled only
                        when the server uses a PayMongo test key.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-slate-500">
                      {selectedBooking.status?.toLowerCase() === "pending_payment"
                        ? "This booking is still awaiting PayMongo payment verification. It cannot be approved or rejected yet."
                        : selectedBooking.payment?.payment_status?.toLowerCase() !== "paid" &&
                            REVIEW_STATUSES.includes(selectedBooking.status?.toLowerCase() ?? "")
                          ? "This booking status requires review, but the payment record is not marked paid. Verify payment before making an admin decision."
                          : "No admin decision is available for this booking's current status."}
                    </p>
                  )}
                </div>
              </article>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}