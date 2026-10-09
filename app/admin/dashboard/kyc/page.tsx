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
UserRound,
X,
} from "lucide-react";

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

const name = [renter.first_name, renter.last_name]
.filter(Boolean)
.join(" ")
.trim();

return name || renter.email || "Unknown renter";
}

function getDiditBadge(status: string | null) {
switch (status?.toLowerCase()) {
case "approved":
return "border-green-200 bg-green-50 text-green-700";


case "declined":
  return "border-red-200 bg-red-50 text-red-700";

default:
  return "border-neutral-200 bg-neutral-100 text-neutral-600";


}
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
    throw new Error(
      payload.error || "Unable to load KYC submissions."
    );
  }

  const rows = Array.isArray(payload.submissions)
    ? payload.submissions
    : [];

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

  return searchableValues.some((value) =>
    value.toLowerCase().includes(query)
  );
});

}, [submissions, search]);

const selectedSubmission =
filteredSubmissions.find((item) => item.id === selectedId) ?? null;

const submitDecision = useCallback(async (decision: "approved" | "rejected") => {
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

    const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

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
}, [loadSubmissions, rejectionReason, selectedSubmission]);

const approvedCount = submissions.filter(
(item) => item.didit_status?.toLowerCase() === "approved"
).length;

const declinedCount = submissions.filter(
(item) => item.didit_status?.toLowerCase() === "declined"
).length;

