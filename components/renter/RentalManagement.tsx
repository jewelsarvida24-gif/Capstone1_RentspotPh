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

function rentalStatus(booking: RentalBooking) {
  return booking.status ?? booking.booking_status ?? 'pending';
}

export function RentalManagement({ bookings }: { bookings: RentalBooking[] }) {
  const [tab, setTab] = useState<RentalTab>('upcoming');
  const [items, setItems] = useState(bookings);
  const [message, setMessage] = useState('');

  const updateStatus = async (bookingId: string | number, status: 'cancelled' | 'completed') => {
    const response = await fetch(`/api/bookings/${bookingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const payload = await response.json();
    if (!response.ok) { setMessage(payload.message || 'Unable to update rental.'); return; }
    setItems((current) => current.map((item) => item.booking_id === bookingId ? { ...item, booking_status: status, status } : item));
    setMessage(`Rental marked ${status}.`);
  };

  const visible = items.filter((booking) => bookingTab(rentalStatus(booking)) === tab);
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" onClick={() => setTab(value)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition ${tab === value ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}>
            <Icon className="h-4 w-4" /> {label}<span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{items.filter((item) => bookingTab(rentalStatus(item)) === value).length}</span>
          </button>
        ))}
      </div>
      {message ? <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p> : null}
      <div className="mt-5 space-y-4">
        {visible.length ? visible.map((booking) => {
          const unit = booking.tbl_units;
          return (
            <article key={String(booking.booking_id)} className="rounded-[26px] border border-white/80 bg-white/85 p-6 shadow-[0_14px_40px_rgba(37,99,235,0.06)] backdrop-blur">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{statusLabel(rentalStatus(booking))}</p>
                  <h2 className="mt-1 text-lg font-bold text-neutral-900">{unit?.unit_name || `Rental #${booking.booking_id}`}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{booking.start_date} to {booking.end_date}</p>
                </div>
                <p className="text-lg font-bold text-neutral-900">₱{Number(booking.total_amount ?? 0).toLocaleString()}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
                <Link href={`/renter/my-rentals/${booking.booking_id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View rental details</Link>
                <div className="flex gap-2">
                  {tab === 'upcoming' ? <button type="button" onClick={() => updateStatus(booking.booking_id, 'cancelled')} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cancel</button> : null}
                  {tab === 'active' ? <button type="button" onClick={() => updateStatus(booking.booking_id, 'completed')} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Mark returned</button> : null}
                  {tab === 'completed' ? <RatingForm booking={booking} onRated={() => setMessage('Thanks for rating this rental.')} /> : null}
                </div>
              </div>
            </article>
          );
        }) : <div className="rounded-[26px] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center"><p className="font-semibold text-slate-700">No {tab} rentals yet</p><p className="mt-1 text-sm text-slate-500">Your rental activity will appear here.</p></div>}
      </div>
    </div>
  );
}

function RatingForm({ booking, onRated }: { booking: RentalBooking; onRated: () => void }) {
  const [rating, setRating] = useState(booking.rating || 0);
  const [saving, setSaving] = useState(false);
  const [rated, setRated] = useState(Boolean(booking.rating));
  const submit = async () => {
    if (!rating || rated) return;
    setSaving(true);
    const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: booking.booking_id, unit_id: booking.unit_id, rating }) });
    setSaving(false);
    if (response.ok) { setRated(true); onRated(); }
  };
  return <div className="flex items-center gap-1" aria-label="Rate completed rental">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" disabled={rated || saving} onClick={() => setRating(value)} className="disabled:cursor-default"><Star className={`h-5 w-5 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} /></button>)}<button type="button" onClick={submit} disabled={!rating || rated || saving} className="ml-1 text-xs font-semibold text-blue-600 disabled:text-neutral-400">{rated ? 'Rated' : 'Rate'}</button></div>;
}