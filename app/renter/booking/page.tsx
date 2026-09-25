"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const params = useSearchParams();
  const unitId = params.get('unit_id') ?? '';
  const startDate = params.get('start_date') ?? '';
  const endDate = params.get('end_date') ?? '';
  const bookingId = params.get('booking_id') ?? '';
  const paymentStatus = params.get('status') ?? '';

  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [bookingCreatedAt, setBookingCreatedAt] = useState<number | null>(() => {
    if (typeof window === 'undefined') return Date.now();

    const storedCreatedAt = window.localStorage.getItem('rentspotph_booking_created_at');
    const createdAt = storedCreatedAt ? new Date(storedCreatedAt).getTime() : NaN;

    if (Number.isFinite(createdAt) && Date.now() - createdAt < 1000 * 30) {
      return createdAt;
    }

    const now = Date.now();
    window.localStorage.setItem('rentspotph_booking_created_at', new Date(now).toISOString());
    return now;
  });
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [receipt, setReceipt] = useState<null | {
    booking_id: string;
    unit: string | null;
    start_date: string;
    end_date: string;
    rental_days: number | null;
    daily_rate: number | null;
    total_amount: number | null;
    payment_method: string | null;
    payment_status: string | null;
    booking_status: string | null;
  }>(null);

  useEffect(() => {
    const storedCreatedAt = window.localStorage.getItem('rentspotph_booking_created_at');

    if (storedCreatedAt) {
      const createdAt = new Date(storedCreatedAt).getTime();

      if (Number.isFinite(createdAt)) {
        setBookingCreatedAt(createdAt);
      }
    }

    if (bookingId && (paymentStatus === 'success' || paymentStatus === 'under_review' || paymentStatus === 'confirmed')) {
      fetch(`/api/bookings/receipt?booking_id=${encodeURIComponent(bookingId)}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.booking_id) {
            setReceipt(data);
          }
        })
        .catch(() => undefined);
    }

    if (paymentStatus === 'success' || paymentStatus === 'cancelled' || paymentStatus === 'under_review' || paymentStatus === 'confirmed') {
      setSummary(null);
      setCheckoutUrl(null);
      return;
    }

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
  }, [unitId, startDate, endDate, bookingId, paymentStatus]);

  useEffect(() => {
    if (!bookingCreatedAt) {
      setTimeLeft('');
      setPaymentExpired(false);
      return;
    }

    const expireAt = bookingCreatedAt + (1000 * 30);
    const updateCountdown = () => {
      const remaining = expireAt - Date.now();

      if (remaining <= 0) {
        setTimeLeft('Payment session expired');
        setPaymentExpired(true);
        return;
      }

      const totalSeconds = Math.max(0, Math.floor(remaining / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft(`Payment expires in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      setPaymentExpired(false);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [bookingCreatedAt]);

  const daysLabel = useMemo(() => {
    if (!summary) return '0';
    return `${summary.rental_days} day${summary.rental_days === 1 ? '' : 's'}`;
  }, [summary]);

  const handleCreateBooking = async () => {
    if (paymentExpired) {
      return;
    }

    if (!summary) {
      setError('Please select a valid unit and rental dates.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const expiresAt = new Date(Date.now() + (1000 * 30));
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

      if (result?.booking?.created_at) {
        const createdAt = new Date(result.booking.created_at).getTime();
        setBookingCreatedAt(createdAt);
        window.localStorage.setItem('rentspotph_booking_created_at', result.booking.created_at);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`rentspotph_booking_created_at_${result.booking.booking_id ?? 'pending'}`, result.booking.created_at);
        }
      } else if (typeof window !== 'undefined') {
        window.localStorage.setItem('rentspotph_booking_created_at', expiresAt.toISOString());
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

  const bookingQrUrl = typeof window !== 'undefined' && bookingId
    ? `${(process.env.NEXT_PUBLIC_APP_URL?.trim() || window.location.origin).replace(/\/$/, '')}/guest/verify?booking_id=${encodeURIComponent(bookingId)}`
    : '';

  const handleAgreementSubmit = () => {
    if (!bookingId || !agreementAccepted) return;
    router.push(`/renter/booking?booking_id=${encodeURIComponent(bookingId)}&status=under_review`);
  };

  const handleSimulateAdminReview = () => {
    if (!bookingId) return;
    router.push(`/renter/booking?booking_id=${encodeURIComponent(bookingId)}&status=confirmed`);
  };

  const handleDone = () => {
    router.push('/guest/browse');
  };

  return (
    <div className="min-h-screen bg-[#fbfdff] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            {paymentStatus === 'success' ? 'Rental agreement' : paymentStatus === 'under_review' ? 'Booking under review' : paymentStatus === 'confirmed' ? 'Booking confirmed' : paymentStatus === 'cancelled' ? 'Payment cancelled' : 'Booking summary'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            {paymentStatus === 'success' ? 'Review your rental agreement' : paymentStatus === 'under_review' ? 'Your booking is being reviewed' : paymentStatus === 'confirmed' ? 'Booking confirmed' : paymentStatus === 'cancelled' ? 'Payment cancelled' : 'Confirm your rental'}
          </h1>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {paymentStatus === 'cancelled' && (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-[0_18px_60px_rgba(251,191,36,0.09)]">
            <p className="text-base font-medium text-amber-800">
              Your payment was cancelled. You can return to the booking summary and try again.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push('/guest/browse')}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Browse units
              </button>
              <button
                type="button"
                onClick={() => router.push('/renter/dashboard')}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && bookingId && (
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Rental agreement</p>
                <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Booking ID: {bookingId}
                </span>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">Review your rental agreement</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Please review and accept the rental agreement before your booking proceeds to admin review.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAgreementOpen(true)}
                className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                View &amp; Sign Agreement
              </button>
            </div>

            {agreementOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/25 p-4 backdrop-blur-[3px]"
                role="presentation"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setAgreementOpen(false);
                }}
              >
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="rental-agreement-title"
                  className="relative my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
                >
                  <button
                    type="button"
                    onClick={() => setAgreementOpen(false)}
                    aria-label="Close rental agreement"
                    className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    ×
                  </button>

                  <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-6 py-5 sm:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Rental agreement</p>
                    <h2 id="rental-agreement-title" className="mt-2 pr-10 text-2xl font-semibold text-slate-900">Review and accept</h2>
                  </div>

                  <div className="space-y-6 p-6 sm:p-8">
                    <p className="text-sm leading-7 text-slate-700">
                      This agreement covers the rental period, pickup conditions, item condition, return policy,
                      and renter responsibilities for the selected unit.
                    </p>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                        <li>The renter is responsible for the item while in their possession.</li>
                        <li>Pickup and return times must be followed as agreed.</li>
                        <li>Any damage, loss, or late return may incur additional charges.</li>
                      </ul>
                    </div>

                    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={agreementAccepted}
                        onChange={(event) => setAgreementAccepted(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>I agree to the rental agreement terms and conditions.</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAgreementSubmit}
                      disabled={!agreementAccepted}
                      className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Agree &amp; Sign
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {paymentStatus === 'under_review' && bookingId && (
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 bg-gradient-to-r from-amber-50 via-white to-amber-50 px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Booking status</p>
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Booking ID: {bookingId}
                </span>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">Booking under review</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Your rental request has been submitted and is waiting for review. This is the RP-57 demo flow step before confirmation.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Booking information</p>
                <div className="mt-3 space-y-2">
                  <p><span className="font-medium text-slate-600">Booking ID:</span> {bookingId}</p>
                  <p><span className="font-medium text-slate-600">Status:</span> Pending review</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateAdminReview}
                className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Simulate Admin Review
              </button>
            </div>
          </div>
        )}

        {paymentStatus === 'confirmed' && bookingId && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-emerald-200 bg-white shadow-[0_20px_70px_rgba(16,185,129,0.08)]">
              <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-6 py-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Confirmation</p>
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Booking ID: {bookingId}
                  </span>
                </div>
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">Booking confirmed</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    Your rental has been confirmed and is ready for the next step in the booking process.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                  Your booking is confirmed and ready to continue. You can now explore more rental options.
                </div>

                <button
                  type="button"
                  onClick={handleDone}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Rental receipt</p>
              </div>

              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5 text-sm text-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">RentSpotPH</p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">Rental Receipt</h3>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">PAID</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Booking ID</p>
                      <p className="mt-1 font-semibold text-slate-900">{bookingId}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</p>
                      <p className="mt-1 font-semibold text-emerald-700">{receipt?.booking_status ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Unit</p>
                      <p className="mt-1 font-semibold text-slate-900">{receipt?.unit ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Payment method</p>
                      <p className="mt-1 font-semibold text-slate-900">{receipt?.payment_method ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Payment status</p>
                      <p className="mt-1 font-semibold text-slate-900">{receipt?.payment_status ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Start date</p>
                      <p className="mt-1 font-semibold text-slate-900">{receipt?.start_date ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">End date</p>
                      <p className="mt-1 font-semibold text-slate-900">{receipt?.end_date ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Duration</p>
                      <p className="mt-1 font-semibold text-slate-900">{receipt?.rental_days ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Daily rate</p>
                      <p className="mt-1 font-semibold text-slate-900">{receipt?.daily_rate == null ? '—' : `₱${receipt.daily_rate.toFixed(2)}`}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <span>Total amount paid</span>
                      <span className="text-lg font-semibold text-slate-900">{receipt?.total_amount == null ? '—' : `₱${receipt.total_amount.toFixed(2)}`}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Scan to verify pickup</p>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(bookingQrUrl)}`}
                      alt="Pickup verification QR"
                      className="h-44 w-44 object-contain"
                    />
                  </div>
                  <p className="mt-3 text-xs leading-6 text-slate-600">
                    Verification link: {bookingQrUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!summary && !error && !paymentStatus && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
            Add a unit id and date range to load the booking summary.
          </div>
        )}

        {summary && !paymentExpired && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-700">{timeLeft || 'Starting payment timer...'}</p>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Secure checkout</span>
            </div>
          </div>
        )}

        {summary && paymentExpired && (
          <div className="mb-6 rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-[0_18px_60px_rgba(239,68,68,0.08)]">
            <p className="text-lg font-semibold text-red-800">Payment session expired</p>
            <p className="mt-2 text-sm text-red-700">This booking can no longer be completed because the 30-second payment window has elapsed.</p>
            <button
              type="button"
              onClick={() => router.push('/guest/browse')}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Browse Available Units
            </button>
          </div>
        )}

        {summary && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Rental details</p>
              </div>

              <div className="p-6 sm:p-8">
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

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      {summary.unit.category ?? 'Rental unit'}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">
                      {summary.unit.unit_id}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {summary.unit.description ?? 'Selected unit'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Starts</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{summary.start_date}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Ends</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{summary.end_date}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Duration</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{daysLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-[30px] border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-6 shadow-[0_18px_60px_rgba(37,99,235,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Payment</p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Daily rate</span>
                  <span>₱{Number(summary.daily_rate).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Rental duration</span>
                  <span>{daysLabel}</span>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
                    <span>Total</span>
                    <span>₱{Number(summary.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateBooking}
                disabled={isLoading || paymentExpired}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
