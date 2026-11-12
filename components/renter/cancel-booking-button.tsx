"use client";

import { useState, useTransition } from "react";

import { cancelBooking } from "@/app/renter/my-rentals/actions";

export default function CancelBookingButton({
  bookingId,
  className,
}: {
  bookingId: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        setConfirming(false);
      }
      // On success the page revalidates and the ticket re-renders as Cancelled.
    });
  }

  if (!confirming) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${className ?? ""}`}
        >
          Cancel booking
        </button>
        {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={pending}
        className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Cancelling..." : "Yes, cancel"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Keep it
      </button>
    </div>
  );
}