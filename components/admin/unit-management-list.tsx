"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  Camera,
  ChevronDown,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const PAGE_BG = "#fbfdff";
const UNIT_CATEGORIES = ["Camera", "Smartphone", "Vehicle", "Add-on"];

export type ManagedUnit = {
  unit_id: string;
  unit_name: string;
  category: string | null;
  daily_rate: number | string | null;
  image_url: string | null;
  status: string | null;
  activeBookingStatus: "Confirmed" | "Approved" | "Pending" | null;
};

type UnitManagementListProps = {
  units: ManagedUnit[];
  summaryCounts: {
    available: number;
    unavailable: number;
    archived: number;
    pending: number;
    approved: number;
    confirmed: number;
  };
};

function statusClasses(status: string | null) {
  switch (status?.toLowerCase()) {
    case "approved":
    case "confirmed":
      return "border-emerald-600 text-emerald-600";
    case "pending":
      return "border-amber-600 text-amber-600";
    case "archived":
      return "border-amber-600 text-amber-600";
    case "unavailable":
      return "border-slate-500 text-slate-500";
    case "available":
      return "border-[#1F5C94] text-[#1F5C94]";
    default:
      return "border-slate-500 text-slate-500";
  }
}

function formatRate(rate: number | string | null) {
  const amount = Number(rate);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function SummaryMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 lg:border-l lg:border-[#A8C5E8]/60 lg:pl-5 lg:first:border-l-0 lg:first:pl-0">
      <span className="relative h-12 w-12 shrink-0" aria-label={`${value}`}>
        <span
          className="absolute left-1/2 top-0.5 flex h-9 w-9 -translate-x-1/2 -rotate-45 items-center justify-center rounded-full rounded-bl-none"
          style={{ background: color }}
          aria-hidden="true"
        >
          <span className="rotate-45 text-sm font-semibold tabular-nums text-white">
            {value}
          </span>
        </span>
      </span>
      <span className="text-sm font-medium text-[#102A4A]">{label}</span>
    </div>
  );
}

