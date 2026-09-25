'use client';

import { useState } from 'react';
import { CalendarDays, LoaderCircle } from 'lucide-react';

export default function BookingRequestForm({ unitId }: { unitId: string }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (!startDate || !endDate || endDate <= startDate) { setError('Choose a valid rental date range.'); return; }
    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          start_date: startDate,
          end_date: endDate,
          payment_method: 'paymongo_checkout',
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to submit booking request.');
      if (!payload.checkout_url) throw new Error('Checkout is unavailable. Please try again.');
      window.location.assign(payload.checkout_url);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to submit booking request.'); } finally { setSubmitting(false); }
  };
  return <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-neutral-700">Start date<input type="date" value={startDate} min={new Date().toISOString().split('T')[0]} onChange={(event) => setStartDate(event.target.value)} className="input-field mt-2" required /></label><label className="text-sm font-semibold text-neutral-700">End date<input type="date" value={endDate} min={startDate || new Date().toISOString().split('T')[0]} onChange={(event) => setEndDate(event.target.value)} className="input-field mt-2" required /></label></div>{error && <p className="text-sm font-medium text-red-600">{error}</p>}<button type="submit" disabled={submitting} className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto">{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />} Continue to payment</button></form>;
}
