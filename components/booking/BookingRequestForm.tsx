'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

type BookedRange = {
  start_date: string;
  end_date: string;
};

type AvailabilityRanges = {
  bookedRanges: BookedRange[];
  blockedRanges: BookedRange[];
};

type DatePickerProps = {
  id: string;
  label: string;
  showLabel?: boolean;
  value: string;
  startDate: string;
  endDate: string;
  minimumDate: string;
  disabled?: boolean;
  readOnly?: boolean;
  getUnavailableReason: (date: string) => string | null;
  onChange: (date: string) => void;
};

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getToday() {
  return toDateString(new Date());
}

function getEarliestBookingDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function addDays(value: string, amount: number) {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);
  return toDateString(date);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parseDate(value));
}

async function fetchBookedRanges(unitId: string): Promise<AvailabilityRanges> {
  const response = await fetch(`/api/bookings/availability?unit_id=${encodeURIComponent(unitId)}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load unit availability.');
  return {
    bookedRanges: Array.isArray(payload.booked_ranges) ? payload.booked_ranges : [],
    blockedRanges: Array.isArray(payload.blocked_ranges) ? payload.blocked_ranges : [],
  };
}

function isDateBooked(date: string, ranges: BookedRange[]) {
  return ranges.some((range) => date >= range.start_date && date <= range.end_date);
}

function hasBookedRange(start: string, end: string, ranges: BookedRange[]) {
  return ranges.some((range) => start <= range.end_date && end >= range.start_date);
}

function DatePicker({
  id,
  label,
  showLabel = true,
  value,
  startDate,
  endDate,
  minimumDate,
  disabled = false,
  readOnly = false,
  getUnavailableReason,
  onChange,
}: DatePickerProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = value ? parseDate(value) : parseDate(minimumDate);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const monthLabel = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);
  const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: 42 }, (_, index) =>
    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - firstWeekday + 1),
  );
  const minimumMonth = parseDate(minimumDate);
  const previousMonthDisabled = visibleMonth.getFullYear() < minimumMonth.getFullYear()
    || (visibleMonth.getFullYear() === minimumMonth.getFullYear() && visibleMonth.getMonth() <= minimumMonth.getMonth());

  const selectDate = (date: Date) => {
    onChange(toDateString(date));
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return <div className="relative">
    {showLabel && <span className="block text-sm font-semibold text-neutral-700">{label}</span>}
    <div id={`${id}-calendar`} role="region" aria-label={`${label} calendar`} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous month" disabled={previousMonthDisabled} onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"><ChevronLeft className="h-4 w-4" /></button>
        <p aria-live="polite" className="text-sm font-bold text-slate-900">{monthLabel}</p>
        <button type="button" aria-label="Next month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400" aria-hidden="true">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} className="py-1">{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={monthLabel}>
        {calendarDays.map((date, index) => {
          const dateString = toDateString(date);
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const reason = !isCurrentMonth
            ? 'Outside this month'
            : dateString < minimumDate
              ? 'Before the first selectable date'
              : getUnavailableReason(dateString);
          const isUnavailable = Boolean(reason);
          const isSelected = value === dateString;
          const isStartDate = startDate === dateString;
          const isEndDate = endDate === dateString;
          const isRentalPeriodDate = Boolean(startDate && endDate && dateString > startDate && dateString < endDate);
          const selectedLabels = [isStartDate && 'start date', isEndDate && 'end date'].filter(Boolean);
          const selectionDescription = selectedLabels.length ? `Selected ${selectedLabels.join(' and ')}` : null;

          return <button
            key={`${dateString}-${index}`}
            type="button"
            role="gridcell"
            aria-label={`${formatDate(dateString)}, ${selectionDescription ? `${selectionDescription}, ` : ''}${isUnavailable ? reason : 'Available'}`}
            aria-pressed={isSelected}
            title={selectionDescription ?? (isUnavailable ? reason ?? undefined : 'Available')}
            disabled={isUnavailable || disabled || readOnly}
            onClick={() => selectDate(date)}
           className={`relative aspect-square min-h-9 rounded-lg text-sm font-medium transition ${
  !isCurrentMonth
    ? 'invisible'
    : isStartDate
      ? 'bg-blue-600 text-white'
      : isEndDate
        ? 'bg-violet-600 text-white'
        : isSelected
          ? 'bg-blue-600 text-white'
          : isUnavailable
            ? 'cursor-not-allowed bg-rose-50 text-rose-700 line-through'
            : readOnly
              ? 'cursor-default text-emerald-800'
              : 'text-emerald-800 hover:bg-emerald-50'
}`}
          >
            {date.getDate()}
            {isCurrentMonth && !isUnavailable && !isSelected && !isStartDate && !isEndDate && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />}
          </button>;
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Available</span>
  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Booked or blocked by unit manager</span>
  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" />Start date</span>
  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-600" />End date</span>
</div>
    </div>
  </div>;
}

export default function BookingRequestForm({
  unitId,
  dailyRate,
  readOnly = false,
}: {
  unitId: string;
  dailyRate: number | null;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDateValidationModal, setShowDateValidationModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [blockedRanges, setBlockedRanges] = useState<BookedRange[]>([]);
  const [availabilityState, setAvailabilityState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [availabilityReload, setAvailabilityReload] = useState(0);
  const today = getToday();

  useEffect(() => {
    let isCurrent = true;
    setAvailabilityState('loading');

    fetchBookedRanges(unitId)
      .then(({ bookedRanges: bookings, blockedRanges: blocks }) => {
        if (isCurrent) {
          setBookedRanges(bookings);
          setBlockedRanges(blocks);
          setAvailabilityState('loaded');
        }
      })
      .catch(() => {
        if (isCurrent) setAvailabilityState('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [unitId, availabilityReload]);

  const isBooked = (date: string) => isDateBooked(date, bookedRanges);
  const isBlocked = (date: string) => isDateBooked(date, blockedRanges);
  const rangeHasBooking = (start: string, end: string) => hasBookedRange(start, end, bookedRanges);
  const rangeHasBlock = (start: string, end: string) => hasBookedRange(start, end, blockedRanges);
  const getStartUnavailableReason = (date: string) => {
    if (availabilityState !== 'loaded') return 'Availability is not loaded';
    if (isBooked(date)) return 'Already booked';
    return isBlocked(date) ? 'Unavailable - blocked by the owner' : null;
  };
  const getEndUnavailableReason = (date: string) => {
    if (availabilityState !== 'loaded') return 'Availability is not loaded';
    if (isBooked(date)) return 'Already booked';
    if (isBlocked(date)) return 'Unavailable - blocked by the owner';
    if (startDate && rangeHasBooking(startDate, date)) return 'Rental range includes already booked dates';
    if (startDate && rangeHasBlock(startDate, date)) return 'Rental range includes dates blocked by the owner';
    return null;
  };
  const updateStartDate = (date: string) => {
    setStartDate(date);
    setEndDate('');
    setError('');
  };

  const updateEndDate = (date: string) => {
    setEndDate(date);
    setError('');
  };

  const resetDates = () => {
    setStartDate('');
    setEndDate('');
    setError('');
    setMessage('');
  };

  const clearEndDate = () => {
    setEndDate('');
    setError('');
  };

  const rentalDays = startDate && endDate && endDate > startDate
    ? Math.round((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const estimatedTotal = dailyRate !== null && rentalDays > 0 ? dailyRate * rentalDays : null;

  if (readOnly) {
    return (
      <section aria-label="Rental availability calendar" className="space-y-3">
        <p className="text-sm text-slate-600">
          Dates marked unavailable are already booked or blocked by the unit manager.
        </p>
        {availabilityState === 'loading' && (
          <p role="status" className="text-sm text-slate-500">Loading rental availability...</p>
        )}
        {availabilityState === 'error' && (
          <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <p>Could not load rental availability. Please try again.</p>
            <button type="button" onClick={() => setAvailabilityReload((attempt) => attempt + 1)} className="font-semibold underline underline-offset-2">
              Try again
            </button>
          </div>
        )}
        <DatePicker
          id="rental-availability"
          label="Rental availability"
          value=""
          startDate=""
          endDate=""
          minimumDate={today}
          disabled={availabilityState !== 'loaded'}
          readOnly
          getUnavailableReason={(date) => {
            if (availabilityState !== 'loaded') return 'Availability is not loaded';
            if (isBooked(date)) return 'Already booked';
            return isBlocked(date) ? 'Unavailable - blocked by the owner' : null;
          }}
          onChange={() => undefined}
        />
      </section>
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (availabilityState !== 'loaded') { setError('Unit availability must load before you can submit.'); return; }
    if (!startDate || !endDate || endDate <= startDate) { setError('Choose a valid start and end date.'); return; }
    if (startDate < getEarliestBookingDate()) {
      setShowDateValidationModal(true);
      return;
    }
    if (
      isBooked(startDate) ||
      isBooked(endDate) ||
      rangeHasBooking(startDate, endDate) ||
      isBlocked(startDate) ||
      isBlocked(endDate) ||
      rangeHasBlock(startDate, endDate)
    ) {
      setError('That rental range is no longer available. Choose different dates.');
      return;
    }
    setSubmitting(true);
    try {
      const latestAvailability = await fetchBookedRanges(unitId);
      setBookedRanges(latestAvailability.bookedRanges);
      setBlockedRanges(latestAvailability.blockedRanges);
      if (
        isDateBooked(startDate, latestAvailability.bookedRanges) ||
        isDateBooked(endDate, latestAvailability.bookedRanges) ||
        hasBookedRange(startDate, endDate, latestAvailability.bookedRanges) ||
        isDateBooked(startDate, latestAvailability.blockedRanges) ||
        isDateBooked(endDate, latestAvailability.blockedRanges) ||
        hasBookedRange(startDate, endDate, latestAvailability.blockedRanges)
      ) {
        setError('That rental range is no longer available. Choose different dates.');
        return;
      }

      const query = new URLSearchParams({
        unit_id: unitId,
        start_date: startDate,
        end_date: endDate,
        pickup_date: startDate,
      });
      router.push(`/renter/booking?${query.toString()}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  //Rental Unit Breakdown and Date Selection Form
  return <form onSubmit={submit} className="relative space-y-5">
    <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
      {estimatedTotal !== null && <div className="mt-3 flex items-center justify-between gap-3 border-t border-blue-100 pt-3">
        <span className="text-sm font-medium text-slate-600">Estimated rental total ({rentalDays} {rentalDays === 1 ? 'day' : 'days'})</span>
        <span className="text-2xl font-extrabold text-blue-700 sm:text-3xl">PHP {estimatedTotal.toLocaleString()}</span>
      </div>}
      <p className="mt-2 text-xs text-slate-500">Estimate is based on your selected dates and excludes any additional fees.</p>
    </div>
    {availabilityState === 'loading' && <p role="status" className="text-sm text-slate-500">Loading current booking availability...</p>}
    {availabilityState === 'error' && <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><p>Could not load booking availability. Dates remain unavailable until this is resolved.</p><button type="button" onClick={() => setAvailabilityReload((attempt) => attempt + 1)} className="font-semibold underline underline-offset-2">Try again</button></div>}
    <div className="grid gap-4 md:grid-cols-2">
      <button
        type="button"
        onClick={resetDates}
        disabled={!startDate && !endDate}
        title="Click to reset dates"
        className="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:bg-white"
      >
        <span className="block text-xs font-semibold uppercase text-slate-500">Start Date</span>
        <span className="mt-1 block font-semibold text-slate-900">{startDate ? formatDate(startDate) : '-------'}</span>
      </button>
      <button
        type="button"
        onClick={clearEndDate}
        disabled={!endDate}
        title="Click to clear end date"
        className="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:bg-white"
      >
        <span className="block text-xs font-semibold uppercase text-slate-500">End Date</span>
        <span className="mt-1 block font-semibold text-slate-900">{endDate ? formatDate(endDate) : '-------'}</span>
      </button>
      <div className="md:col-span-2">
        <DatePicker
          id="booking-rental-dates"
          label="Rental dates"
          showLabel={false}
          value={endDate || startDate}
          startDate={startDate}
          endDate={endDate}
          minimumDate={startDate && !endDate ? addDays(startDate, 1) : today}
          disabled={availabilityState !== 'loaded'}
          getUnavailableReason={(date) => startDate && !endDate
            ? getEndUnavailableReason(date)
            : getStartUnavailableReason(date)}
          onChange={(date) => {
            if (!startDate) updateStartDate(date);
            else if (!endDate) updateEndDate(date);
            else resetDates();
          }}
        />
      </div>
    </div>
    {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
    {message && <p role="status" className="text-sm font-medium text-emerald-700">{message}</p>}
    <div className="flex justify-end">
      <button type="submit" disabled={submitting || availabilityState !== 'loaded'} className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />} Next Step</button>
    </div>
    {showDateValidationModal && typeof document !== 'undefined' && createPortal(
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-[3px]">
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="booking-date-validation-title"
          className="relative w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-[0_30px_60px_-20px_rgba(16,42,74,0.5)]"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 ring-8 ring-rose-50">
            <AlertCircle className="h-7 w-7 text-rose-600" />
          </div>
          <h2 id="booking-date-validation-title" className="mt-4 text-xl font-semibold text-slate-900">
            Booking Notice
          </h2>
          <p className="mx-auto mt-2 max-w-[17rem] text-sm leading-6 text-rose-800">
            Bookings must be made at least one day ahead. Please choose tomorrow or a later date.
          </p>
          <button
            type="button"
            onClick={() => setShowDateValidationModal(false)}
            className="mt-6 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          >
            OK
          </button>
        </section>
      </div>,
      document.body
    )}
  </form>;
}
