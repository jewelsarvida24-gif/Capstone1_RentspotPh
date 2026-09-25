'use client';

import { useState } from 'react';
import { CalendarDays, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BookingRequestForm({ unitId }: { unitId: string }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) { setError('Choose a valid rental date range.'); return; }
    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    unit_id: unitId,
    start_date: startDate,
    end_date: endDate,
    notes,
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
        });
        router.push(`/renter/booking?${query.toString()}`);
      }, 900);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to submit booking request.'); } finally { setSubmitting(false); }
  };
  return <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-neutral-700">Start date<input type="date" value={startDate} min={new Date().toISOString().split('T')[0]} onChange={(event) => setStartDate(event.target.value)} className="input-field mt-2" required /></label><label className="text-sm font-semibold text-neutral-700">End date<input type="date" value={endDate} min={startDate || new Date().toISOString().split('T')[0]} onChange={(event) => setEndDate(event.target.value)} className="input-field mt-2" required /></label></div><label className="block text-sm font-semibold text-neutral-700">Notes <span className="font-normal text-neutral-400">(optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={500} placeholder="Add pickup or rental details" className="input-field mt-2 resize-none" /></label>{error && <p className="text-sm font-medium text-red-600">{error}</p>}{message && <p className="text-sm font-medium text-emerald-700">{message}</p>}<button type="submit" disabled={submitting} className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />} Submit booking request</button></form>;
}
