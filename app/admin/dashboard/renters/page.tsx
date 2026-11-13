"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Mail, Phone, RefreshCw, Search, ShieldCheck } from "lucide-react";

type Renter = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  status: string | null;
  verification_status: string | null;
  latest_kyc_status: string | null;
  booking_count: number;
};

type RentersResponse = {
  renters?: Renter[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
  error?: string;
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

type RenterDetail = {
  renter: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
    created_at: string | null;
    status: string | null;
    last_sign_in_at: string | null;
  };
  latest_kyc: KycRecord | null;
  kyc_history: KycRecord[];
  bookings: Booking[];
  account_status_history: AccountStatusChange[];
};

type RenterDetailResponse = RenterDetail & { error?: string };

const PAGE_SIZE = 20;

function displayStatus(status: string | null) {
  if (!status) return "Not available";
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusStyle(status: string | null) {
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
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyle(status)}`}>
      {displayStatus(status)}
    </span>
  );
}

function renterName(renter: Renter) {
  return [renter.first_name, renter.last_name].filter(Boolean).join(" ").trim() || "Name unavailable";
}

function formatVerificationType(type: string | null) {
  if (type === "identity_verification") return "Identity Verification";
  return type ? displayStatus(type) : "Not available";
}

function formatDate(value: string | null, includeTime = false) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-PH", includeTime
    ? { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }
    : { dateStyle: "medium", timeZone: "Asia/Manila" }
  ).format(date);
}

function formatRentalDate(value: string | null) {
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

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 border-t border-[#E6EEF7] py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-[#102A4A]">{children ?? "Not available"}</dd>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-4 sm:px-5" aria-label={title}>
      <h3 className="mb-3 text-sm font-semibold text-[#102A4A]">{title}</h3>
      {children}
    </section>
  );
}

export default function RentersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [renters, setRenters] = useState<Renter[]>([]);
  const [selectedRenterId, setSelectedRenterId] = useState<string | null>(null);
  const [selectedRenterDetail, setSelectedRenterDetail] = useState<RenterDetail | null>(null);
  const [detailRenterId, setDetailRenterId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailRetryKey, setDetailRetryKey] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!selectedRenterId) {
      setSelectedRenterDetail(null);
      setDetailRenterId(null);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    const renterId = selectedRenterId;
    const controller = new AbortController();
    async function loadSelectedRenter() {
      setSelectedRenterDetail(null);
      setDetailRenterId(null);
      setDetailLoading(true);
      setDetailError(null);
      try {
        const response = await fetch(`/api/admin/renters/${encodeURIComponent(renterId)}`, {
          signal: controller.signal,
        });
        const result = (await response.json().catch(() => ({}))) as RenterDetailResponse;
        if (!response.ok) throw new Error(result.error || "Unable to load renter details.");
        if (!result.renter) throw new Error("Renter details could not be found.");
        setSelectedRenterDetail(result);
        setDetailRenterId(renterId);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setDetailError(loadError instanceof Error ? loadError.message : "Unable to load renter details.");
      } finally {
        if (!controller.signal.aborted) setDetailLoading(false);
      }
    }

    void loadSelectedRenter();
    return () => controller.abort();
  }, [selectedRenterId, detailRetryKey]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (kycStatus) params.set("kycStatus", kycStatus);
    if (accountStatus) params.set("accountStatus", accountStatus);

    async function loadRenters() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/renters?${params.toString()}`, {
          signal: controller.signal,
        });
        const result = (await response.json().catch(() => ({}))) as RentersResponse;
        if (!response.ok) throw new Error(result.error || "Unable to load renters.");
        const rows = result.renters ?? [];
        setRenters(rows);
        setSelectedRenterId((current) =>
          current && rows.some((renter) => renter.user_id === current)
            ? current
            : rows[0]?.user_id ?? null
        );
        setTotal(result.pagination?.total ?? result.total ?? 0);
        setTotalPages(result.pagination?.totalPages ?? 0);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load renters.");
        setRenters([]);
        setSelectedRenterId(null);
        setTotal(0);
        setTotalPages(0);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadRenters();
    return () => controller.abort();
  }, [debouncedSearch, kycStatus, accountStatus, page, retryKey]);

  const updateKycStatus = (value: string) => {
    setKycStatus(value);
    setPage(1);
  };
  const updateAccountStatus = (value: string) => {
    setAccountStatus(value);
    setPage(1);
  };
  const selectedRenter = renters.find((renter) => renter.user_id === selectedRenterId) ?? null;

  return (
    <main className="min-h-full space-y-6 text-[#102A4A]">
      <header className="flex flex-col gap-4 border-b border-[#DCE8F5] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Renter Management</h1>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <p aria-live="polite" className="inline-flex items-center gap-2 rounded-md border border-[#D5E4F3] bg-[#EAF2FB] px-3 py-2 text-sm text-[#36516F]">
            {loading ? (
              <span>Loading renters…</span>
            ) : (
              <>
                <span className="font-semibold tabular-nums text-[#102A4A]">{total.toLocaleString()}</span>
                <span>{total === 1 ? "renter" : "renters"}</span>
              </>
            )}
          </p>
          <Link
            href="/admin/dashboard/kyc"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#1F5C94] px-4 text-sm font-semibold text-white transition hover:bg-[#173B66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7DBB] focus-visible:ring-offset-2"
          >
            KYC Management
          </Link>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-rose-300 bg-white px-3 py-2 font-semibold text-rose-800 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
        <section aria-label="Renter list" aria-busy={loading} className="overflow-hidden rounded-2xl border border-[#A8C5E8]/70 bg-white shadow-sm">
          <div className="space-y-3 bg-[#0b1f38] p-4">
            <label className="flex items-center rounded-md bg-[#0f2a4a] ring-1 ring-white/15 transition focus-within:ring-2 focus-within:ring-[#A8C5E8]">
              <span className="sr-only">Search renters</span>
              <Search className="ml-3 h-4 w-4 shrink-0 text-[#A8C5E8]" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search renters"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A8C5E8]/70"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="sr-only">Filter by KYC status</span>
                <select
                  value={kycStatus}
                  onChange={(event) => updateKycStatus(event.target.value)}
                  className="w-full rounded-md border border-white/15 bg-[#0f2a4a] px-2.5 py-2 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-[#A8C5E8]"
                >
                  <option value="">All KYC statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by account status</span>
                <select
                  value={accountStatus}
                  onChange={(event) => updateAccountStatus(event.target.value)}
                  className="w-full rounded-md border border-white/15 bg-[#0f2a4a] px-2.5 py-2 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-[#A8C5E8]"
                >
                  <option value="">All account statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>
          </div>

          <div className="max-h-[650px] divide-y divide-[#E6EEF7] overflow-y-auto">
            {loading ? (
              <div role="status" className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-[#3E7DBB]">
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading renters…
              </div>
            ) : error ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                Renter records could not be loaded.
              </div>
            ) : renters.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No renters match your search and filters.
              </div>
            ) : renters.map((renter) => {
              const active = renter.user_id === selectedRenter?.user_id;
              return (
                <button
                  key={renter.user_id}
                  type="button"
                  onClick={() => setSelectedRenterId(renter.user_id)}
                  aria-pressed={active}
                  className={`w-full px-4 py-4 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3E7DBB] ${
                    active ? "bg-[#EAF2FB]" : "bg-white hover:bg-[#F7FAFE]"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#102A4A]">{renterName(renter)}</span>
                      <span className="mt-1 block truncate text-xs text-slate-500">{renter.email || "Email unavailable"}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-base font-semibold tabular-nums text-[#102A4A]">{renter.booking_count}</span>
                      <span className="block text-[10px] text-slate-500">{renter.booking_count === 1 ? "booking" : "bookings"}</span>
                    </span>
                  </span>
                  <span className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">KYC</span>
                      <StatusBadge status={renter.latest_kyc_status} />
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Account</span>
                      <StatusBadge status={renter.status} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <nav aria-label="Renter list pagination" className="flex flex-col gap-3 border-t border-[#DCE8F5] bg-[#F7FAFE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500" aria-live="polite">
              {total === 0 ? "Showing 0 renters" : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString()}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={loading || page <= 1}
                aria-label="Previous page"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#3E7DBB]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </button>
              <span className="min-w-16 text-center text-xs text-slate-600" aria-live="polite">
                {totalPages === 0 ? 0 : page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={loading || totalPages === 0 || page >= totalPages}
                aria-label="Next page"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#3E7DBB]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </section>

        <section
          aria-label="Selected renter details"
          aria-busy={detailLoading}
          className="min-w-0 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:self-start xl:overflow-y-auto xl:overscroll-contain"
        >
          {!selectedRenter ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#A8C5E8] bg-white px-6 text-center">
              <p className="text-base font-semibold text-[#102A4A]">{loading ? "Loading renters…" : "Select a renter"}</p>
              {!loading && <p className="mt-1 text-sm text-slate-500">Renter details will appear here.</p>}
            </div>
          ) : detailLoading || detailRenterId !== selectedRenter.user_id ? (
            <div role="status" className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-[#A8C5E8]/70 bg-white px-6 text-center">
              <RefreshCw className="h-5 w-5 animate-spin text-[#3E7DBB]" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-[#36516F]">Loading renter details…</p>
            </div>
          ) : detailError ? (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
              <p>{detailError}</p>
              <button
                type="button"
                onClick={() => setDetailRetryKey((key) => key + 1)}
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-rose-300 bg-white px-3 font-semibold transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : selectedRenterDetail ? (
            <article className="overflow-hidden rounded-2xl border border-[#A8C5E8]/70 bg-white shadow-sm">
              <header className="border-b border-[#DCE8F5] bg-[#F4F8FC] px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3E7DBB]">Renter Details</p>
                <h2 className="mt-1 break-words text-xl font-semibold tracking-tight text-[#102A4A]">
                  {[selectedRenterDetail.renter.first_name, selectedRenterDetail.renter.last_name].filter(Boolean).join(" ").trim() || "Name unavailable"}
                </h2>
              </header>

              <PreviewSection title="Profile Information">
                <dl className="grid gap-x-5 sm:grid-cols-2">
                  <DetailField label="Email">
                    <span className="inline-flex items-start gap-2">
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3E7DBB]" aria-hidden="true" />
                      {selectedRenterDetail.renter.email || "Not available"}
                    </span>
                  </DetailField>
                  <DetailField label="Mobile Number">
                    <span className="inline-flex items-start gap-2">
                      <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3E7DBB]" aria-hidden="true" />
                      {selectedRenterDetail.renter.phone_number || "Not available"}
                    </span>
                  </DetailField>
                  <DetailField label="Date Registered">
                    <span className="inline-flex items-start gap-2">
                      <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3E7DBB]" aria-hidden="true" />
                      {formatDate(selectedRenterDetail.renter.created_at)}
                    </span>
                  </DetailField>
                  <DetailField label="Last Sign In">
                    <span className="inline-flex items-start gap-2">
                      <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3E7DBB]" aria-hidden="true" />
                      {formatDate(selectedRenterDetail.renter.last_sign_in_at, true)}
                    </span>
                  </DetailField>
                  <DetailField label="Account Status">
                    <StatusBadge status={selectedRenterDetail.renter.status} />
                  </DetailField>
                  <DetailField label="Total Bookings">
                    <span className="tabular-nums">{selectedRenterDetail.bookings.length}</span>
                  </DetailField>
                </dl>
              </PreviewSection>

              <div className="border-t border-[#DCE8F5]">
                <PreviewSection title="Latest Verification">
                  {selectedRenterDetail.latest_kyc ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#EAF2FB] px-3 py-2.5">
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-[#36516F]">
                          <ShieldCheck className="h-4 w-4 text-[#1F5C94]" aria-hidden="true" />
                          Verification Status
                        </span>
                        <StatusBadge status={selectedRenterDetail.latest_kyc.admin_status ?? selectedRenterDetail.latest_kyc.status} />
                      </div>
                      <dl className="grid gap-x-5 sm:grid-cols-2">
                        <DetailField label="Verification Type">{formatVerificationType(selectedRenterDetail.latest_kyc.document_type)}</DetailField>
                        <DetailField label="Identity Check Result">
                          <StatusBadge status={selectedRenterDetail.latest_kyc.didit_status} />
                        </DetailField>
                        <DetailField label="Reviewed By">
                          {selectedRenterDetail.latest_kyc.reviewed_by
                            ? `Staff ID: ${selectedRenterDetail.latest_kyc.reviewed_by}`
                            : "Not available"}
                        </DetailField>
                        <DetailField label="Date Reviewed">{formatDate(selectedRenterDetail.latest_kyc.reviewed_at, true)}</DetailField>
                        {selectedRenterDetail.latest_kyc.rejection_reason && (
                          <DetailField label="Rejection Reason">{selectedRenterDetail.latest_kyc.rejection_reason}</DetailField>
                        )}
                      </dl>
                    </div>
                  ) : (
                    <p className="rounded-lg bg-[#F7FAFE] px-3 py-3 text-sm text-slate-500">No verification records found.</p>
                  )}
                </PreviewSection>
              </div>

              <div className="border-t border-[#DCE8F5]">
                <PreviewSection title="Booking History">
                  {selectedRenterDetail.bookings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[510px] text-left text-xs">
                        <thead className="bg-[#EAF2FB] text-[10px] font-semibold uppercase tracking-wide text-[#36516F]">
                          <tr>
                            <th scope="col" className="px-3 py-2.5">Unit Name</th>
                            <th scope="col" className="px-3 py-2.5">Booking Period</th>
                            <th scope="col" className="px-3 py-2.5">Total Amount</th>
                            <th scope="col" className="px-3 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6EEF7]">
                          {selectedRenterDetail.bookings.map((booking) => (
                            <tr key={booking.booking_id} className="align-middle hover:bg-[#F7FAFE]">
                              <td className="max-w-32 px-3 py-3 font-medium text-[#102A4A]">{booking.unit_name || "Unit unavailable"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                                {formatRentalDate(booking.start_date)} - {formatRentalDate(booking.end_date)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 font-medium tabular-nums text-slate-700">{formatAmount(booking.total_amount)}</td>
                              <td className="px-3 py-3"><StatusBadge status={booking.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="rounded-lg bg-[#F7FAFE] px-3 py-3 text-sm text-slate-500">No bookings found.</p>
                  )}
                </PreviewSection>
              </div>

              <div className="border-t border-[#DCE8F5]">
                <PreviewSection title="Account Status History">
                  {selectedRenterDetail.account_status_history.length > 0 ? (
                    <ol className="relative ml-1 border-l-2 border-[#C7D9EC] pl-5">
                      {selectedRenterDetail.account_status_history.map((change, index) => (
                        <li key={`${change.created_at ?? "status"}-${index}`} className="relative grid gap-1 pb-4 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#3E7DBB] ring-1 ring-[#A8C5E8]" aria-hidden="true" />
                          <div>
                            <p className="text-sm font-semibold text-[#102A4A]">
                              {displayStatus(change.from_status)} <span className="px-1 text-[#3E7DBB]">-&gt;</span> {displayStatus(change.to_status)}
                            </p>
                            {change.actor_id && <p className="mt-1 text-xs text-slate-500">Staff ID: {change.actor_id}</p>}
                            {change.reason && <p className="mt-1 text-sm text-slate-600">{change.reason}</p>}
                          </div>
                          <time className="text-xs text-slate-500">{formatDate(change.created_at, true)}</time>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="rounded-lg bg-[#F7FAFE] px-3 py-3 text-sm text-slate-500">No account status changes recorded.</p>
                  )}
                </PreviewSection>
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
