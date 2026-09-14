"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type BookingSummary = {
  unit: {
    unit_id: string;
    category: string | null;
    description: string | null;
    daily_rate: number | null;
    status: string | null;
    image_url: string | null;
  };
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_rate: number;
  total_amount: number;
};

export default function BookingPage() {
  const params = useSearchParams();
  const unitId = params.get('unit_id') ?? '';
  const startDate = params.get('start_date') ?? '';
  const endDate = params.get('end_date') ?? '';

  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!unitId || !startDate || !endDate) {
      setSummary(null);
      return;
    }

    async function fetchSummary() {
      setError(null);
      setCheckoutUrl(null);

      try {
        const response = await fetch(
          `/api/bookings/summary?unit_id=${encodeURIComponent(unitId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? 'Unable to load booking summary.');
        }

        setSummary(result);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load booking summary.');
      }
    }

    fetchSummary();
  }, [unitId, startDate, endDate]);

  const daysLabel = useMemo(() => {
    if (!summary) return '0';
    return `${summary.rental_days} day${summary.rental_days === 1 ? '' : 's'}`;
  }, [summary]);

  const handleCreateBooking = async () => {
    if (!summary) {
      setError('Please select a valid unit and rental dates.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unit_id: summary.unit.unit_id,
          start_date: summary.start_date,
          end_date: summary.end_date,
          payment_method: 'paymongo_checkout',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to create booking.');
      }

      if (result.checkout_url) {
        setCheckoutUrl(result.checkout_url);
        window.location.href = result.checkout_url;
      } else {
        setError('Booking created, but no checkout URL was returned.');
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Unable to complete booking request.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Booking summary
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Confirm your rental</h1>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!summary && !error ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
            Add a unit id and date range to load the booking summary.
          </div>
        ) : null}

        {summary && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  {summary.unit.image_url ? (
                    <img src={summary.unit.image_url} alt={summary.unit.category ?? 'Unit'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
                      Unit
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {summary.unit.category ?? 'Rental unit'}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                    {summary.unit.unit_id}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {summary.unit.description ?? 'Selected unit'}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Starts</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{summary.start_date}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Ends</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{summary.end_date}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Duration</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{daysLabel}</p>
                </div>
              </div>
            </div>

            <aside className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Payment</p>

              <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
                <span>Daily rate</span>
                <span>₱{Number(summary.daily_rate).toFixed(2)}</span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <span>Rental duration</span>
                <span>{daysLabel}</span>
              </div>

              <div className="mt-5 border-t border-blue-200 pt-5">
                <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
                  <span>Total</span>
                  <span>₱{Number(summary.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateBooking}
                disabled={isLoading}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoading ? 'Processing...' : 'Pay with PayMongo'}
              </button>

              {checkoutUrl && (
                <p className="mt-4 text-xs text-slate-600">
                  Redirecting to PayMongo checkout...
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
