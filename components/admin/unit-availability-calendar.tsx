"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  LoaderCircle,
  Lock,
  LockOpen,
  TriangleAlert,
  X,
} from "lucide-react";

type BookingRange = {
  start_date: string;
  end_date: string;
  status: string | null;
};

type DateBlock = {
  block_id: string;
  date_ids: Record<string, string>;
  start_date: string;
  end_date: string;
  reason: string | null;
};

type AvailabilityPayload = {
  bookings: BookingRange[];
  blocks: DateBlock[];
};

type PendingAction = { date: string; blockId?: string };
type ToastState = { type: "success" | "error"; message: string };

function toDateString(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function fromDateString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(fromDateString(value));
}

function getTodayInManila() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function monthDays(month: Date) {
  const firstDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const offset = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) =>
    new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index - offset + 1))
  );
}

export default function UnitAvailabilityCalendar({ unitId }: { unitId: string }) {
  const [availability, setAvailability] = useState<AvailabilityPayload>({ bookings: [], blocks: [] });
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [isLoading, setIsLoading] = useState(true);
  const [busyDate, setBusyDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  async function loadAvailability() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/units/${encodeURIComponent(unitId)}/availability`,
        { cache: "no-store" }
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load unit calendar.");
      setAvailability({
        bookings: Array.isArray(payload.bookings) ? payload.bookings : [],
        blocks: Array.isArray(payload.blocks) ? payload.blocks : [],
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load unit calendar.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAvailability();
  }, [unitId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!pendingAction) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPendingAction(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingAction]);

  const days = useMemo(() => monthDays(visibleMonth), [visibleMonth]);
  const today = getTodayInManila();
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(visibleMonth);

  function getDayEntries(date: string) {
    const bookings = availability.bookings.filter(
      (range) => date >= range.start_date && date <= range.end_date
    );
    const blocks = availability.blocks.filter(
      (range) => date >= range.start_date && date <= range.end_date
    );
    return { bookings, blocks };
  }

  function requestToggle(date: string, blockId?: string) {
    if (busyDate) return;
    setPendingAction({ date, blockId });
  }

  async function confirmToggle() {
    if (!pendingAction) return;
    const { date, blockId } = pendingAction;
    setPendingAction(null);
    setBusyDate(date);
    setError(null);
    try {
      const url = `/api/admin/units/${encodeURIComponent(unitId)}/availability`;
      const response = blockId
        ? await fetch(`${url}?block_id=${encodeURIComponent(blockId)}`, { method: "DELETE" })
        : await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start_date: date, end_date: date }),
          });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload.error || (blockId ? "Unable to unblock this date." : "Unable to block this date.")
        );
      }
      setToast({
        type: "success",
        message: blockId
          ? `${formatDate(date)} is open for rentals again.`
          : `${formatDate(date)} is now blocked.`,
      });
      await loadAvailability();
    } catch (toggleError) {
      setToast({
        type: "error",
        message: toggleError instanceof Error ? toggleError.message : "Unable to update this date.",
      });
    } finally {
      setBusyDate(null);
    }
  }

  const isUnblock = Boolean(pendingAction?.blockId);

  return (
    <section className="mt-6 rounded-[26px] bg-white p-5 ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-18px_rgba(16,42,74,0.25)] sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-[#102A4A]">Unit calendar</h3>
        <p className="mt-1 text-sm text-slate-600">
          Click an available date to block it. Click a blocked date to unblock it.
        </p>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(17rem,0.9fr)]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setVisibleMonth((month) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#A8C5E8] text-[#1F5C94] hover:bg-[#A8C5E8]/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h4 aria-live="polite" className="font-semibold text-[#102A4A]">{monthLabel}</h4>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setVisibleMonth((month) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#A8C5E8] text-[#1F5C94] hover:bg-[#A8C5E8]/20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day} className="py-2">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const date = toDateString(day);
              const inMonth = day.getUTCMonth() === visibleMonth.getUTCMonth();
              const { bookings, blocks } = getDayEntries(date);
              const isBlocked = blocks.length > 0;
              const isPastDate = date < today;
              const blockId = blocks[0]?.date_ids[date];
              const dayLabel = [
                formatDate(date),
                ...bookings.map((booking) => `${booking.status ?? "Rental"} booking`),
                ...blocks.map((block) => `Blocked${block.reason ? `: ${block.reason}` : ""}`),
                bookings.length === 0 && !isPastDate
                  ? isBlocked ? "Click to unblock" : "Click to block"
                  : "",
              ].join(" · ");

              return (
                <button
                  key={date}
                  type="button"
                  disabled={!inMonth || bookings.length > 0 || isPastDate || isLoading || busyDate !== null}
                  onClick={() => requestToggle(date, blockId)}
                  aria-label={dayLabel}
                  title={dayLabel}
                  className={`relative min-h-12 rounded-lg border text-sm transition ${
                    !inMonth
                      ? "invisible border-transparent"
                      : bookings.length > 0 || isPastDate
                        ? "cursor-not-allowed border-rose-100 bg-rose-50 font-medium text-rose-700"
                        : isBlocked
                          ? "border-rose-200 bg-rose-100 font-semibold text-rose-800 hover:bg-rose-200"
                          : "border-transparent text-[#102A4A] hover:border-[#A8C5E8] hover:bg-[#A8C5E8]/20"
                  }`}
                >
                  {busyDate === date ? (
                    <LoaderCircle className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    day.getUTCDate()
                  )}
                  {inMonth && (bookings.length > 0 || isBlocked) && busyDate !== date && (
                    <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                      {bookings.length > 0 && <span className="h-1 w-1 rounded-full bg-blue-600" />}
                      {isBlocked && <span className="h-1 w-1 rounded-full bg-rose-500" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2">
              <i className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />Rental order
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />Unavailable block
            </span>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h4 className="font-semibold text-[#102A4A]">Rental orders</h4>
            {isLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading calendar...</p>
            ) : availability.bookings.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No orders for this unit.</p>
            ) : (
              <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {availability.bookings.map((booking, index) => (
                  <li
                    key={`${booking.start_date}-${booking.end_date}-${index}`}
                    className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-[#102A4A]">
                      {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                    </span>
                    <span className="ml-2 text-xs capitalize text-blue-700">
                      {booking.status?.replace(/_/g, " ") ?? "Rental"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-[#102A4A]">Blocked dates</h4>
            {availability.blocks.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No blocked dates for this unit.</p>
            ) : (
              <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {availability.blocks.map((block) => (
                  <li
                    key={block.block_id}
                    className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                  >
                    <span className="block font-medium">
                      {formatDate(block.start_date)} – {formatDate(block.end_date)}
                    </span>
                    {block.reason && <span className="block truncate text-xs">{block.reason}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <style>{`
        @keyframes pop-in { 0% { opacity: 0; transform: scale(.85) translateY(12px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes toast-in { 0% { opacity: 0; transform: translateX(40px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes icon-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes toast-bar { from { width: 100%; } to { width: 0%; } }
      `}</style>

      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#102A4A]/50 p-4 backdrop-blur-sm"
          style={{ animation: "fade-in .2s ease-out" }}
          onClick={() => setPendingAction(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-[28px] bg-white p-6 text-center shadow-[0_30px_60px_-20px_rgba(16,42,74,0.5)]"
            style={{ animation: "pop-in .3s cubic-bezier(.2,1.2,.4,1)" }}
          >
            <div
              className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent ${
                isUnblock ? "from-emerald-100" : "from-rose-100"
              }`}
            />
            <button
              type="button"
              aria-label="Close"
              onClick={() => setPendingAction(null)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div
              className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-8 ${
                isUnblock ? "bg-emerald-500 ring-emerald-100" : "bg-rose-500 ring-rose-100"
              }`}
              style={{ animation: "icon-bounce 1.4s ease-in-out infinite" }}
            >
              {isUnblock ? (
                <LockOpen className="h-7 w-7 text-white" />
              ) : (
                <Lock className="h-7 w-7 text-white" />
              )}
            </div>
            <h3 className="relative mt-4 text-xl font-semibold text-[#102A4A]">
              {isUnblock ? "Open this date?" : "Block this date?"}
            </h3>
            <p className="relative mt-1 text-sm font-medium text-[#1F5C94]">
              {formatDate(pendingAction.date)}
            </p>
            <p className="relative mt-2 text-sm text-slate-600">
              {isUnblock
                ? "Renters will be able to book this date again."
                : "This date will be unavailable for renters to book."}
            </p>
            <div className="relative mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="flex-1 rounded-full border border-[#A8C5E8] px-4 py-2.5 text-sm font-semibold text-[#1F5C94] hover:bg-[#A8C5E8]/20"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => void confirmToggle()}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${
                  isUnblock
                    ? "bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600"
                    : "bg-rose-500 shadow-rose-500/30 hover:bg-rose-600"
                }`}
              >
                {isUnblock ? "Yes, unblock" : "Yes, block it"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-4 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_-12px_rgba(16,42,74,0.35)] ring-1 ${
            toast.type === "success" ? "ring-emerald-200" : "ring-rose-200"
          }`}
          style={{ animation: "toast-in .35s cubic-bezier(.2,1.2,.4,1)" }}
        >
          <div className="flex items-start gap-3 p-4">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              }`}
            >
              {toast.type === "success" ? (
                <CircleCheck className="h-5 w-5" />
              ) : (
                <TriangleAlert className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#102A4A]">
                {toast.type === "success" ? "All set!" : "Oops, something went wrong"}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div
            className={`h-1 ${toast.type === "success" ? "bg-emerald-400" : "bg-rose-400"}`}
            style={{ animation: "toast-bar 4s linear forwards" }}
          />
        </div>
      )}
    </section>
  );
}