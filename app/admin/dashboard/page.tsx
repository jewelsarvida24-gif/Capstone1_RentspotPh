"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Assumptions: adjust these to match your app                                 */
/* -------------------------------------------------------------------------- */

const ROUTES = {
  kyc: "/admin/kyc",
  bookings: "/admin/bookings",
} as const;

const PAGE_BG = "#fbfdff";

type ActivityType = "kyc" | "booking" | "renter";

type DashboardData = {
  admin: { name: string; role: string }; // from staff_roles via the API route
  pendingKyc: number;
  pendingBookings: number;
  totalUnits: number;
  availableUnits: number;
  activeRenters: number;
  verifiedRenters: number;
  recentActivity: {
    id: string;
    type: ActivityType;
    message: string; // e.g. "KYC approved for J. dela Cruz"
    at: string; // ISO timestamp
  }[];
};

// Expected: GET /api/admin/dashboard -> DashboardData
async function fetchDashboard(signal: AbortSignal): Promise<DashboardData> {
  const res = await fetch("/api/admin/dashboard", {
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Dashboard request failed (${res.status})`);
  return res.json();
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  sysadmin: "System admin",
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  kyc: "KYC",
  booking: "Booking",
  renter: "Renter",
};

const ACTIVITY_STYLES: Record<ActivityType, string> = {
  kyc: "border-sky-200 bg-sky-50 text-sky-800",
  booking: "border-amber-200 bg-amber-50 text-amber-900",
  renter: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C94] focus-visible:ring-offset-2";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function timeAgo(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return "Just now";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function AdminDashboardPage() {
  const [greeting, setGreeting] = useState("Welcome");
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const admin = data?.admin ?? null;
  const firstName = admin?.name.split(" ")[0];

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setRefreshing(true);
    try {
      const next = await fetchDashboard(controller.signal);
      if (controller.signal.aborted) return;
      setData(next);
      setStatus("ready");
      setUpdatedAt(new Date());
    } catch {
      if (controller.signal.aborted) return;
      setStatus("error");
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setGreeting(greetingForNow());
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const retry = () => {
    setStatus("loading");
    load();
  };

  const liveMessage = refreshing
    ? "Refreshing dashboard"
    : status === "error"
      ? "Could not load the dashboard"
      : updatedAt
        ? "Dashboard updated"
        : "";

  return (
    <div className="space-y-8 text-[#102A4A]" style={{ background: PAGE_BG }}>
      {/* Header: greeting + refresh */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <span className="mb-4 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#102A4A,#3E7DBB,#A8C5E8)]" aria-hidden />
          <span className="inline-flex items-center gap-2 rounded-full bg-[#102A4A] px-3 py-1 text-xs font-medium text-[#A8C5E8]">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin workspace
          </span>
          <h2 className="mt-4 text-[38px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[48px]">
            {firstName ? `${greeting}, ${firstName}` : greeting}
            {admin && (
              <span className="ml-2 inline-block rounded-full border border-[#A8C5E8] px-2.5 py-0.5 align-middle text-xs font-medium text-[#1F5C94]">
                {ROLE_LABELS[admin.role] ?? admin.role}
              </span>
            )}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#3E7DBB]">
            Manage rental operations, review renter verification, and monitor
            booking activity.
          </p>
        </div>

        <div className="flex items-center gap-3 sm:pb-1">
          {updatedAt && (
            <span className="text-xs text-[#3E7DBB]">
              Updated{" "}
              {updatedAt.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1F5C94] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(16,42,74,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#173B66] disabled:cursor-progress disabled:opacity-60 disabled:hover:translate-y-0 ${focusRing}`}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      <p role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </p>

      {/* Loading (first load only) */}
      {!data && status === "loading" && <DashboardSkeleton />}

      {/* Error with nothing to show */}
      {!data && status === "error" && (
        <section
          role="alert"
          className="rounded-2xl bg-rose-50 p-6 text-rose-900 ring-1 ring-rose-200"
        >
          <h3 className="font-semibold">
            The dashboard didn’t load
          </h3>
          <p className="mt-2 text-sm text-rose-800">
            We couldn’t reach the server. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={retry}
            className={`mt-4 min-h-11 rounded-full bg-[#1F5C94] px-5 text-sm font-semibold text-white hover:bg-[#173B66] ${focusRing}`}
          >
            Try again
          </button>
        </section>
      )}

      {data && (
        <>
          {/* Refresh failed but we still have older numbers */}
          {status === "error" && (
            <p
              role="alert"
              className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200"
            >
              Couldn’t refresh. Showing the last loaded numbers.
            </p>
          )}

          {/* Needs attention */}
          <section
            aria-labelledby="needs-attention"
            className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-[0_18px_36px_-18px_rgba(16,42,74,0.2)]"
          >
            <h3
              id="needs-attention"
              className="mb-4 text-base font-semibold text-[#102A4A]"
            >
              Needs attention
            </h3>

            {data.pendingKyc + data.pendingBookings === 0 ? (
              <p className="text-sm font-medium text-emerald-800">
                All clear. No pending KYC reviews or booking requests.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <AttentionCard
                  href={`${ROUTES.kyc}?status=pending`}
                  label="Pending KYC reviews"
                  hint="Review renter identity documents"
                  count={data.pendingKyc}
                />
                <AttentionCard
                  href={`${ROUTES.bookings}?status=pending`}
                  label="Pending bookings"
                  hint="Approve or decline requests"
                  count={data.pendingBookings}
                />
              </div>
            )}
          </section>

          {/* Operations overview */}
          <section aria-labelledby="overview">
            <h3
              id="overview"
              className="mb-4 text-base font-semibold text-[#102A4A]"
            >
              Operations Overview
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Units"
                description="All rental inventory"
                value={data.totalUnits}
                color="#173B66"
              />
              <StatCard
                title="Available Units"
                description="Ready to book"
                value={data.availableUnits}
                color="#059669"
              />
              <StatCard
                title="Registered Renters"
                description="All renter accounts"
                value={data.activeRenters}
                color="#1F5C94"
              />
              <StatCard
                title="Verified Renters"
                description="Passed KYC review"
                value={data.verifiedRenters}
                color="#3E7DBB"
              />
            </div>
          </section>

          {/* Recent activity */}
          <div>
            <section
              aria-labelledby="recent-activity"
              className="overflow-hidden rounded-[26px] bg-white ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-18px_rgba(16,42,74,0.35)]"
            >
              <h3
                id="recent-activity"
                className="border-b border-[#A8C5E8]/60 px-5 py-4 font-semibold text-[#102A4A]"
              >
                Recent activity
              </h3>

              {data.recentActivity.length === 0 ? (
                <p className="px-5 py-6 text-sm text-[#3E7DBB]">
                  No activity yet. KYC decisions, booking decisions and new
                  renters will show up here.
                </p>
              ) : (
                <ul className="divide-y divide-[#A8C5E8]/40">
                  {data.recentActivity.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-4 px-5 py-3"
                    >
                      <p className="text-sm text-[#102A4A]">
                        <span
                          className={`mr-2 inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${ACTIVITY_STYLES[item.type]}`}
                        >
                          {ACTIVITY_LABELS[item.type]}
                        </span>
                        {item.message}
                      </p>
                      <time
                        dateTime={item.at}
                        className="shrink-0 text-xs text-[#3E7DBB]"
                      >
                        {timeAgo(item.at)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

function AttentionCard({
  href,
  label,
  hint,
  count,
}: {
  href: string;
  label: string;
  hint: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-sm transition hover:border-amber-400 hover:shadow-md ${focusRing}`}
    >
      <span>
        <span className="block text-sm font-semibold text-[#102A4A]">
          {label}
        </span>
        <span className="block text-xs text-[#3E7DBB]">{hint}</span>
      </span>
      <span className="text-4xl font-bold tabular-nums text-amber-700">
        {count.toLocaleString()}
      </span>
    </Link>
  );
}

function StatCard({
  title,
  description,
  value,
  color,
}: {
  title: string;
  description: string;
  value: number;
  color: string;
}) {
  return (
    <article className="overflow-hidden rounded-[26px] bg-white ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-18px_rgba(16,42,74,0.35)]">
      <div className="h-1" style={{ backgroundColor: color }} aria-hidden />
      <div className="p-5">
        <p className="text-sm font-medium text-[#3E7DBB]">{title}</p>
        <p className="mt-4 text-3xl font-semibold tabular-nums text-[#102A4A]">
        {value.toLocaleString()}
        </p>
        <p className="mt-2 text-xs text-[#6E9BD3]">{description}</p>
      </div>
    </article>
  );
}

function DashboardSkeleton() {
  const block = "animate-pulse rounded-[26px] bg-[#A8C5E8]/30 motion-reduce:animate-none";
  return (
    <div aria-hidden="true" className="space-y-8">
      <div className={`${block} h-28`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-32`} />
        ))}
      </div>
      <div className={`${block} h-64`} />
    </div>
  );
}