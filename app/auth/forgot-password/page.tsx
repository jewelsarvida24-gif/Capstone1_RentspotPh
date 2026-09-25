"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/action";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";

/* =========================================================
   STYLE CONSTANTS
========================================================= */

const BACKGROUND_STYLES = {
  grid: "linear-gradient(#dfe5ec 1px, transparent 1px), linear-gradient(90deg, #dfe5ec 1px, transparent 1px)",
  warmGlow:
    "radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(239,68,68,0.08) 38%, transparent 72%)",
  coolGlow:
    "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
  centerWash:
    "radial-gradient(ellipse 55% 70% at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 45%, transparent 75%)",
} as const;

/* =========================================================
   PRESENTATIONAL SUBCOMPONENTS
========================================================= */

function BackgroundLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-neutral-50">
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{ backgroundImage: BACKGROUND_STYLES.grid, backgroundSize: "72px 72px" }}
      />
      <div
        className="absolute -top-[260px] right-[5%] h-[700px] w-[700px] rounded-full"
        style={{ background: BACKGROUND_STYLES.warmGlow, filter: "blur(30px)" }}
      />
      <div
        className="absolute bottom-[-220px] left-[5%] h-[550px] w-[550px] rounded-full"
        style={{ background: BACKGROUND_STYLES.coolGlow, filter: "blur(35px)" }}
      />
      <div className="absolute inset-0" style={{ background: BACKGROUND_STYLES.centerWash }} />
    </div>
  );
}

function VerticalDivider({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`absolute ${side}-[9%] top-0 bottom-0 ${
        side === "left" ? "border-l" : "border-r"
      } border-[#e6ebf1]`}
    />
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-700 backdrop-blur-sm">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/* =========================================================
   FORM STATE (STEP 1 — REQUEST RESET LINK)
========================================================= */

function RequestResetForm({
  email,
  setEmail,
  error,
  loading,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: () => void;
}) {
  const canSubmit = !loading && email.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSubmit) {
      onSubmit();
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-[#2C3E50]">
          Reset your password
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-6 text-[#697386]">
          Enter your email address and we&apos;ll send you a secure link to
          reset your password.
        </p>
      </div>

      <div className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-semibold text-[#334155]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you@example.com"
            className="input-field"
            required
            autoComplete="email"
          />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold transition-all duration-200 ${
            canSubmit
              ? "bg-blue-600 text-white shadow-md hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-lg"
              : "cursor-not-allowed bg-blue-200 text-white opacity-60"
          }`}
        >
          <Mail className="h-4 w-4" />
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </div>

      <div className="mt-7 border-t border-neutral-200/70 pt-5">
        <p className="text-center text-sm text-neutral-500">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-brand-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}

/* =========================================================
   SUCCESS STATE (AFTER LINK IS SENT)
========================================================= */

function ResetLinkSentNotice({ email }: { email: string }) {
  return (
    <div className="py-5 text-center">

      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-[#2C3E50]">
        Check your email
      </h1>

      <p className="mx-auto mt-3 max-w-sm text-[14px] leading-6 text-[#697386]">
        We sent a password reset link to
      </p>

      <div className="mx-auto mt-3 w-full max-w-sm rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
        <p className="break-all text-sm font-semibold text-blue-700">{email}</p>
      </div>

      <p className="mx-auto mt-5 max-w-sm text-[14px] leading-6 text-[#697386]">
        Open the email and click{" "}
        <span className="font-semibold text-[#002D62]">Reset Password</span>{" "}
        to create your new password.
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await requestPasswordReset(email.trim());

      if (result.error) {
        setError(result.error);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 text-neutral-800">
      <BackgroundLayer />

      <main className="relative z-10 flex min-h-screen items-start justify-center px-4 pt-12 pb-10">
        <VerticalDivider side="left" />
        <VerticalDivider side="right" />

        <div className="relative w-full max-w-lg">
          {/* Soft shadow */}
          <div className="absolute -inset-1 rounded-[22px] bg-white/30 blur-xl" />

          <div className="relative overflow-hidden rounded-[20px] border border-white/70 bg-white/30 shadow-[0_20px_60px_rgba(50,50,93,0.12)] backdrop-blur-xl">
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/login-bg.png')" }}
            />
            <div className="absolute inset-0 bg-white/60" />

            <div className="relative z-10 px-7 py-9 sm:px-10 sm:py-11">
              {submitted ? (
                <ResetLinkSentNotice email={email} />
              ) : (
                <RequestResetForm
                  email={email}
                  setEmail={setEmail}
                  error={error}
                  loading={loading}
                  onSubmit={handleSubmit}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}