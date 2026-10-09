"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function getManilaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '2000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function getEarliestBookingDate() {
  const [year, month, day] = getManilaDateString().split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}


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
  pickup_date: string | null;
  rental_days: number;
  daily_rate: number;
  total_amount: number;
};

function BookingPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const unitId = params.get('unit_id') ?? '';
  const startDate = params.get('start_date') ?? '';
  const endDate = params.get('end_date') ?? '';
  const pickupDate = params.get('pickup_date') ?? '';
  const earliestBookingDate = useMemo(() => getEarliestBookingDate(), []);
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
  const [agreementError, setAgreementError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingSignatureRef = useRef(false);
  const [receipt, setReceipt] = useState<null | {
    booking_id: string;
    unit: string | null;
    start_date: string;
    end_date: string;
    pickup_date: string | null;
    rental_days: number | null;
    daily_rate: number | null;
    total_amount: number | null;
    payment_method: string | null;
    payment_status: string | null;
    booking_status: string | null;
  }>(null);

  const agreementReady = agreementAccepted && Boolean(signatureData);

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

    if (startDate < earliestBookingDate) {
      setSummary(null);
      setError('Bookings must be made at least one day ahead. Please choose tomorrow or a later date.');
      return;
    }

    async function fetchSummary() {
      setError(null);
      setCheckoutUrl(null);

      try {
        const response = await fetch(
          `/api/bookings/summary?unit_id=${encodeURIComponent(unitId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&pickup_date=${encodeURIComponent(pickupDate)}`
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
  }, [unitId, startDate, endDate, pickupDate, bookingId, paymentStatus, earliestBookingDate]);

  useEffect(() => {
    // The booking is created only when the renter proceeds to PayMongo.
    // Do not expire the form while the renter is still reviewing/signing the agreement.
    if (!bookingId || paymentStatus) {
      setTimeLeft('');
      setPaymentExpired(false);
      return;
    }

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
  }, [bookingCreatedAt, bookingId, paymentStatus]);


  const daysLabel = useMemo(() => {
    if (!summary) return '0';
    return `${summary.rental_days} day${summary.rental_days === 1 ? '' : 's'}`;
  }, [summary]);

  const agreementDate = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };

  const startSignature = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;

    const point = getCanvasPoint(event);
    context.strokeStyle = '#0f172a';
    context.fillStyle = '#0f172a';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(point.x, point.y);
    isDrawingSignatureRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    setAgreementError(null);
  };

  const drawSignature = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignatureRef.current) return;
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const point = getCanvasPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishSignature = () => {
    if (!isDrawingSignatureRef.current) return;
    isDrawingSignatureRef.current = false;
    setSignatureData(signatureCanvasRef.current?.toDataURL('image/png') ?? null);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
    setAgreementError(null);
  };

  const handleCreateBooking = async () => {
    if (!agreementReady) {
      setAgreementOpen(true);
      return;
    }

    if (paymentExpired) {
      return;
    }

    if (!summary) {
      setError('Please select a valid unit and rental dates.');
      return;
    }

    if (summary.start_date < earliestBookingDate) {
      setError('Bookings must be made at least one day ahead. Please choose tomorrow or a later date.');
      return;
    }

    if (!summary.pickup_date) {
      setError('A pickup date is required. Return to the unit details page and select one.');
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
          pickup_date: summary.pickup_date,
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
    const validationErrors: string[] = [];

    if (!agreementAccepted) {
      validationErrors.push('Check the agreement box to confirm you agree to the terms.');
    }
    if (!signatureData) {
      validationErrors.push('Add your signature before continuing.');
    }
    if (validationErrors.length) {
      setAgreementError(validationErrors.join(' '));
      return;
    }

    setAgreementError(null);
    setAgreementOpen(false);
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
            {paymentStatus === 'success' ? 'Booking confirmation' : paymentStatus === 'under_review' ? 'Booking under review' : paymentStatus === 'confirmed' ? 'Booking confirmed' : paymentStatus === 'cancelled' ? 'Payment cancelled' : 'Booking summary'}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            {paymentStatus === 'success' ? 'Your booking is awaiting Admin review' : paymentStatus === 'under_review' ? 'Your booking is being reviewed' : paymentStatus === 'confirmed' ? 'Booking confirmed' : paymentStatus === 'cancelled' ? 'Payment cancelled' : 'Confirm your rental'}
          </h1>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {agreementOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-sm sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setAgreementOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="rental-agreement-title"
              className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#D7E5F4] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.3)]"
            >
              <header className="relative shrink-0 border-b border-[#D5E6FA] bg-gradient-to-r from-blue-50 via-white to-sky-50 px-5 py-5 sm:px-8 sm:py-6">
                <button
                  type="button"
                  onClick={() => setAgreementOpen(false)}
                  aria-label="Close rental agreement"
                  className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D7E5F4] bg-white text-2xl leading-none text-[#405671] shadow-sm transition hover:border-[#B9CDE5] hover:bg-[#F2F7FF] hover:text-[#14263D] sm:right-6 sm:top-5"
                >
                  ×
                </button>
                <div className="pr-12 sm:pr-14">
                  <h2 id="rental-agreement-title" className="text-xl font-bold uppercase tracking-[0.12em] text-blue-600 sm:text-2xl">
                    REVIEW RENTAL AGREEMENT
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#30445D] sm:text-[15px]">
                    Please review the agreement before signing.
                  </p>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-7 overflow-y-auto bg-[#F6FAFF] px-4 py-5 sm:px-8 sm:py-7">
                <section aria-label="Rental agreement terms" className="space-y-3">
                    <article className="rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5">
                      <h4 className="text-sm font-bold text-[#14263D] sm:text-base">01 · Parties to the Agreement</h4>
                      <p className="mt-2 text-sm leading-7 text-[#30445D]">This Rental Agreement is between Anaclette Julia Lincallo and John Paulo Amponin (&quot;OWNERS&quot;) and the person signing this agreement (&quot;RENTER&quot;). The RENTER agrees to all of the terms and conditions of this Agreement and also acknowledges that all of the details indicated on the first page are correct.</p>
                    </article>

                    <article className="rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5">
                      <h4 className="text-sm font-bold text-[#14263D] sm:text-base">02 · Condition of Rental Unit</h4>
                      <p className="mt-2 text-sm leading-7 text-[#30445D]">The OWNERS assure the RENTER that the rented unit was inspected thoroughly before pick up and is in good condition. Meanwhile, it is the responsibility of the RENTER to inspect the rented unit for any damage or issues within an hour from the moment the RENTER receives the unit. Customer failure to notify the OWNERS of any defects or problems within an hour of receipt shall be conclusively deemed as an acknowledgment that all units have passed customer approval and everything is in good working order.</p>
                    </article>

                    <article className="rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5">
                      <h4 className="text-sm font-bold text-[#14263D] sm:text-base">03 · Reservation/Security Fee and Rescheduling Policy</h4>
                      <p className="mt-2 text-sm leading-7 text-[#30445D]">The RENTER agrees to settle a reservation/security fee of PHP 300 which is refundable upon the safe and on-time return of the rented unit. If you wish to reschedule your booking date, we will allow it once and only if the date that you prefer to move your rental booking date is still available.</p>
                    </article>

                    <article className="rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5">
                      <h4 className="text-sm font-bold text-[#14263D] sm:text-base">04 · Cancellation Policy</h4>
                      <p className="mt-2 text-sm leading-7 text-[#30445D]">If the RENTER chooses to cancel the rental booking before the scheduled rental date regardless of the reason, the reservation fee will be forfeited in favor of the OWNERS. Cancellations made 1-3 days prior to the start of the rental period, regardless of the reason, will incur a cancellation/penalty fee equivalent to 30% of the total rental fee. This cancellation fee is in addition to the forfeited reservation fee and serves to compensate the OWNERS for a portion of the revenue loss due to short-notice cancellation. As much as possible, the OWNERS wish to avoid imposing this fee and strongly encourage the RENTER to inform the OWNERS as far in advance as possible if a cancellation becomes necessary. This advance notice allows for a more flexible arrangement and the potential for the reserved dates to be rebooked by other clients.</p>
                    </article>

                    <article className="rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5">
                      <h4 className="text-sm font-bold text-[#14263D] sm:text-base">05 · Return Condition and Late Fees</h4>
                      <p className="mt-2 text-sm leading-7 text-[#30445D]">The RENTER agrees to return the rented unit and all its accessories on the agreed date and time, in the same condition the RENTER received it. It is agreed that in the event of a late return, the RENTER will settle late fees as indicated on the booking confirmation details sent to the RENTER&apos;S Facebook or Instagram account.</p>
                    </article>

                    <article className="rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5">
                      <h4 className="text-sm font-bold text-[#14263D] sm:text-base">06 · Knowledge and Proper Use of Unit</h4>
                      <p className="mt-2 text-sm leading-7 text-[#30445D]">It is understood and agreed that the RENTER is familiar with the rented unit and knowledgeable about its proper use. The RENTER acknowledges that they are responsible for operating the unit correctly, and the OWNERS will not be held liable if the RENTER is unable to use the unit due to a lack of understanding or skill. The RENTER agrees not to break, cover, alter, or deface any of the accessories or the unit itself.</p>
                    </article>

                    <article className="rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5">
                      <h4 className="text-sm font-bold text-[#14263D] sm:text-base">07 · Responsibility for Damage</h4>
                      <p className="mt-2 text-sm leading-7 text-[#30445D]">From the moment the rented unit and all accessories are in the RENTER&apos;S physical possession, safekeeping thereof shall be the RENTER&apos;s responsibility. The RENTER is responsible for any damage, loss, misuse, or theft of the rented unit, including damage or loss caused by acts of nature or other individuals in the RENTER&apos;s surroundings, whether or not the RENTER is at fault. Any loss or damages incurred or discovered once the unit has come into the RENTER&apos;s possession, including those identified by the OWNERS within 24 hours of the unit&apos;s return, shall be borne solely by the RENTER. In the event of damage, the RENTER agrees to either cover the cost of repairs, pay the equivalent value of the unit, or replace it with a brand-new or well-conditioned second-hand unit of the same type.</p>
                    </article>

                    <article className="rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5">
                      <h4 className="text-sm font-bold text-[#14263D] sm:text-base">08 · Procedure for Repair</h4>
                      <p className="mt-2 text-sm leading-7 text-[#30445D]">If the Unit is damaged, the RENTER must notify the OWNERS immediately. The RENTER may seek repair shop options; however, any repair arrangements must be discussed with and approved by the OWNERS. The RENTER shall not attempt to repair the Unit without prior written consent from the OWNERS. The RENTER is required to pay the full cost of the repair.</p>
                    </article>

                    <article className="rounded-2xl border border-[#CFE0F5] border-l-4 border-l-[#6E9CF7] bg-white p-4 shadow-[0_4px_18px_rgba(24,60,110,0.05)] sm:p-5">
                      <h4 className="text-sm font-bold text-[#14263D] sm:text-base">09 · Refund of Security Fee</h4>
                      <p className="mt-2 text-sm leading-7 text-[#30445D]">The reservation/security fee will be refunded only if the rented unit has been returned on time and after the unit has been inspected and tested by the OWNERS to assure that nothing has been lost or damaged and all pending invoices have been paid. If any additional charges exceed the amount of the security fee the RENTER will be liable for the additional amount. The RENTER&apos;s face will not be publicly displayed or posted on any social media platforms or other public groups, except in circumstances where it becomes necessary for the recovery of the unit, such as in cases of failure to return the unit or other significant breach of the rental agreement terms. The RENTER acknowledges and consents to the use of their photograph or screenshots of social media accounts in such exceptional circumstances as part of this agreement.</p>
                    </article>
                </section>

                <section aria-labelledby="agreement-acknowledgment-heading" className="space-y-4 rounded-2xl border border-[#CFE0F5] bg-[#FCFDFF] p-4 sm:p-6">
                  <div>
                    <h3 id="agreement-acknowledgment-heading" className="text-lg font-bold text-[#0C1B2E]">Accept &amp; sign</h3>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-[#D5E6FA] bg-[#EEF5FF] p-4 text-sm leading-6 text-[#243952] transition hover:border-blue-200">
                    <input
                      type="checkbox"
                      required
                      checked={agreementAccepted}
                      onChange={(event) => {
                        setAgreementAccepted(event.target.checked);
                        setAgreementError(null);
                      }}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-[#B9CDE5] text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">I have read and agree to the Rental Agreement Terms and Conditions.</span>
                  </label>

                  <div className="rounded-xl border border-[#CFE0F5] bg-white p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-[#14263D]">Your signature <span className="text-rose-600">*</span></h4>
                        <p className="mt-1 text-sm text-[#405671]">Sign inside the box using your mouse, trackpad, or touchscreen.</p>
                      </div>
                      {signatureData && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><span aria-hidden="true">✓</span> Signature captured</span>}
                    </div>
                    <canvas
                      ref={signatureCanvasRef}
                      width={1000}
                      height={220}
                      aria-label="Sign here using your mouse or touchscreen"
                      onPointerDown={startSignature}
                      onPointerMove={drawSignature}
                      onPointerUp={finishSignature}
                      onPointerCancel={finishSignature}
                      className="mt-4 h-36 w-full touch-none rounded-xl border border-dashed border-[#9EB9DD] bg-[#FBFDFF]"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-[#405671]">Please make sure your signature is visible before continuing.</p>
                      <button type="button" onClick={clearSignature} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-[#EEF5FF] hover:text-blue-900">Clear signature</button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#F2F7FF] px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#405671]">Signing party</p>
                      <p className="mt-1 text-sm font-semibold text-[#14263D]">Renter</p>
                    </div>
                    <div className="rounded-xl bg-[#F2F7FF] px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#405671]">Date</p>
                      <p className="mt-1 text-sm font-semibold text-[#14263D]">{agreementDate}</p>
                    </div>
                  </div>

                  {agreementError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium leading-6 text-rose-800">{agreementError}</p>}
                </section>
              </div>

              <footer className="shrink-0 border-t border-[#D7E5F4] bg-white px-4 py-4 sm:px-8">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAgreementSubmit}
                    disabled={!agreementAccepted || !signatureData}
                    className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-[#D3DFF0] disabled:text-[#52647D] sm:w-auto"
                  >
                    Accept &amp; Continue
                  </button>
                </div>
              </footer>
            </section>
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
          <div className="overflow-hidden rounded-[32px] border border-amber-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.05)]">
            <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Booking confirmation</p>
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Booking ID: {bookingId}
                </span>
              </div>
            </div>
            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">Your booking is awaiting Admin review</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  You have returned from PayMongo checkout. The payment status shown by RentSpotPH may remain pending until it is verified by the system.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
                <p className="font-semibold">Admin review schedule</p>
                <p className="mt-2">Booking approval and rejection decisions are processed daily at <strong>11:00 AM and 8:00 PM Philippine Time (PHT)</strong>.</p>
                <p className="mt-2">Your booking is not yet approved. Completing checkout does not guarantee booking approval.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Booking information</p>
                <div className="mt-3 space-y-2">
                  <p><span className="font-medium text-slate-600">Booking ID:</span> {bookingId}</p>
                  <p><span className="font-medium text-slate-600">Booking status:</span> {receipt?.booking_status ?? 'Pending Admin Review'}</p>
                  <p><span className="font-medium text-slate-600">Payment status:</span> {receipt?.payment_status ?? 'Awaiting verification'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => router.push('/renter/dashboard')} className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">View Dashboard</button>
                <button type="button" onClick={handleDone} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Browse More Units</button>
              </div>
              <p className="text-xs leading-5 text-slate-500">Presentation note: if PayMongo webhooks/payment verification have not been implemented, this return page is not proof that the payment was verified in the database.</p>
            </div>
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
                  Your rental request is waiting for Admin review. Decisions are processed daily at 11:00 AM and 8:00 PM Philippine Time (PHT).
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
                Demo Only: Simulate Admin Review
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
                    This is a demo-only Admin decision state. In the live flow, this status should appear only after an actual Admin approval.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                  Demo state only. Check the recorded payment status separately; this screen does not verify payment.
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
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Payment status: {receipt?.payment_status ?? 'Unverified'}</span>
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
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Pickup date</p>
                      <p className="mt-1 font-semibold text-slate-900">{receipt?.pickup_date ?? '—'}</p>
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

                <div className="mt-8 grid gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Starts</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{summary.start_date}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Ends</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{summary.end_date}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Pickup</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{summary.pickup_date ?? 'Not selected'}</p>
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

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <p className="font-semibold">Admin review schedule</p>
                <p className="mt-1">Approval and rejection decisions are processed daily at <strong>11:00 AM and 8:00 PM Philippine Time (PHT)</strong>. Payment does not guarantee booking approval.</p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{agreementReady ? 'Rental agreement completed' : 'Step 1 · Rental agreement'}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{agreementReady ? 'Your agreement is ready. Continue when you are ready to pay.' : 'Review the agreement, accept the terms, and sign before proceeding to payment.'}</p>
                <button
                  type="button"
                  onClick={() => setAgreementOpen(true)}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  {agreementReady ? 'Review Agreement' : 'Review & Sign Rental Agreement'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreateBooking}
                disabled={isLoading || paymentExpired || !agreementReady}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-[#D3DFF0] disabled:text-[#52647D]"
              >
                {isLoading ? 'Opening checkout...' : agreementReady ? 'Proceed to Payment' : 'Accept & Sign to Continue'}
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

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfdff] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">Loading booking details...</div>}>
      <BookingPageContent />
    </Suspense>
  );
}
