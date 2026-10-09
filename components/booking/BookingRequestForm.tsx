'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type BookedRange = {
  start_date: string;
  end_date: string;
};

type DatePickerProps = {
  id: string;
  label: string;
  value: string;
  minimumDate: string;
  maximumDate?: string;
  disabled?: boolean;
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

async function fetchBookedRanges(unitId: string): Promise<BookedRange[]> {
  const response = await fetch(`/api/bookings/availability?unit_id=${encodeURIComponent(unitId)}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load unit availability.');
  return Array.isArray(payload.booked_ranges) ? payload.booked_ranges : [];
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
  value,
  minimumDate,
  maximumDate,
  disabled = false,
  getUnavailableReason,
  onChange,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
  };

  return <div className="relative">
    <span className="block text-sm font-semibold text-neutral-700">{label}</span>
    <button
      id={id}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={`${id}-calendar`}
      disabled={disabled}
      onClick={() => setIsOpen((open) => !open)}
      className="input-field mt-2 flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value ? formatDate(value) : 'Select a date'}</span>
      <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
    </button>
    {isOpen && <div id={`${id}-calendar`} role="dialog" aria-label={`${label} calendar`} className="absolute left-0 z-20 mt-2 w-[min(21rem,calc(100vw-3rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
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
              : maximumDate && dateString > maximumDate
                ? 'After the last selectable date'
                : getUnavailableReason(dateString);
          const isUnavailable = Boolean(reason);
          const isSelected = value === dateString;

          return <button
            key={`${dateString}-${index}`}
            type="button"
            role="gridcell"
            aria-label={`${formatDate(dateString)}, ${isUnavailable ? reason : 'Available'}`}
            aria-pressed={isSelected}
            title={isUnavailable ? reason ?? undefined : 'Available'}
            disabled={isUnavailable || disabled}
            onClick={() => selectDate(date)}
            className={`relative aspect-square min-h-9 rounded-lg text-sm font-medium transition ${
              !isCurrentMonth
                ? 'invisible'
                : isSelected
                  ? 'bg-blue-600 text-white'
                  : isUnavailable
                    ? 'cursor-not-allowed bg-rose-50 text-rose-700 line-through'
                    : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            {date.getDate()}
            {isCurrentMonth && !isUnavailable && !isSelected && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />}
          </button>;
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Available</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Already booked / unavailable</span>
      </div>
    </div>}
  </div>;
}

export default function BookingRequestForm({ unitId }: { unitId: string }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [availabilityState, setAvailabilityState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [availabilityReload, setAvailabilityReload] = useState(0);
  const today = getToday();

  useEffect(() => {
    let isCurrent = true;
    setAvailabilityState('loading');

    fetchBookedRanges(unitId)
      .then((ranges) => {
        if (isCurrent) {
          setBookedRanges(ranges);
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
  const rangeHasBooking = (start: string, end: string) => hasBookedRange(start, end, bookedRanges);
  const getStartUnavailableReason = (date: string) => {
    if (availabilityState !== 'loaded') return 'Availability is not loaded';
    return isBooked(date) ? 'Already booked' : null;
  };
  const getEndUnavailableReason = (date: string) => {
    if (availabilityState !== 'loaded') return 'Availability is not loaded';
    if (isBooked(date)) return 'Already booked';
    if (startDate && rangeHasBooking(startDate, date)) return 'Rental range includes already booked dates';
    return null;
  };
  const getPickupUnavailableReason = (date: string) => {
    if (availabilityState !== 'loaded') return 'Availability is not loaded';
    return isBooked(date) ? 'Already booked' : null;
  };

  const updateStartDate = (date: string) => {
    setStartDate(date);
    if (endDate && (endDate <= date || rangeHasBooking(date, endDate))) setEndDate('');
    if (pickupDate && pickupDate < date) setPickupDate('');
    setError('');
  };

  const updateEndDate = (date: string) => {
    setEndDate(date);
    if (pickupDate && (pickupDate < startDate || pickupDate > date)) setPickupDate('');
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (availabilityState !== 'loaded') { setError('Unit availability must load before you can submit.'); return; }
    if (!startDate || !endDate || endDate <= startDate || !pickupDate) { setError('Choose a valid start date, end date, and pickup date.'); return; }
    if (isBooked(startDate) || isBooked(endDate) || rangeHasBooking(startDate, endDate)) { setError('That rental range is no longer available. Choose different dates.'); return; }
    if (pickupDate < startDate || pickupDate > endDate || isBooked(pickupDate)) { setError('Choose a pickup date within your available rental dates.'); return; }
    setSubmitting(true);
    try {
      const latestRanges = await fetchBookedRanges(unitId);
      setBookedRanges(latestRanges);
      if (isDateBooked(startDate, latestRanges) || isDateBooked(endDate, latestRanges) || hasBookedRange(startDate, endDate, latestRanges) || isDateBooked(pickupDate, latestRanges)) {
        setError('That rental range is no longer available. Choose different dates.');
        return;
      }
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          start_date: startDate,
          end_date: endDate,
          pickup_date: pickupDate,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to submit booking request.');
      const bookingId = payload.booking?.booking_id;
      if (!bookingId) throw new Error('Booking was created, but its booking ID was not returned.');
      setMessage('Booking request submitted. You can track it in My Rentals.');
      setTimeout(() => {
        const query = new URLSearchParams({
          booking_id: bookingId,
          unit_id: unitId,
          start_date: startDate,
          end_date: endDate,
          pickup_date: pickupDate,
        });
        router.push(`/renter/booking?${query.toString()}`);
      }, 900);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to submit booking request.'); } finally { setSubmitting(false); }
  };

  return <form onSubmit={submit} className="space-y-5">
    {availabilityState === 'loading' && <p role="status" className="text-sm text-slate-500">Loading current booking availability...</p>}
    {availabilityState === 'error' && <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><p>Could not load booking availability. Dates remain unavailable until this is resolved.</p><button type="button" onClick={() => setAvailabilityReload((attempt) => attempt + 1)} className="font-semibold underline underline-offset-2">Try again</button></div>}
    <div className="grid gap-4 md:grid-cols-2">
      <DatePicker
        id="booking-start-date"
        label="Start Date"
        value={startDate}
        minimumDate={today}
        disabled={availabilityState !== 'loaded'}
        getUnavailableReason={getStartUnavailableReason}
        onChange={updateStartDate}
      />
      <DatePicker
        id="booking-end-date"
        label="End Date"
        value={endDate}
        minimumDate={startDate ? addDays(startDate, 1) : today}
        disabled={availabilityState !== 'loaded'}
        getUnavailableReason={getEndUnavailableReason}
        onChange={updateEndDate}
      />
      <DatePicker
        id="booking-pickup-date"
        label="Pickup Date"
        value={pickupDate}
        minimumDate={startDate || today}
        maximumDate={endDate || undefined}
        disabled={availabilityState !== 'loaded' || !startDate}
        getUnavailableReason={getPickupUnavailableReason}
        onChange={(date) => { setPickupDate(date); setError(''); }}
      />
    </div>
    {(startDate || endDate || pickupDate) && <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
      <p><span className="block text-xs font-semibold uppercase text-slate-500">Start Date</span><span className="mt-1 block font-semibold text-slate-900">{startDate ? formatDate(startDate) : 'Not selected'}</span></p>
      <p><span className="block text-xs font-semibold uppercase text-slate-500">End Date</span><span className="mt-1 block font-semibold text-slate-900">{endDate ? formatDate(endDate) : 'Not selected'}</span></p>
      <p><span className="block text-xs font-semibold uppercase text-slate-500">Pickup Date</span><span className="mt-1 block font-semibold text-slate-900">{pickupDate ? formatDate(pickupDate) : 'Not selected'}</span></p>
    </div>}
    {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
    {message && <p role="status" className="text-sm font-medium text-emerald-700">{message}</p>}
    <button type="submit" disabled={submitting || availabilityState !== 'loaded'} className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />} Submit booking request</button>
  </form>;
}
