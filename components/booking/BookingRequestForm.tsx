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
    event.preventDefault();
    setError('');
    setMessage('');

    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
      setError('Choose a valid rental date range.');
      return;
    }

    setSubmitting(true);

    try {
      const params = new URLSearchParams({
        unit_id: unitId,
        start_date: startDate,
        end_date: endDate,
      });

      if (notes.trim()) {
        params.set('notes', notes.trim());
      }

      router.push(`/renter/booking?${params.toString()}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to continue to booking summary.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-neutral-700">
          Start date
          <input
            type="date"
            value={startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(event) => setStartDate(event.target.value)}
            className="input-field mt-2"
            required
          />
        </label>

        <label className="text-sm font-semibold text-neutral-700">
          End date
          <input
            type="date"
            value={endDate}
            min={startDate || new Date().toISOString().split('T')[0]}
            onChange={(event) => setEndDate(event.target.value)}
            className="input-field mt-2"
            required
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-neutral-700">
        Notes <span className="font-normal text-neutral-400">(optional)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Add pickup or rental details"
          className="input-field mt-2 resize-none"
        />
      </label>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
      >
        {submitting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <CalendarDays className="h-4 w-4" />
        )}
        Submit booking request
      </button>
    </form>
  );
}
