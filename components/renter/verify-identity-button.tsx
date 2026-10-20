"use client";

import { useState } from "react";
import { ShieldCheck, ArrowUpRight, X, Loader2 } from "lucide-react";

export default function VerifyIdentityButton({
  isDeclined = false,
}: {
  isDeclined?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  async function handleContinue() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/verification/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentedAt: new Date().toISOString() }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start verification");
      }

      window.location.href = data.url; // hand off to Didit's hosted flow
    } catch {
      setError("Something went wrong starting verification. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <ShieldCheck size={16} />
        {isDeclined ? "Try verification again" : "Verify identity"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Verify your identity
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  setAgreed(false);
                  setError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              You&apos;ll be redirected to{" "}
              <span className="font-medium text-slate-700">Didit</span>, our
              identity verification partner, to upload your ID and take a
              quick selfie. This usually takes under 2 minutes.
            </p>

            <div className="mt-4 max-h-40 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs leading-5 text-slate-500">
              <p className="font-semibold text-slate-700">
                Identity Verification Terms & Data Sharing
              </p>
              <p className="mt-1.5">
                By continuing, you authorize [Your Company Name] to share
                your uploaded government ID, selfie, and related personal
                information with Didit, our third-party identity
                verification provider, for the sole purpose of confirming
                your identity before you can book a rental.
              </p>
              <p className="mt-1.5">
                Didit processes this data on our behalf under its own privacy
                and security safeguards. We do not store copies of your ID
                images on our servers; we retain only the verification
                result (approved, declined, or in review).
              </p>
              <p className="mt-1.5">
                Identity verification is required to book rentals on this
                platform. You may still browse listings without completing
                verification, but you won&apos;t be able to confirm a
                booking until your identity is verified.
              </p>
              <p className="mt-1.5">
                Under the Philippine Data Privacy Act of 2012, you have the
                right to access, correct, and request deletion of your
                personal data, and to withdraw this consent at any time by
                contacting us. Withdrawing consent will prevent you from
                booking rentals until verification is completed again.
              </p>
            </div>

            <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-slate-100 p-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs leading-5 text-slate-600">
                I have read and agree to the terms above, and I consent to
                sharing my ID with Didit for identity verification.
              </span>
            </label>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setOpen(false);
                  setAgreed(false);
                  setError(null);
                }}
                className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleContinue}
                disabled={loading || !agreed}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowUpRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}