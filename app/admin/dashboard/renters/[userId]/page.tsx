"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

type RenterProfile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  created_at: string | null;
  status: string | null;
  last_sign_in_at: string | null;
};

type KycRecord = {
  status: string | null;
  document_type: string | null;
  didit_status: string | null;
  admin_status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
};

type Booking = {
  booking_id: string;
  unit_id: string;
  unit_name: string | null;
  start_date: string;
  end_date: string;
  total_amount: number | string | null;
  status: string | null;
};

type AccountStatusChange = {
  from_status: string | null;
  to_status: string | null;
  actor_id: string | null;
  reason: string | null;
  created_at: string | null;
};

type RenterDetailResponse = {
  renter?: RenterProfile;
  latest_kyc?: KycRecord | null;
  kyc_history?: KycRecord[];
  bookings?: Booking[];
  account_status_history?: AccountStatusChange[];
  error?: string;
};

function formatStatus(status: string | null | undefined) {
  if (!status) return "Not available";
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatVerificationType(type: string | null) {
  if (type === "identity_verification") return "Identity Verification";
  return type ? formatStatus(type) : "Not available";
}

function statusStyle(status: string | null | undefined) {
  switch (status?.toLowerCase()) {
    case "approved":
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "pending":
    case "under_review":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "rejected":
    case "declined":
    case "suspended":
    case "inactive":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(status)}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {formatStatus(status)}
    </span>
  );
}

function formatDate(value: string | null | undefined, includeTime = false) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-PH", includeTime
    ? { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }
    : { dateStyle: "medium", timeZone: "Asia/Manila" }
  ).format(date);
}

function formatRentalDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: number | string | null) {
  if (value === null) return "Not available";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not available";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function Detail({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {icon && <span className="text-[#3E7DBB]" aria-hidden="true">{icon}</span>}
        {label}
      </dt>
      <dd className="mt-2 break-words text-[15px] font-semibold leading-5 text-[#102A4A]">{children ?? "Not available"}</dd>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-[#C7D9EC] bg-[#F7FAFE] px-4 py-5 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

export default function RenterDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [detail, setDetail] = useState<RenterDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const loadRenter = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/renters/${encodeURIComponent(userId)}`, { signal });
      const result = (await response.json().catch(() => ({}))) as RenterDetailResponse;
      if (!response.ok) throw new Error(result.error || "Unable to load renter details.");
      if (!result.renter) throw new Error("Renter details could not be found.");
      setDetail(result);
    } catch (loadError) {
      if (signal.aborted) return;
      setDetail(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load renter details.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadRenter(controller.signal);
    return () => controller.abort();
  }, [loadRenter, retryKey]);

  const renter = detail?.renter;
  const fullName = renter
    ? [renter.first_name, renter.last_name].filter(Boolean).join(" ").trim() || "Renter"
    : "Renter";
  const initials = renter
    ? [renter.first_name, renter.last_name]
        .filter((name): name is string => Boolean(name?.trim()))
        .map((name) => name.trim().charAt(0).toUpperCase())
        .slice(0, 2)
        .join("") || "R"
    : "R";
  const bookings = detail?.bookings ?? [];
  const accountStatusHistory = detail?.account_status_history ?? [];

  return (
    <main className="mx-auto min-h-full w-full max-w-[1440px] space-y-7 text-[#102A4A]">
      <header className="space-y-4">
        <Link
          href="/admin/dashboard/renters"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE8F5] bg-white px-3 text-sm font-semibold text-[#1F5C94] shadow-sm transition hover:border-[#A8C5E8] hover:bg-[#F7FAFE] hover:text-[#102A4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7DBB] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Renters
        </Link>
        <div className="relative overflow-hidden rounded-2xl border border-[#C7D9EC] bg-[#EAF2FB] shadow-[0_12px_30px_-24px_rgba(16,42,74,0.5)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1F5C94]" aria-hidden="true" />
          <div className="flex flex-col gap-5 p-5 pl-7 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pl-8">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#1F5C94] text-xl font-bold tracking-wide text-white ring-4 ring-white shadow-sm sm:h-[76px] sm:w-[76px] sm:text-2xl"
              >
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3E7DBB]">Renter account</p>
                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-[#102A4A] sm:text-3xl">
                  {loading ? "Loading renter..." : fullName}
                </h1>
                <div className="mt-2 flex flex-col gap-x-5 gap-y-1.5 text-sm text-[#36516F] sm:flex-row sm:flex-wrap sm:items-center">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-[#3E7DBB]" aria-hidden="true" />
                    <span className="truncate">{renter?.email || "Email not available"}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-[#3E7DBB]" aria-hidden="true" />
                    <span>{renter?.phone_number || "Mobile number not available"}</span>
                  </span>
                </div>
              </div>
            </div>
            {!loading && renter && (
              <div className="flex shrink-0 flex-col items-start gap-1 border-t border-[#C7D9EC] pt-3 sm:items-end sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#36516F]">Account Status</span>
                <StatusBadge status={renter.status} />
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-rose-300 bg-white px-3 py-2 font-semibold text-rose-800 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div role="status" className="rounded-2xl border border-[#DCE8F5] bg-white py-12 text-center text-sm text-slate-500 shadow-sm">
          <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[#1F5C94]" aria-hidden="true" />
          Loading renter details...
        </div>
      ) : !error && !renter ? (
        <EmptyState>Renter details are unavailable.</EmptyState>
      ) : renter ? (
        <>
          <section aria-labelledby="renter-profile-heading" className="overflow-hidden rounded-2xl border border-[#DCE8F5] bg-white shadow-sm">
            <div className="border-b border-[#DCE8F5] bg-[#F7FAFE] px-5 py-4 sm:px-6">
              <h2 id="renter-profile-heading" className="text-sm font-bold text-[#102A4A]">Profile Information</h2>
            </div>
            <dl className="grid divide-y divide-[#E6EEF7] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="px-5 py-4 sm:px-6">
                <Detail label="Date Registered" icon={<CalendarDays className="h-3.5 w-3.5" />}>{formatDate(renter.created_at)}</Detail>
              </div>
              <div className="px-5 py-4 sm:px-6">
                <Detail label="Last Sign In" icon={<Clock3 className="h-3.5 w-3.5" />}>{formatDate(renter.last_sign_in_at, true)}</Detail>
              </div>
            </dl>
          </section>

          <section aria-labelledby="latest-verification-heading" className="max-w-3xl overflow-hidden rounded-2xl border border-[#C7D9EC] bg-white shadow-sm">
            <div className="border-b border-[#DCE8F5] bg-[#F7FAFE] px-5 py-4 sm:px-6">
              <h2 id="latest-verification-heading" className="text-sm font-bold text-[#102A4A]">Latest Verification</h2>
            </div>
            <div className="p-5 sm:p-6">
              {detail?.latest_kyc ? (
                <LatestVerificationDetails record={detail.latest_kyc} />
              ) : (
                <EmptyState>No verification records found.</EmptyState>
              )}
            </div>
          </section>

          <section aria-labelledby="booking-history-heading" className="overflow-hidden rounded-2xl border border-[#DCE8F5] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#DCE8F5] bg-[#F7FAFE] px-5 py-4 sm:px-6">
              <h2 id="booking-history-heading" className="text-sm font-bold text-[#102A4A]">Booking History</h2>
              <span className="rounded-full bg-[#EAF2FB] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#1F5C94]">{bookings.length}</span>
            </div>
            {bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-[#EAF2FB] text-[11px] font-bold uppercase tracking-[0.08em] text-[#36516F]">
                    <tr>
                      <th scope="col" className="px-4 py-3.5">Unit Name</th>
                      <th scope="col" className="px-4 py-3.5">Booking Period</th>
                      <th scope="col" className="px-4 py-3.5">Total Amount</th>
                      <th scope="col" className="px-4 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6EEF7]">
                    {bookings.map((booking) => (
                      <tr key={booking.booking_id} className="align-middle transition-colors hover:bg-[#F7FAFE]">
                        <td className="px-4 py-4">
                          <span className="font-medium text-[#102A4A]">{booking.unit_name || "Unit unavailable"}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-[#3E7DBB]" aria-hidden="true" />
                            {formatRentalDate(booking.start_date)} - {formatRentalDate(booking.end_date)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-medium tabular-nums text-slate-700">{formatAmount(booking.total_amount)}</td>
                        <td className="px-4 py-4"><StatusBadge status={booking.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>No bookings found.</EmptyState>
            )}
          </section>

          <section aria-labelledby="account-history-heading" className="overflow-hidden rounded-2xl border border-[#DCE8F5] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#DCE8F5] bg-[#F7FAFE] px-5 py-4 sm:px-6">
              <h2 id="account-history-heading" className="text-sm font-bold text-[#102A4A]">Account Status History</h2>
              <span className="rounded-full bg-[#EAF2FB] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#1F5C94]">{accountStatusHistory.length}</span>
            </div>
            <div className="p-5 sm:p-6">
              {accountStatusHistory.length > 0 ? (
                <ol className="relative ml-2 border-l-2 border-[#C7D9EC] pl-6">
                  {accountStatusHistory.map((change, index) => (
                    <li key={`${change.created_at ?? "status"}-${index}`} className="relative grid gap-2 pb-5 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                      <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-[3px] border-white bg-[#3E7DBB] ring-1 ring-[#A8C5E8]" aria-hidden="true" />
                      <div className="space-y-1 rounded-lg px-3 py-2">
                        <p className="text-sm font-semibold text-[#102A4A]">
                          {formatStatus(change.from_status)} <span className="px-1 text-[#3E7DBB]">-&gt;</span> {formatStatus(change.to_status)}
                        </p>
                        {change.reason && <p className="text-sm leading-6 text-slate-600">{change.reason}</p>}
                        {change.actor_id && <p className="text-xs font-medium text-slate-500">Staff ID: {change.actor_id}</p>}
                      </div>
                      <time className="px-3 py-2 text-xs text-slate-500">{formatDate(change.created_at, true)}</time>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState>No account status changes recorded.</EmptyState>
              )}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function LatestVerificationDetails({ record }: { record: KycRecord }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-[#D5E4F3] border-l-4 border-l-[#3E7DBB] bg-[#EAF2FB] px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1F5C94] ring-1 ring-[#D5E4F3]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#36516F]">Verification Status</p>
          <div className="mt-1"><StatusBadge status={record.admin_status ?? record.status} /></div>
        </div>
      </div>
      <dl className="grid gap-x-5 sm:grid-cols-2">
        <div className="border-t border-[#E6EEF7] py-3.5">
          <Detail label="Verification Type">{formatVerificationType(record.document_type)}</Detail>
        </div>
        <div className="border-t border-[#E6EEF7] py-3.5">
          <Detail label="Identity Check Result"><StatusBadge status={record.didit_status} /></Detail>
        </div>
        <div className="border-t border-[#E6EEF7] py-3.5">
          <Detail label="Reviewed By">{record.reviewed_by ? `Staff ID: ${record.reviewed_by}` : "Not available"}</Detail>
        </div>
        <div className="border-t border-[#E6EEF7] py-3.5">
          <Detail label="Date Reviewed">{formatDate(record.reviewed_at, true)}</Detail>
        </div>
      </dl>
    </div>
  );
}
