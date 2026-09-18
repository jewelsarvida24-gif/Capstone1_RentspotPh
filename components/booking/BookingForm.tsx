'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, LogIn } from 'lucide-react';
import type { RentalUnit } from '@/lib/types';
import { createClient } from '@/lib/supabase_client';

export default function BookingForm({ unit }: { unit: RentalUnit }) {
  const router = useRouter();
  const supabase = createClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(new Date());

  const reservationFee = 1000;
  const dailyRate = Number(unit.price_per_day ?? 0);
  const calendarDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(visibleMonth)), end: endOfWeek(endOfMonth(visibleMonth)) });
  const selectedStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const selectedEnd = endDate ? new Date(`${endDate}T00:00:00`) : null;

  const selectDate = (date: Date) => {
    const value = format(date, 'yyyy-MM-dd');
    if (!startDate || (startDate && endDate)) {
      setStartDate(value);
      setEndDate('');
      return;
    }
    if (date < new Date(`${startDate}T00:00:00`)) {
      setStartDate(value);
      return;
    }
    setEndDate(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/auth/login?next=${encodeURIComponent(`/guest/book/${unit.unit_id}`)}`);
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select a start and end date.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setError('End date must be later than the start date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unit_id: unit.unit_id,
          start_date: startDate,
          end_date: endDate,
          notes,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Booking request failed.');
      }

      setSuccess('Booking request submitted successfully.');
      setTimeout(() => router.push('/renter/my-rentals'), 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong while creating your booking.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDays = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(`${endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) / 86400000) + 1)
    : 0;

  const estimatedCost = totalDays * dailyRate;
  const amountDue = totalDays ? Math.max(0, estimatedCost - reservationFee) : 0;
  const isAvailable = unit.status?.toLowerCase() === 'available';

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-blue-600">₱{dailyRate.toLocaleString()}</p>
          <p className="text-xs text-neutral-500">per day</p>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-neutral-800"><Clock3 className="h-4 w-4 shrink-0 text-blue-600" /> Real-Time Availability</div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 p-3">
        <div className="flex items-center justify-between"><button type="button" onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg p-1 text-neutral-700 hover:bg-neutral-100" aria-label="Previous month"><ArrowLeft className="h-4 w-4" /></button><p className="text-center text-sm font-bold">{format(visibleMonth, 'MMMM yyyy')}</p><button type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg p-1 text-neutral-700 hover:bg-neutral-100" aria-label="Next month"><ArrowRight className="h-4 w-4" /></button></div>
        <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-neutral-400">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="mt-2 grid grid-cols-7 gap-1">{calendarDays.map((date) => {
          const isSelected = Boolean((selectedStart && isSameDay(date, selectedStart)) || (selectedEnd && isSameDay(date, selectedEnd)));
          const isBetween = Boolean(selectedStart && selectedEnd && date > selectedStart && date < selectedEnd);
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          return <button key={date.toISOString()} type="button" disabled={isPast || !isSameMonth(date, visibleMonth) || !isAvailable} onClick={() => selectDate(date)} className={`min-h-9 rounded-md text-xs transition ${!isSameMonth(date, visibleMonth) ? 'text-neutral-300' : isPast ? 'cursor-not-allowed text-neutral-300 line-through' : isSelected ? 'bg-blue-600 font-bold text-white' : isBetween ? 'bg-blue-100 text-blue-800' : 'text-neutral-700 hover:bg-blue-50'}`}>{format(date, 'd')}</button>;
        })}</div>
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400"><span><s>Crossed dates</s> are already booked</span><CalendarDays className="h-3.5 w-3.5" /></div>

      <div className="mt-3 space-y-2 rounded-xl bg-slate-100 p-3 text-xs text-neutral-600">
        <div className="flex justify-between gap-3"><span>Pickup Date</span><strong className="text-neutral-900">{startDate ? format(new Date(`${startDate}T00:00:00`), 'MMM d, yyyy') : 'Select date'}</strong></div>
        <div className="flex justify-between gap-3"><span>Return Date</span><strong className="text-neutral-900">{endDate ? format(new Date(`${endDate}T00:00:00`), 'MMM d, yyyy') : 'Select date'}</strong></div>
        <div className="flex justify-between gap-3"><span>Rental Days</span><strong className="text-neutral-900">{totalDays || 0} day{totalDays === 1 ? '' : 's'}</strong></div>
        <div className="flex justify-between gap-3"><span>Daily Rate</span><strong className="text-neutral-900">₱{dailyRate.toLocaleString()}</strong></div>
        <div className="flex justify-between gap-3"><span>Subtotal</span><strong className="text-neutral-900">₱{estimatedCost.toLocaleString()}</strong></div>
        <div className="border-t border-neutral-200 pt-2"><div className="flex justify-between gap-3 font-semibold"><span>Reservation Fee</span><strong className="text-blue-700">₱{reservationFee.toLocaleString()}</strong></div><p className="mt-1 text-[10px]">Refundable security deposit</p></div>
        <div className="rounded-lg bg-white px-3 py-2"><p className="text-[10px]">Balance due at pickup:</p><p className="font-bold text-neutral-900">₱{amountDue.toLocaleString()}</p></div>
      </div>

      <label className="mt-3 block text-xs font-semibold text-neutral-700">Notes (optional)<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Add a special request" className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-normal outline-none focus:border-blue-500" /></label>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {!isAvailable ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">This unit is currently rented and cannot be booked.</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !isAvailable}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {!isAvailable ? 'Currently unavailable' : isSubmitting ? 'Submitting request...' : <><LogIn className="h-4 w-4" /> Sign in to Book</>}
      </button>

      <div className="mt-3 space-y-2 border-t border-neutral-200 pt-3 text-[10px] text-neutral-500"><p className="flex items-center gap-2"><ShieldIcon /> Verified listing with ID check</p><p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> Real-time availability calendar</p><p className="flex items-center gap-2"><CheckIcon /> Secure QR code pickup</p></div>
    </form>
  );
}

function ShieldIcon() { return <span className="inline-block h-3.5 w-3.5 rounded border border-neutral-400" />; }
function CheckIcon() { return <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-neutral-400 text-[9px]">✓</span>; }
