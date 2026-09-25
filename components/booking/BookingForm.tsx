'use client';

import { useState } from 'react';
import type { RentalUnit } from '@/lib/types';

export default function BookingForm({ unit }: { unit: RentalUnit }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

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
          payment_method: 'paymongo_checkout',
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Booking request failed.');
      }

      if (!payload.checkout_url) {
        throw new Error('Checkout is unavailable. Please try again.');
      }

      window.location.assign(payload.checkout_url);
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
    ? Math.max(
        1,
        Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
      )
    : 0;

  const estimatedCost = totalDays * Number(unit.price_per_day ?? 0);
  const isAvailable = unit.status?.toLowerCase() === 'available';

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Book this rental</h2>
        <p className="mt-1 text-sm text-neutral-500">Reserve your preferred dates in a few quick steps.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium text-neutral-700">
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:bg-white"
            required
          />
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          End date
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:bg-white"
            required
          />
        </label>
      </div>

      <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
        <div className="flex items-center justify-between gap-4">
          <span>Estimated duration</span>
          <strong>{totalDays || 0} day(s)</strong>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <span>Estimated total</span>
          <strong>₱{estimatedCost.toLocaleString()}</strong>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!isAvailable ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">This unit is currently rented and cannot be booked.</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !isAvailable}
        className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {!isAvailable ? 'Currently unavailable' : isSubmitting ? 'Submitting request...' : 'Confirm booking'}
      </button>
    </form>
  );
}
