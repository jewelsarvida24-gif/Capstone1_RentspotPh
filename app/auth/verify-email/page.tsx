"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, RefreshCw } from "lucide-react";
import { resendVerificationEmail } from "@/app/auth/action";

const RESEND_COOLDOWN = 60; // seconds
const RATE_LIMIT_COOLDOWN = 60; // seconds

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setStatus("sending");
    setMessage("");

    const result = await resendVerificationEmail(email);

    if (result.error) {
      setStatus("error");
      setMessage(result.error);
      setCooldown(result.rateLimited ? RATE_LIMIT_COOLDOWN : RESEND_COOLDOWN);
      return;
    }

    setStatus("sent");
    setMessage("Verification email sent again.");
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-14">
      <div className="card w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <Mail className="h-7 w-7 text-brand-600" />
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-800">
          Check your email
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          We sent a verification link to
          {email && (
            <>
              {" "}
              <span className="font-semibold text-neutral-700">{email}</span>
            </>
          )}
          . Click the link to verify your account.
        </p>

        {message && (
          <p
            className={`mt-4 text-sm ${
              status === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}

        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-7 flex w-full items-center justify-center"
        >
          Open Gmail
        </a>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || status === "sending" || !email}
          className="mt-3 flex w-full items-center justify-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 disabled:cursor-not-allowed disabled:text-neutral-400"
        >
          <RefreshCw
            className={`h-4 w-4 ${status === "sending" ? "animate-spin" : ""}`}
          />
          {cooldown > 0
            ? `Resend email in ${cooldown}s`
            : status === "sending"
              ? "Resending..."
              : "Didn't get it? Resend email"}
        </button>

        <p className="mt-6 text-xs text-neutral-400">
          Wrong email?{" "}
          <Link href="/auth/register" className="font-medium text-brand-600 hover:underline">
            Go back and register again
          </Link>
        </p>
      </div>
    </div>
  );
}