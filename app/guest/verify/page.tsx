'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/navbar';

type VerificationResult = {
  booking_id: string;
  unit: string | null;
  start_date: string;
  end_date: string;
  booking_status: string | null;
  payment_status: string | null;
  verification_result: 'verified' | 'not_eligible';
  verification_message: string;
};

export default function PickupVerificationPage() {
  const params = useSearchParams();
  const bookingId = params.get('booking_id') ?? '';
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('A booking ID is required for pickup verification.');
      return;
    }

    fetch(`/api/bookings/verify?booking_id=${encodeURIComponent(bookingId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? 'Unable to verify booking.');
        }
        return data as VerificationResult;
      })
      .then(setResult)
      .catch((verificationError) => {
        setError(verificationError instanceof Error ? verificationError.message : 'Unable to verify booking.');
      });
  }, [bookingId]);

  const isVerified = result?.verification_result === 'verified';

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_left,_#eff6ff,_transparent_42%),#f8fafc] px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Pickup verification</p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-900">
              {error ? 'Verification unavailable' : result && !isVerified ? 'Booking not eligible' : 'Booking Verified'}
            </h1>

            {error ? (
              <p className="mt-4 text-sm text-red-700">{error}</p>
            ) : !result ? (
              <p className="mt-4 text-sm text-neutral-500">Checking booking status...</p>
            ) : (
              <div className="mt-6 space-y-4 text-sm text-neutral-700">
                <p className={isVerified ? 'text-emerald-700' : 'text-amber-700'}>{result.verification_message}</p>
                <div className="grid gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-neutral-500">Booking ID</p>
                    <p className="mt-1 break-all font-semibold text-neutral-900">{result.booking_id}</p>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-500">Unit</p>
                    <p className="mt-1 font-semibold text-neutral-900">{result.unit ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-500">Rental dates</p>
                    <p className="mt-1 font-semibold text-neutral-900">{result.start_date} to {result.end_date}</p>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-500">Payment status</p>
                    <p className="mt-1 font-semibold text-neutral-900">{result.payment_status ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-500">Booking status</p>
                    <p className="mt-1 font-semibold text-neutral-900">{result.booking_status ?? '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
