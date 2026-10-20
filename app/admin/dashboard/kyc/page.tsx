"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
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

function getRenterName(renter: KycRenter | null) {
  if (!renter) return "Unknown renter";

  const name = [renter.first_name, renter.last_name].filter(Boolean).join(" ").trim();

  return name || renter.email || "Unknown renter";
}

// Stamp and left-rail colours for the Didit result.
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

/* ---------- small themed pieces ---------- */

// Submission reference styled like a licence plate.
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

// The Didit result as a rubber stamp. Only the colour changes.
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
}: {
  label: string;
  value: string | null | undefined;
  breakAll?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(90px,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-[#3E7DBB]">{label}</dt>
      <dd
        className={`min-w-0 text-right text-sm font-medium text-[#173B66] ${
          breakAll ? "break-all" : "break-words"
        }`}
      >
        {value || "Not available"}
      </dd>
    </div>
  );
}

/* ---------- page ---------- */

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
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/admin/kyc", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as KycApiResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load KYC submissions.");
      }

      const rows = Array.isArray(payload.submissions) ? payload.submissions : [];

      setSubmissions(rows);

      setSelectedId((currentId) => {
        if (currentId && rows.some((row) => row.id === currentId)) {
          return currentId;
        }

        return rows[0]?.id ?? null;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading KYC submissions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    setRejectionReason("");
    setDecisionError("");
  }, [selectedId]);

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return submissions;

    return submissions.filter((submission) => {
      const renter = submission.renter;

      const searchableValues = [
        getRenterName(renter),
        renter?.email ?? "",
        renter?.phone_number ?? "",
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

      if (decision === "rejected" && reason.length > 1000) {
        setDecisionError("The rejection reason must be 1,000 characters or fewer.");
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

        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to save the administrative decision.");
        }

        setDecisionSuccess(
          decision === "approved"
            ? "Verification approved successfully."
            : "Verification rejected and the reason recorded."
        );
        setRejectionReason("");
        await loadSubmissions(true);
      } catch (err) {
        setDecisionError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while saving the decision."
        );
      } finally {
        setDecisionBusy(false);
      }
    },
    [loadSubmissions, rejectionReason, selectedSubmission]
  );

  const approvedCount = submissions.filter(
    (item) => item.didit_status?.toLowerCase() === "approved"
  ).length;

  const declinedCount = submissions.filter(
    (item) => item.didit_status?.toLowerCase() === "declined"
  ).length;

  return (
    <div className="text-[#102A4A]">
      {/* ink texture used by the status stamps */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="stamp-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
        </filter>
      </svg>

      {/* HEADER */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <SectionBar />
          <span className="inline-flex items-center gap-2 rounded-full bg-[#102A4A] px-3 py-1 text-xs font-medium text-[#A8C5E8]">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin workspace
          </span>
          <h1 className="mt-4 text-[38px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[48px]">
            KYC management
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void loadSubmissions(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[#1F5C94] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(16,42,74,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#173B66] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh queue
        </button>
      </header>

      {/* READINGS */}
      <div className="mt-10 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
        <PinStat
          label="Awaiting review"
          value={loading ? "—" : submissions.length}
          hint="Submissions in the queue"
          color="#f59e0b"
          attention={!loading && submissions.length > 0}
        />
        <PinStat
          label="Didit approved"
          value={loading ? "—" : approvedCount}
          hint="Passed identity checks"
          color="#059669"
        />
        <PinStat
          label="Didit declined"
          value={loading ? "—" : declinedCount}
          hint="Declined, awaiting admin review"
          color="#e11d48"
        />
      </div>

      {/* NOTICES */}
      <div className="mt-6 space-y-3 empty:hidden">
        {decisionSuccess && (
          <div role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {decisionSuccess}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Unable to load KYC queue</p>
              <p className="mt-1 break-words">{error}</p>
              <button
                type="button"
                onClick={() => void loadSubmissions()}
                className="mt-2 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">
        {/* QUEUE */}
        <section className="overflow-hidden rounded-[26px] bg-white ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-18px_rgba(16,42,74,0.35)]">
          <div className="bg-[#0b1f38] p-5">
            <span className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-white/10" aria-hidden />
            <label className="flex items-center rounded-full bg-[#0f2a4a] ring-1 ring-cyan-300/50 shadow-[0_0_12px_rgba(34,211,238,0.25)] transition focus-within:ring-cyan-300 focus-within:shadow-[0_0_22px_rgba(34,211,238,0.55)]">
              <Search className="ml-4 h-4 w-4 shrink-0 text-cyan-300" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search renter, email, or ID"
                aria-label="Search KYC submissions"
                className="min-w-0 flex-1 bg-transparent py-3 pl-3 pr-4 text-sm text-white outline-none placeholder:text-[#A8C5E8]/60"
              />
            </label>
          </div>

          <div className="max-h-[720px] space-y-3 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#3E7DBB]">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading verification requests…
              </div>
            ) : error && submissions.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#3E7DBB]">The queue could not be loaded.</div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[#6E9BD3] bg-white/60 px-5 py-12 text-center">
                <FileCheck2 className="mx-auto h-8 w-8 text-[#6E9BD3]" />
                <p className="mt-3 font-semibold text-[#102A4A]">
                  {search.trim() ? "No matching submissions" : "No submissions awaiting review"}
                </p>
                <p className="mt-1 text-sm leading-5 text-[#3E7DBB]">
                  {search.trim()
                    ? "Try another name, email address, or submission ID."
                    : "Completed Didit submissions will appear here when they meet the review queue criteria."}
                </p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => {
                const selected = selectedId === submission.id;
                const meta = diditMeta(submission.didit_status);

                return (
                  <button
                    key={submission.id}
                    type="button"
                    onClick={() => setSelectedId(submission.id)}
                    aria-pressed={selected}
                    className={`relative block w-full overflow-hidden rounded-2xl py-4 pl-6 pr-4 text-left transition ${
                      selected
                        ? "bg-[#A8C5E8]/20 ring-2 ring-[#1F5C94]"
                        : "bg-white ring-1 ring-slate-200 hover:ring-[#6E9BD3]"
                    }`}
                  >
                    <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.rail}`} aria-hidden />
                    <div className="flex items-center justify-between gap-2">
                      <Plate id={submission.id} />
                      <DiditStamp status={submission.didit_status} />
                    </div>
                    <p className="mt-3 truncate text-base font-semibold tracking-[-0.02em]">
                      {getRenterName(submission.renter)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {submission.renter?.email || "No email available"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-200 pt-3 text-xs">
                      <span className="text-slate-500">Submitted {formatDate(submission.created_at)}</span>
                      <span className="font-semibold text-amber-700">Pending admin decision</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            {loading
              ? "Retrieving submissions..."
              : `${filteredSubmissions.length} of ${submissions.length} submission(s) shown`}
          </p>
        </section>

        {/* CASE FILE */}
        <section className="min-w-0 xl:sticky xl:top-6">
          {!selectedSubmission ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-[#6E9BD3] bg-white/60 text-center">
              <FileCheck2 className="h-9 w-9 text-[#6E9BD3]" />
              <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">No submission selected</p>
              <p className="mt-1 text-sm text-[#3E7DBB]">Select a request from the queue to view its details.</p>
            </div>
          ) : (
            <article className="overflow-hidden rounded-[26px] bg-white ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-12px_rgba(16,42,74,0.4),0_4px_10px_-2px_rgba(16,42,74,0.18)]">
              {/* header band */}
              <div className="flex items-start justify-between gap-3 bg-[linear-gradient(90deg,#102A4A,#173B66,#1F5C94)] px-6 py-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#A8C5E8]">Submission details</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Plate id={selectedSubmission.id} large />
                    <span className="text-xs text-[#A8C5E8]">
                      Submitted {formatDate(selectedSubmission.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <DiditStamp status={selectedSubmission.didit_status} large />
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    aria-label="Clear selected submission"
                    className="rounded-full p-2 text-[#A8C5E8] transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6 p-6 sm:p-7">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#A8C5E8]/40 text-2xl font-semibold text-[#1F5C94]">
                    {getRenterName(selectedSubmission.renter).charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h2 className="break-words text-2xl font-semibold leading-tight tracking-[-0.04em]">
                      {getRenterName(selectedSubmission.renter)}
                    </h2>
                    <p className="mt-0.5 break-all text-sm text-slate-500">
                      {selectedSubmission.renter?.email || "No email available"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-x-10 gap-y-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
                  <DetailSection title="Renter information">
                    <DetailRow label="First name" value={selectedSubmission.renter?.first_name} />
                    <DetailRow label="Last name" value={selectedSubmission.renter?.last_name} />
                    <DetailRow label="Email" value={selectedSubmission.renter?.email} />
                    <DetailRow label="Mobile number" value={selectedSubmission.renter?.phone_number} />
                  </DetailSection>

                  <DetailSection title="Verification information">
                    <DetailRow label="Document type" value={selectedSubmission.document_type} />
                    <DetailRow label="Didit result" value={selectedSubmission.didit_status} />
                    <DetailRow label="Admin review" value={selectedSubmission.admin_status} />
                    <DetailRow label="Submission date" value={formatDate(selectedSubmission.created_at)} />
                    <DetailRow label="Last updated" value={formatDate(selectedSubmission.updated_at)} />
                    <DetailRow label="Submission ID" value={selectedSubmission.id} breakAll />
                  </DetailSection>
                </div>

                {selectedSubmission.rejection_reason && (
                  <div className="border-l-2 border-rose-400 pl-4">
                    <p className="text-sm font-semibold text-rose-800">Recorded rejection reason</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-rose-700">
                      {selectedSubmission.rejection_reason}
                    </p>
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

                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Your decision is required</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      The Didit result is supporting information only. It does not approve the renter in
                      RentSpotPH. The final decision is yours.
                    </p>
                  </div>
                </div>

                {decisionError && (
                  <div role="alert" className="mt-4 border-l-2 border-rose-400 pl-4 text-sm text-rose-800">
                    <p className="font-semibold">Decision not saved</p>
                    <p className="mt-0.5 break-words">{decisionError}</p>
                  </div>
                )}

                <div className="mt-4">
                  <label htmlFor="kyc-rejection-reason" className="block text-sm font-semibold text-[#173B66]">
                    Rejection reason <span className="font-normal text-slate-500">(required only when rejecting)</span>
                  </label>
                  <textarea
                    id="kyc-rejection-reason"
                    value={rejectionReason}
                    onChange={(event) => {
                      setRejectionReason(event.target.value);
                      if (decisionError) setDecisionError("");
                    }}
                    maxLength={1000}
                    rows={3}
                    placeholder="Explain why this verification request is being rejected..."
                    disabled={decisionBusy}
                    className="mt-2 w-full resize-y rounded-xl border border-[#A8C5E8] bg-white px-3 py-2.5 text-sm leading-6 text-[#102A4A] outline-none transition placeholder:text-slate-400 focus:border-[#3E7DBB] focus:ring-4 focus:ring-[#A8C5E8]/40 disabled:bg-slate-100"
                  />
                  <p className="mt-1 text-right text-xs tabular-nums text-slate-500">{rejectionReason.length}/1000</p>
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void submitDecision("approved")}
                    disabled={decisionBusy || loading || refreshing}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(5,150,105,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {decisionBusy ? "Saving decision..." : "Approve verification"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitDecision("rejected")}
                    disabled={decisionBusy || loading || refreshing || !rejectionReason.trim()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-300 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    {decisionBusy ? "Saving decision..." : "Reject verification"}
                  </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Decisions are saved through the protected admin KYC API. Only authorized staff with a completed
                  MFA check can make one.
                </p>
              </div>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}