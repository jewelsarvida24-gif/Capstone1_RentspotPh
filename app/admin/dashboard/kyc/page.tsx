"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  RefreshCw,
  Search,
  X,
  CreditCard,
} from "lucide-react";

const PAGE_BG = "#fbfdff";

type KycRenter = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
};

type KycSubmission = {
  id: string;
  user_id: string;
  document_type: string | null;
  id_document_type?: string | null;
  id_expiry_date?: string | null;
  driver_license_number: string | null;
  driver_license_expiration: string | null;
  status: string | null;
  didit_status: string | null;
  admin_status: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string | null;
  renter: KycRenter | null;
};

type KycApiResponse = {
  submissions?: KycSubmission[];
  error?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// Petsa lang (walang oras), para sa expiry ng ID
function formatDateOnly(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(date);
}

function isPastDate(value: string | null | undefined) {
  if (!value) return false;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return value.slice(0, 10) < today;
}

const isDriversLicense = (type?: string | null) => /driver/i.test(type || "");
const isIdentityRow = (s: KycSubmission) => s.document_type === "identity_verification";

// Ang tunay na uri ng ID (galing kay Didit), hindi ang internal na label ng row
function idTypeLabel(s: KycSubmission) {
  if (s.id_document_type) return s.id_document_type;
  if (isIdentityRow(s)) return "Not recorded yet";
  return s.document_type || "Driver's License";
}

function getRenterName(renter: KycRenter | null) {
  if (!renter) return "Unknown renter";
  const name = [renter.first_name, renter.last_name].filter(Boolean).join(" ").trim();
  return name || renter.email || "Unknown renter";
}

function diditMeta(status: string | null) {
  switch (status?.toLowerCase()) {
    case "approved":
      return { stamp: "border-emerald-600 text-emerald-600", rail: "bg-emerald-400" };
    case "declined":
      return { stamp: "border-red-600 text-red-600", rail: "bg-rose-400" };
    default:
      return { stamp: "border-slate-500 text-slate-500", rail: "bg-slate-300" };
  }
}

function Plate({ id, large }: { id: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border-2 border-[#102A4A] bg-white font-bold text-[#102A4A] ${
        large ? "gap-2 px-3 py-1 text-sm tracking-[0.2em]" : "gap-1.5 px-2 py-0.5 text-[11px] tracking-[0.12em]"
      }`}
    >
      <span className="h-3 w-1 rounded-full bg-[#3E7DBB]" />
      KYC {id.slice(0, 6).toUpperCase()}
    </span>
  );
}

function DiditStamp({ status, large }: { status: string | null; large?: boolean }) {
  const meta = diditMeta(status);
  return (
    <span
      className={`inline-flex shrink-0 -rotate-6 items-center rounded border-2 bg-white/90 font-extrabold uppercase leading-none ${
        large ? "px-3 py-1.5 text-sm tracking-[0.16em]" : "px-2 py-1 text-[10px] tracking-[0.14em]"
      } ${meta.stamp}`}
      style={{ filter: "url(#stamp-rough)" }}
    >
      {status || "Unknown"}
    </span>
  );
}

function PinStat({
  label,
  value,
  hint,
  color,
  attention,
}: {
  label: string;
  value: string | number;
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
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#102A4A]">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-3 text-sm font-semibold text-[#1F5C94]">{title}</h3>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}

function DetailRow({
  label,
  value,
  breakAll = false,
  highlight = false,
}: {
  label: string;
  value: string | null | undefined;
  breakAll?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(90px,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-[#3E7DBB]">{label}</dt>
      <dd
        className={`min-w-0 text-right text-sm font-medium text-[#173B66] ${
          breakAll ? "break-all" : "break-words"
        }`}
      >
        {highlight ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {value}
          </span>
        ) : (
          value || "Not available"
        )}
      </dd>
    </div>
  );
}

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [decisionSuccess, setDecisionSuccess] = useState("");
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadSubmissions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/kyc", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as KycApiResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to load KYC submissions.");
      const rows = Array.isArray(payload.submissions) ? payload.submissions : [];
      setSubmissions(rows);
      setSelectedId((currentId) => (currentId && rows.some((row) => row.id === currentId) ? currentId : rows[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadSubmissions(); }, [loadSubmissions]);
  useEffect(() => { setRejectionReason(""); setDecisionError(""); }, [selectedId]);

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return submissions;
    return submissions.filter((submission) => {
      const renter = submission.renter;
      const searchableValues = [
        getRenterName(renter),
        renter?.email ?? "",
        submission.driver_license_number ?? "",
        submission.id_document_type ?? "",
        submission.id,
        submission.didit_status ?? "",
      ];
      return searchableValues.some((value) => value.toLowerCase().includes(query));
    });
  }, [submissions, search]);

  const selectedSubmission = filteredSubmissions.find((item) => item.id === selectedId) ?? null;

  const submitDecision = useCallback(
    async (decision: "approved" | "rejected") => {
      if (!selectedSubmission) return;
      const reason = rejectionReason.trim();
      if (decision === "rejected" && !reason) {
        setDecisionError("Please provide a reason before rejecting this verification request.");
        return;
      }

      setDecisionBusy(true);
      setDecisionError("");
      setDecisionSuccess("");

      try {
        const response = await fetch("/api/admin/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kycId: selectedSubmission.id,
            decision,
            reason: decision === "rejected" ? reason : null,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to save administrative decision.");

        setDecisionSuccess(decision === "approved" ? "Verification approved successfully." : "Verification rejected.");
        setRejectionReason("");
        await loadSubmissions(true);
      } catch (err) {
        setDecisionError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setDecisionBusy(false);
      }
    },
    [loadSubmissions, rejectionReason, selectedSubmission]
  );

  const approvedCount = submissions.filter((i) => i.didit_status?.toLowerCase() === "approved").length;
  const declinedCount = submissions.filter((i) => i.didit_status?.toLowerCase() === "declined").length;

  return (
    <div className="text-[#102A4A]">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="stamp-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
        </filter>
      </svg>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-[38px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[48px]">
            KYC & License Management
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void loadSubmissions(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1F5C94] px-6 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-[#173B66]"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh queue
        </button>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
        <PinStat label="Awaiting review" value={loading ? "—" : submissions.length} hint="Submissions in queue" color="#f59e0b" attention={!loading && submissions.length > 0} />
        <PinStat label="Didit approved" value={loading ? "—" : approvedCount} hint="Passed checks" color="#059669" />
        <PinStat label="Didit declined" value={loading ? "—" : declinedCount} hint="Declined, needs review" color="#e11d48" />
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[26px] bg-white ring-1 ring-[#A8C5E8]/70 shadow">
          <div className="bg-[#0b1f38] p-5">
            <label className="flex items-center rounded-full bg-[#0f2a4a] ring-1 ring-cyan-300/50">
              <Search className="ml-4 h-4 w-4 shrink-0 text-cyan-300" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search renter, email, or ID type"
                className="min-w-0 flex-1 bg-transparent py-3 pl-3 pr-4 text-sm text-white outline-none placeholder:text-[#A8C5E8]/60"
              />
            </label>
          </div>

          <div className="max-h-[720px] space-y-3 overflow-y-auto p-4">
            {filteredSubmissions.map((submission) => {
              const selected = selectedId === submission.id;
              const meta = diditMeta(submission.didit_status);
              return (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setSelectedId(submission.id)}
                  className={`relative block w-full overflow-hidden rounded-2xl py-4 pl-6 pr-4 text-left transition ${
                    selected ? "bg-[#A8C5E8]/20 ring-2 ring-[#1F5C94]" : "bg-white ring-1 ring-slate-200"
                  }`}
                >
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.rail}`} aria-hidden />
                  <div className="flex items-center justify-between gap-2">
                    <Plate id={submission.id} />
                    <DiditStamp status={submission.didit_status} />
                  </div>
                  <p className="mt-3 truncate text-base font-semibold">{getRenterName(submission.renter)}</p>
                  {isIdentityRow(submission) ? (
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                      ID: {idTypeLabel(submission)}
                      {isDriversLicense(submission.id_document_type) && (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-px text-[10px] font-bold text-emerald-700">
                          DL
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      License: {submission.driver_license_number || "Pending"}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="min-w-0 xl:sticky xl:top-6">
          {!selectedSubmission ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[26px] border-2 border-dashed border-[#6E9BD3] bg-white/60 text-center">
              <p className="text-sm text-[#3E7DBB]">Select a submission to review details.</p>
            </div>
          ) : (
            <article className="overflow-hidden rounded-[26px] bg-white ring-1 ring-[#A8C5E8]/70 shadow">
              <div className="flex items-start justify-between gap-3 bg-[linear-gradient(90deg,#102A4A,#173B66,#1F5C94)] px-6 py-5 text-white">
                <div>
                  <p className="text-sm font-medium text-[#A8C5E8]">
                    {isIdentityRow(selectedSubmission)
                      ? "Identity Verification Details"
                      : "Verification & Driver License Details"}
                  </p>
                  <Plate id={selectedSubmission.id} large />
                </div>
                <DiditStamp status={selectedSubmission.didit_status} large />
              </div>

              <div className="space-y-6 p-6 sm:p-7">
                <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                  <DetailSection title="Renter Information">
                    <DetailRow label="Full Name" value={getRenterName(selectedSubmission.renter)} />
                    <DetailRow label="Email" value={selectedSubmission.renter?.email} breakAll />
                    <DetailRow label="Mobile" value={selectedSubmission.renter?.phone_number} />
                  </DetailSection>

                  {isIdentityRow(selectedSubmission) ? (
                    <DetailSection title="ID Details">
                      <DetailRow
                        label="ID Type"
                        value={idTypeLabel(selectedSubmission)}
                        highlight={isDriversLicense(selectedSubmission.id_document_type)}
                      />
                      <DetailRow
                        label="Expiration"
                        value={
                          selectedSubmission.id_expiry_date
                            ? `${formatDateOnly(selectedSubmission.id_expiry_date)}${
                                isPastDate(selectedSubmission.id_expiry_date) ? " (expired)" : ""
                              }`
                            : "Not available"
                        }
                      />
                      <DetailRow label="Didit Status" value={selectedSubmission.didit_status} />
                    </DetailSection>
                  ) : (
                    <DetailSection title="Driver's License Details">
                      <DetailRow label="Document Type" value={selectedSubmission.document_type || "Driver's License"} />
                      <DetailRow label="License Number" value={selectedSubmission.driver_license_number} />
                      <DetailRow label="Expiration" value={formatDate(selectedSubmission.driver_license_expiration)} />
                      <DetailRow label="Didit Status" value={selectedSubmission.didit_status} />
                    </DetailSection>
                  )}
                </div>

                <div className="border-t pt-4">
                  <label htmlFor="rejection-reason" className="block text-sm font-semibold text-[#173B66]">
                    Rejection Reason (Required if rejecting)
                  </label>
                  <textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-[#A8C5E8] p-3 text-sm"
                    placeholder="Reason for rejection..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void submitDecision("approved")}
                    disabled={decisionBusy}
                    className="flex-1 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                  >
                    Approve Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitDecision("rejected")}
                    disabled={decisionBusy || !rejectionReason.trim()}
                    className="flex-1 rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-300 hover:bg-rose-50"
                  >
                    Reject Verification
                  </button>
                </div>

                {decisionError && <p className="text-sm text-rose-600">{decisionError}</p>}
                {decisionSuccess && <p className="text-sm text-emerald-600">{decisionSuccess}</p>}
                {error && <p className="text-sm text-rose-600">{error}</p>}

              </div>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}