return ( <div className="space-y-6"> <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"> <div> <div className="flex items-center gap-2"> <ShieldCheck className="h-6 w-6 text-[#247A48]" />


        <h2 className="text-2xl font-semibold text-[#2C3E50]">
          KYC Management
        </h2>
      </div>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
        Review renter identity-verification submissions and inspect
        their verification details before making an administrative decision.
      </p>
    </div>

    <button
      type="button"
      onClick={() => void loadSubmissions(true)}
      disabled={loading || refreshing}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw
        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
      />
      Refresh queue
    </button>
  </section>

  <section className="grid gap-4 sm:grid-cols-3">
    <SummaryCard
      title="Awaiting Review"
      value={loading ? "—" : submissions.length}
      description="Submissions returned by the review API"
      icon={<Clock3 className="h-5 w-5" />}
    />

    <SummaryCard
      title="Didit Approved"
      value={loading ? "—" : approvedCount}
      description="Passed Didit identity checks"
      icon={<CheckCircle2 className="h-5 w-5" />}
    />

    <SummaryCard
      title="Didit Declined"
      value={loading ? "—" : declinedCount}
      description="Declined by Didit, awaiting admin review"
      icon={<AlertCircle className="h-5 w-5" />}
    />
  </section>

  {decisionSuccess && (
    <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
      {decisionSuccess}
    </div>
  )}

  {error && (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="font-semibold">Unable to load KYC queue</p>
        <p className="mt-1 break-words">{error}</p>

        <button
          type="button"
          onClick={() => void loadSubmissions()}
          className="mt-3 font-semibold underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  )}

  <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 p-5">
        <h3 className="font-semibold text-[#2C3E50]">
          Verification Requests
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Select a request to inspect its details.
        </p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search renter, email, or submission ID"
            aria-label="Search KYC submissions"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-[#247A48] focus:ring-2 focus:ring-[#247A48]/10"
          />
        </div>
      </div>

      <div className="divide-y divide-neutral-100">
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            Loading verification requests...
          </div>
        ) : error && submissions.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            The queue could not be loaded.
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <FileCheck2 className="mx-auto h-8 w-8 text-neutral-300" />

            <p className="mt-3 font-medium text-neutral-700">
              {search.trim()
                ? "No matching submissions"
                : "No submissions awaiting review"}
            </p>

            <p className="mt-1 text-sm leading-5 text-neutral-500">
              {search.trim()
                ? "Try another name, email address, or submission ID."
                : "Completed Didit submissions will appear here when they meet the review queue criteria."}
            </p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => {
            const selected = selectedId === submission.id;

            return (
              <button
                key={submission.id}
                type="button"
                onClick={() => setSelectedId(submission.id)}
                aria-pressed={selected}
                className={`block w-full p-4 text-left transition hover:bg-neutral-50 ${
                  selected
                    ? "bg-green-50/70 ring-1 ring-inset ring-[#247A48]/20"
                    : "bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-[#2C3E50]">
                        {getRenterName(submission.renter)}
                      </p>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getDiditBadge(
                          submission.didit_status
                        )}`}
                      >
                        {submission.didit_status || "Unknown"}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm text-neutral-500">
                      {submission.renter?.email || "No email available"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                      <span>
                        Submitted {formatDate(submission.created_at)}
                      </span>

                      <span className="font-medium text-amber-700">
                        Pending admin decision
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-3 text-xs text-neutral-500">
        {loading
          ? "Retrieving submissions..."
          : `${filteredSubmissions.length} of ${submissions.length} submission(s) shown`}
      </div>
    </div>

    <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 p-5">
        <div>
          <h3 className="font-semibold text-[#2C3E50]">
            Submission Details
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Review the selected renter's information.
          </p>
        </div>

        {selectedSubmission && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            aria-label="Clear selected submission"
            className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!selectedSubmission ? (
        <div className="p-8 text-center">
          <FileCheck2 className="mx-auto h-8 w-8 text-neutral-300" />

          <p className="mt-3 font-medium text-neutral-700">
            No submission selected
          </p>

          <p className="mt-1 text-sm text-neutral-500">
            Select a request from the queue to view its details.
          </p>
        </div>
      ) : (
        <div className="space-y-6 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#247A48]">
              <UserRound className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <h4 className="break-words text-lg font-semibold text-[#2C3E50]">
                {getRenterName(selectedSubmission.renter)}
              </h4>

              <p className="break-all text-sm text-neutral-500">
                {selectedSubmission.renter?.email || "No email available"}
              </p>
            </div>
          </div>

          <DetailSection title="Renter Information">
            <DetailRow
              label="First name"
              value={selectedSubmission.renter?.first_name}
            />

            <DetailRow
              label="Last name"
              value={selectedSubmission.renter?.last_name}
            />

            <DetailRow
              label="Email"
              value={selectedSubmission.renter?.email}
            />

            <DetailRow
              label="Mobile number"
              value={selectedSubmission.renter?.phone_number}
            />
          </DetailSection>

          <DetailSection title="Verification Information">
            <DetailRow
              label="Document type"
              value={selectedSubmission.document_type}
            />

            <DetailRow
              label="Didit result"
              value={selectedSubmission.didit_status}
            />

            <DetailRow
              label="Admin review"
              value={selectedSubmission.admin_status}
            />

            <DetailRow
              label="Submission date"
              value={formatDate(selectedSubmission.created_at)}
            />

            <DetailRow
              label="Last updated"
              value={formatDate(selectedSubmission.updated_at)}
            />

            <DetailRow
              label="Submission ID"
              value={selectedSubmission.id}
              breakAll
            />
          </DetailSection>

          {selectedSubmission.rejection_reason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                Recorded rejection reason
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-red-700">
                {selectedSubmission.rejection_reason}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Administrative decision required
                </p>

                <p className="mt-1 text-sm leading-5 text-amber-800">
                  The Didit result is supporting verification information.
                  It does not itself approve the renter in RentSpotPH.
                  The authorized admin must make the final decision.
                </p>
              </div>
            </div>
          </div>

          {decisionError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">Decision not saved</p>
              <p className="mt-1 break-words">{decisionError}</p>
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div>
              <h5 className="text-sm font-semibold text-[#2C3E50]">Administrative decision</h5>
              <p className="mt-1 text-sm leading-5 text-neutral-600">
                Confirm the review outcome. Rejecting a request requires a reason that will be recorded.
              </p>
            </div>

            <div>
              <label htmlFor="kyc-rejection-reason" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Rejection reason <span className="text-red-600">*</span>
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
                className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[#247A48] focus:ring-2 focus:ring-[#247A48]/10 disabled:bg-neutral-100"
              />
              <p className="mt-1 text-right text-xs text-neutral-500">{rejectionReason.length}/1000</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void submitDecision("approved")}
                disabled={decisionBusy || loading || refreshing}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#247A48] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d633a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {decisionBusy ? "Saving decision..." : "Approve verification"}
              </button>
              <button
                type="button"
                onClick={() => void submitDecision("rejected")}
                disabled={decisionBusy || loading || refreshing || !rejectionReason.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                {decisionBusy ? "Saving decision..." : "Reject verification"}
              </button>
            </div>
            <p className="text-xs leading-5 text-neutral-500">
              This action is saved through the existing protected admin KYC API. Only authorized staff who satisfy the server-side MFA requirement can make a decision.
            </p>
          </div>
        </div>
      )}
    </div>
  </section>
</div>


);
}

function SummaryCard({
title,
value,
description,
icon,
}: {
title: string;
value: string | number;
description: string;
icon: React.ReactNode;
}) {
return ( <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"> <div className="flex items-center justify-between gap-3"> <p className="text-sm font-medium text-neutral-600">{title}</p>

    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-[#247A48]">
      {icon}
    </div>
  </div>

  <p className="mt-4 text-3xl font-semibold text-[#2C3E50]">{value}</p>

  <p className="mt-2 text-xs leading-5 text-neutral-500">
    {description}
  </p>
</article>


);
}

function DetailSection({
title,
children,
}: {
title: string;
children: React.ReactNode;
}) {
return ( <section> <h5 className="mb-3 text-sm font-semibold text-[#2C3E50]">{title}</h5>

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
return ( <div className="grid grid-cols-[minmax(100px,0.8fr)_minmax(0,1.2fr)] gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"> <dt className="text-sm text-neutral-500">{label}</dt>

  <dd
    className={`min-w-0 text-right text-sm font-medium text-neutral-800 ${
      breakAll ? "break-all" : "break-words"
    }`}
  >
    {value || "Not available"}
  </dd>
</div>

);
}
