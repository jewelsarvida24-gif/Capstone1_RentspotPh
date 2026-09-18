'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, RotateCcw, Star } from 'lucide-react';
import type { RentalBooking } from '@/lib/types';
import { bookingTab, statusLabel, type RentalTab } from '@/lib/rentalStatus';

const tabs: { value: RentalTab; label: string; icon: typeof Clock3 }[] = [
  { value: 'upcoming', label: 'Upcoming', icon: Clock3 },
  { value: 'active', label: 'Active', icon: CalendarDays },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'cancelled', label: 'Cancelled', icon: RotateCcw },
];

const viewCopy: Record<RentalTab, { title: string; description: string }> = {
  upcoming: { title: 'Upcoming rentals', description: 'Reservations waiting for their pickup date.' },
  active: { title: 'Active rentals', description: 'Units currently in your care and ready to be returned.' },
  completed: { title: 'Completed rentals', description: 'Your returned rental history and feedback.' },
  cancelled: { title: 'Cancelled rentals', description: 'Reservations that are no longer active.' },
};

export function RentalManagement({ bookings }: { bookings: RentalBooking[] }) {
  const [tab, setTab] = useState<RentalTab>('upcoming');
  const [items, setItems] = useState(bookings);
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const updateStatus = async (bookingId: string | number, status: 'cancelled' | 'completed') => {
    setUpdatingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const payload = await response.json();
      if (!response.ok) { setMessage(payload.message || 'Unable to update rental.'); return; }
      setItems((current) => current.map((item) => item.booking_id === bookingId ? { ...item, booking_status: status } : item));
      setMessage(`Rental marked ${status}.`);
    } catch {
      setMessage('Unable to update rental. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const visible = items.filter((booking) => bookingTab(booking.booking_status) === tab);
  return (
    <div>
      <div role="tablist" aria-label="Rental status views" className="grid grid-cols-2 gap-1 border-b border-neutral-200 pb-1 sm:grid-cols-4 xl:flex xl:gap-2">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button key={value} id={`rental-tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`rental-panel-${value}`} type="button" onClick={() => setTab(value)} className={`flex min-w-0 items-center justify-center gap-2 border-b-2 px-2 py-3 text-sm font-semibold transition xl:shrink-0 xl:px-3 ${tab === value ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}>
            <Icon className="h-4 w-4 shrink-0" /> <span className="truncate">{label}</span><span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{items.filter((item) => bookingTab(item.booking_status) === value).length}</span>
          </button>
        ))}
      </div>
      {message ? <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{message}</p> : null}
      <div id={`rental-panel-${tab}`} role="tabpanel" aria-labelledby={`rental-tab-${tab}`} className="mt-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">{viewCopy[tab].title}</h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">{viewCopy[tab].description}</p>
        </div>
        <div className="space-y-4">
        {visible.length ? visible.map((booking) => {
          const unit = booking.tbl_units;
          const isUpcoming = tab === 'upcoming';
          const isActive = tab === 'active';
          const isCompleted = tab === 'completed';
          const isCancelled = tab === 'cancelled';
          return (
            <article key={String(booking.booking_id)} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${isActive ? 'text-emerald-700' : isCompleted ? 'text-slate-600' : isCancelled ? 'text-red-600' : 'text-blue-600'}`}>{statusLabel(booking.booking_status)}</p>
                  <h2 className="mt-1 break-words text-lg font-bold text-neutral-900">{unit?.unit_name || `Rental #${booking.booking_id}`}</h2>
                  <p className="mt-1 text-sm leading-6 text-neutral-500">{unit?.category || 'Rental'}{unit?.location ? ` · ${String(unit.location)}` : ''}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Total</p>
                  <p className="text-lg font-bold text-neutral-900">₱{Number(booking.total_amount ?? 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="grid grid-cols-2 gap-3 text-sm sm:max-w-md">
                  <div><p className="text-xs uppercase tracking-[0.12em] text-neutral-400">{isActive ? 'Started' : isCompleted ? 'Picked up' : 'Pickup date'}</p><p className="mt-1 font-semibold text-neutral-800">{booking.start_date}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.12em] text-neutral-400">{isActive ? 'Return by' : isCompleted ? 'Returned' : 'Scheduled return'}</p><p className="mt-1 font-semibold text-neutral-800">{booking.end_date}</p></div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link href={`/renter/my-rentals/${booking.booking_id}`} className="inline-flex min-h-11 items-center font-semibold text-blue-600 hover:text-blue-700">View rental details</Link>
                  <div className="flex flex-wrap gap-2">
                  {isUpcoming ? <button type="button" disabled={updatingId === booking.booking_id} onClick={() => updateStatus(booking.booking_id, 'cancelled')} className="min-h-11 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{updatingId === booking.booking_id ? 'Cancelling...' : 'Cancel'}</button> : null}
                  {isActive ? <button type="button" disabled={updatingId === booking.booking_id} onClick={() => updateStatus(booking.booking_id, 'completed')} className="min-h-11 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{updatingId === booking.booking_id ? 'Updating...' : 'Mark returned'}</button> : null}
                  </div>
                </div>
              </div>
              {isCompleted ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4"><div><p className="text-sm font-semibold text-neutral-800">How was this rental?</p><p className="mt-1 text-xs text-neutral-500">Leave a rating to help improve the catalogue.</p></div><RatingForm booking={booking} onRated={() => setMessage('Thanks for rating this rental.')} /></div> : null}
              {isCancelled ? <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">This reservation is no longer active. View the details for its original schedule.</div> : null}
            </article>
          );
        }) : <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center"><p className="font-semibold text-neutral-700">No {tab} rentals yet</p><p className="mt-1 text-sm text-neutral-500">Your rental activity will appear here.</p></div>}
        </div>
      </div>
    </div>
  );
}

function RatingForm({ booking, onRated }: { booking: RentalBooking; onRated: () => void }) {
  const [rating, setRating] = useState(booking.rating || 0);
  const [saving, setSaving] = useState(false);
  const [rated, setRated] = useState(Boolean(booking.rating));
  const [error, setError] = useState('');
  const submit = async () => {
    if (!rating || rated) return;
    setError('');
    setSaving(true);
    try {
      const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: booking.booking_id, unit_id: booking.unit_id, rating }) });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Unable to save your rating.');
        return;
      }
      setRated(true);
      onRated();
    } catch {
      setError('Unable to save your rating. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return <div className="flex min-h-11 flex-wrap items-center gap-1" aria-label="Rate completed rental">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} star${value === 1 ? '' : 's'}`} aria-pressed={rating === value} disabled={rated || saving} onClick={() => setRating(value)} className="p-1 disabled:cursor-default"><Star className={`h-5 w-5 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} /></button>)}<button type="button" onClick={submit} disabled={!rating || rated || saving} className="ml-1 min-h-9 px-1 text-xs font-semibold text-blue-600 disabled:text-neutral-400">{rated ? 'Rated' : saving ? 'Saving...' : 'Rate'}</button>{error ? <p role="alert" className="basis-full text-xs text-red-600">{error}</p> : null}</div>;
}