export default function UnitManagementList({
  units,
  summaryCounts,
}: UnitManagementListProps) {
  const router = useRouter();
  const [busyUnitId, setBusyUnitId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unitToRestore, setUnitToRestore] = useState<ManagedUnit | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isRefreshing, startRefresh] = useTransition();

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();
    return units.filter((unit) => {
      const status = unit.activeBookingStatus ?? unit.status ?? "Unknown";
      const matchesStatus =
        statusFilter === "all" || status.toLowerCase() === statusFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        unit.category?.toLowerCase() === categoryFilter.toLowerCase();
      const searchable = [
        unit.unit_name,
        unit.category ?? "",
        unit.unit_id,
        status,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesCategory && (!query || searchable.includes(query));
    });
  }, [units, search, statusFilter, categoryFilter]);

  function refreshList() {
    startRefresh(() => router.refresh());
  }

  async function changeArchiveStatus(unit: ManagedUnit) {
    if (busyUnitId) return;

    setBusyUnitId(unit.unit_id);
    setActionError(null);

    try {
      const response = await fetch(
        `/api/admin/units/${encodeURIComponent(unit.unit_id)}/archive`,
        { method: "POST" }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to archive this unit.");
      }

      refreshList();
    } catch (actionError) {
      setActionError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to archive this unit."
      );
    } finally {
      setBusyUnitId(null);
    }
  }

  async function confirmUnarchive() {
    if (!unitToRestore || busyUnitId) return;

    const unit = unitToRestore;
    setBusyUnitId(unit.unit_id);
    setActionError(null);

    try {
      const response = await fetch(
        `/api/admin/units/${encodeURIComponent(unit.unit_id)}/restore`,
        { method: "POST" }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to unarchive this unit.");
      }

      setUnitToRestore(null);
      refreshList();
    } catch (actionError) {
      setUnitToRestore(null);
      setActionError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to unarchive this unit."
      );
    } finally {
      setBusyUnitId(null);
    }
  }

  return (
    <main
      className="min-h-screen px-4 pb-20 pt-8 text-[#102A4A]"
      style={{ background: PAGE_BG }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busyUnitId) {
          if (actionError) {
            setActionError(null);
          } else {
            setUnitToRestore(null);
          }
        }
      }}
    >
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span
              className="mb-4 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#102A4A,#3E7DBB,#A8C5E8)]"
              aria-hidden
            />
            <span className="inline-flex items-center gap-2 rounded-full bg-[#102A4A] px-3 py-1 text-xs font-medium text-[#A8C5E8]">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin workspace
            </span>
            <h1 className="mt-4 text-[38px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[48px]">
              Unit management
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={refreshList}
              disabled={isRefreshing || busyUnitId !== null}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#A8C5E8] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F5C94] transition hover:bg-[#A8C5E8]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C94] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <Link
              href="/admin/dashboard/units/new"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1F5C94] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#173B66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C94] focus-visible:ring-offset-2"
            >
              Add Unit
            </Link>
          </div>
        </header>

        <section className="mt-10" aria-labelledby="unit-counts-heading">
          <h2
            id="unit-counts-heading"
            className="mb-4 text-sm font-semibold tracking-wide text-[#173B66]"
          >
            Unit availability
          </h2>
          <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-3 sm:gap-y-0">
            <SummaryMetric
              label="Available"
              value={summaryCounts.available}
              color="#1F5C94"
            />
            <SummaryMetric
              label="Unavailable"
              value={summaryCounts.unavailable}
              color="#64748b"
            />
            <SummaryMetric
              label="Archived"
              value={summaryCounts.archived}
              color="#64748b"
            />
          </div>
        </section>

        <section className="mt-8" aria-labelledby="booking-counts-heading">
          <h2
            id="booking-counts-heading"
            className="mb-4 text-sm font-semibold tracking-wide text-[#173B66]"
          >
            Active booking statuses
          </h2>
          <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-3 sm:gap-y-0">
            <SummaryMetric
              label="Pending"
              value={summaryCounts.pending}
              color="#f59e0b"
            />
            <SummaryMetric
              label="Approved"
              value={summaryCounts.approved}
              color="#059669"
            />
            <SummaryMetric
              label="Confirmed"
              value={summaryCounts.confirmed}
              color="#059669"
            />
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[26px] bg-white ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-18px_rgba(16,42,74,0.35)]">
          <div className="bg-[#0b1f38] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex min-w-0 flex-1 items-center rounded-full bg-[#0f2a4a] ring-1 ring-cyan-300/50 focus-within:ring-cyan-300">
                <Search className="ml-4 h-4 w-4 shrink-0 text-cyan-300" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search units, category, or ID"
                  aria-label="Search rental units"
                  className="min-w-0 flex-1 bg-transparent py-3 pl-3 pr-4 text-sm text-white outline-none placeholder:text-[#A8C5E8]/60"
                />
              </label>
              <label className="relative flex shrink-0 items-center rounded-full bg-[#0f2a4a] ring-1 ring-cyan-300/50 focus-within:ring-cyan-300">
                <span className="sr-only">Filter units by status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter units by status"
                  className="w-full cursor-pointer appearance-none rounded-full bg-transparent py-3 pl-4 pr-10 text-sm font-medium text-white outline-none sm:w-auto"
                >
                  <option value="all" className="bg-[#0b1f38] text-white">
                    All statuses
                  </option>
                  <option value="available" className="bg-[#0b1f38] text-white">
                    Available
                  </option>
                  <option value="unavailable" className="bg-[#0b1f38] text-white">
                    Unavailable
                  </option>
                  <option value="archived" className="bg-[#0b1f38] text-white">
                    Archived
                  </option>
                  <option value="pending" className="bg-[#0b1f38] text-white">
                    Pending
                  </option>
                  <option value="approved" className="bg-[#0b1f38] text-white">
                    Approved
                  </option>
                  <option value="confirmed" className="bg-[#0b1f38] text-white">
                    Confirmed
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-[#A8C5E8]" />
              </label>
              <label className="relative flex shrink-0 items-center rounded-full bg-[#0f2a4a] ring-1 ring-cyan-300/50 focus-within:ring-cyan-300">
                <span className="sr-only">Filter units by category</span>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  aria-label="Filter units by category"
                  className="w-full cursor-pointer appearance-none rounded-full bg-transparent py-3 pl-4 pr-10 text-sm font-medium text-white outline-none sm:w-auto"
                >
                  <option value="all" className="bg-[#0b1f38] text-white">
                    All Categories
                  </option>
                  {UNIT_CATEGORIES.map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="bg-[#0b1f38] text-white"
                    >
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-[#A8C5E8]" />
              </label>
            </div>
          </div>

          {filteredUnits.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-semibold text-[#102A4A]">
                {units.length === 0
                  ? "No rental units yet"
                  : "No matching rental units"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-3 sm:p-4">
              {filteredUnits.map((unit) => {
                const isArchived = unit.status?.toLowerCase() === "archived";
                const hasActiveBooking = Boolean(unit.activeBookingStatus);
                const isBusy = busyUnitId === unit.unit_id;
                const imageUrl = unit.image_url?.trim() || null;
                const displayedStatus =
                      unit.activeBookingStatus ??
                      unit.status ??
                      "Unknown";
                    const activeBookingMessage =
                      "Unavailable while booking is active.";

                    return (
                      <article
                        key={unit.unit_id}
                        className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_11rem_17rem]"
                      >
                        <section className="flex min-w-0 items-center gap-3 rounded-xl border border-[#A8C5E8]/70 bg-white p-3">
                          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={unit.unit_name}
                                fill
                                sizes="64px"
                                className="object-contain p-1"
                                unoptimized={imageUrl.startsWith("http")}
                              />
                            ) : (
                              <Camera
                                className="h-7 w-7 text-slate-400"
                                strokeWidth={1.7}
                                aria-label="No unit image"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold tracking-[-0.02em] text-[#102A4A]">
                              {unit.unit_name}
                            </p>
                            <p className="mt-0.5 truncate text-sm text-slate-600">
                              {unit.category || "Uncategorized"}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span
                                className={`inline-flex rounded border-2 bg-white px-2 py-1 text-[10px] font-extrabold uppercase leading-none tracking-[0.14em] ${statusClasses(displayedStatus)}`}
                              >
                                {displayedStatus}
                              </span>
                              <span className="truncate text-xs text-slate-500">
                                ID: {unit.unit_id}
                              </span>
                            </div>
                          </div>
                        </section>
                        <section className="flex min-h-[5.5rem] flex-col justify-center rounded-xl border border-[#A8C5E8]/70 bg-white px-4 py-3">
                          <span className="text-xs font-medium text-slate-500">
                            Daily Rate
                          </span>
                          <span className="mt-1 font-semibold tabular-nums text-[#173B66]">
                            {formatRate(unit.daily_rate)}
                          </span>
                          <span className="mt-0.5 text-xs text-slate-500">
                            per day
                          </span>
                        </section>
                        <section className="flex min-h-[5.5rem] flex-col justify-center rounded-xl border border-[#A8C5E8]/70 bg-white px-4 py-3">
                          <span className="mb-2 text-xs font-medium text-slate-500">
                            Actions
                          </span>
                          <div className="flex items-center justify-start gap-2">
                            {hasActiveBooking ? (
                              <span
                                aria-disabled="true"
                                title={activeBookingMessage}
                                className="inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400"
                              >
                                <span aria-hidden="true">Edit</span>
                                <span className="sr-only">{activeBookingMessage}</span>
                              </span>
                            ) : (
                              <Link
                                href={`/admin/dashboard/units/${encodeURIComponent(unit.unit_id)}/edit`}
                                className="inline-flex items-center justify-center rounded-full border border-[#A8C5E8] px-4 py-2 text-xs font-semibold text-[#1F5C94] transition hover:bg-[#A8C5E8]/20"
                              >
                                Edit
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (isArchived) {
                                  setUnitToRestore(unit);
                                  setActionError(null);
                                } else {
                                  void changeArchiveStatus(unit);
                                }
                              }}
                              disabled={
                                busyUnitId !== null ||
                                (hasActiveBooking && !isArchived)
                              }
                              title={
                                hasActiveBooking && !isArchived
                                  ? activeBookingMessage
                                  : undefined
                              }
                              className={`inline-flex min-h-9 min-w-28 items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C94] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                                isArchived
                                  ? "border border-[#A8C5E8] text-[#1F5C94] hover:bg-[#A8C5E8]/20"
                                  : "bg-[#102A4A] text-white hover:bg-[#173B66]"
                              }`}
                            >
                              {isBusy
                                ? isArchived
                                  ? "Unarchiving..."
                                  : "Archiving..."
                                : isArchived
                                  ? "Unarchive"
                                  : "Archive"}
                            </button>
                          </div>
                          {hasActiveBooking && (
                            <p className="mt-2 text-xs leading-5 text-amber-700">
                              {activeBookingMessage}
                            </p>
                          )}
                        </section>
                      </article>
                    );
                  })}
            </div>
          )}
        </section>
      </div>

      {unitToRestore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#102A4A]/55 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyUnitId) {
              setUnitToRestore(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="unarchive-dialog-title"
            aria-describedby="unarchive-dialog-message"
            className="w-full max-w-md rounded-[26px] bg-white p-6 text-[#102A4A] ring-1 ring-[#A8C5E8]/70 shadow-[0_24px_64px_-20px_rgba(16,42,74,0.6)] sm:p-7"
          >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A8C5E8]/25 text-[#1F5C94]">
                  <ArchiveRestore className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    id="unarchive-dialog-title"
                    className="pt-1 text-xl font-semibold tracking-[-0.02em]"
                  >
                Unarchive Rental Unit?
                  </h2>
              <p
                id="unarchive-dialog-message"
                    className="mt-2 text-sm leading-6 text-slate-600"
              >
                Are you sure you want to unarchive this rental unit? It will become
                available to renters again.
              </p>
                </div>
              </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setUnitToRestore(null)}
                disabled={busyUnitId !== null}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#A8C5E8] px-5 py-2.5 text-sm font-semibold text-[#1F5C94] transition hover:bg-[#A8C5E8]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmUnarchive()}
                disabled={busyUnitId !== null}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1F5C94] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#173B66] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyUnitId === unitToRestore.unit_id && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
                {busyUnitId === unitToRestore.unit_id
                  ? "Unarchiving..."
                  : "Yes, Unarchive"}
              </button>
            </div>
          </section>
        </div>
      )}
      {actionError && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#102A4A]/55 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyUnitId) {
              setActionError(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unit-action-error-title"
            aria-describedby="unit-action-error-message"
            className="w-full max-w-md rounded-[26px] bg-white p-6 text-[#102A4A] ring-1 ring-[#A8C5E8]/70 shadow-[0_24px_64px_-20px_rgba(16,42,74,0.6)] sm:p-7"
          >
            <h2
              id="unit-action-error-title"
              className="text-xl font-semibold tracking-[-0.02em]"
            >
              Action could not be completed
            </h2>
            <p
              id="unit-action-error-message"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              {actionError}
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setActionError(null)}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#1F5C94] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#173B66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C94] focus-visible:ring-offset-2"
            >
              Dismiss
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
