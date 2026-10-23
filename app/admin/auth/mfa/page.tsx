"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-center text-lg tracking-[0.4em] text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

type Mode = "loading" | "enroll" | "verify" | "failed";

export default function AdminMfaPage() {
  const router = useRouter();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const started = useRef(false);

  // SysAdmin goes to the accounts page, Admin goes to the dashboard.
  async function goToDashboard(userId: string) {
    const { data: staff } = await supabase
      .from("staff_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    router.replace(staff?.role === "sysadmin" ? "/sysadmin/admins" : "/admin/dashboard");
    router.refresh();
  }

  useEffect(() => {
    if (started.current) return; // React strict mode runs effects twice in dev
    started.current = true;

    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        router.replace("/admin/auth/login");
        return;
      }

      // Already passed MFA in this session
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        await goToDashboard(user.id);
        return;
      }

      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        setError("Could not load two-step verification. Please sign in again.");
        setMode("failed");
        return;
      }

      // Has an authenticator already -> just ask for the code
      const verified = factors?.totp?.[0];
      if (verified) {
        setFactorId(verified.id);
        setMode("verify");
        return;
      }

      // First time: remove half-finished setups, then start a new one
      for (const f of factors?.all ?? []) {
        if (f.factor_type === "totp" && f.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "RentSpotPH Admin",
      });

      if (enrollError || !enrolled) {
        setError(enrollError?.message || "Could not start two-step setup.");
        setMode("failed");
        return;
      }

      setFactorId(enrolled.id);
      setQrCode(enrolled.totp.qr_code);
      setSecret(enrolled.totp.secret);
      setMode("enroll");
    }

    init();
  }, [supabase, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setSubmitting(true);

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (verifyError) {
      setError("That code is not correct. Try the newest code.");
      setCode("");
      setSubmitting(false);
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await goToDashboard(data.user.id);
    } else {
      router.replace("/admin/auth/login");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/auth/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-[0_12px_40px_rgba(50,50,93,0.08)]">
        {mode === "loading" && (
          <p className="text-center text-sm text-neutral-500">Loading...</p>
        )}

        {mode === "failed" && (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#2C3E50]">
              Something went wrong
            </h1>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              Back to login
            </button>
          </div>
        )}

        {(mode === "enroll" || mode === "verify") && (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#2C3E50]">
                {mode === "enroll" ? "Set up two-step verification" : "Enter your code"}
              </h1>
              <p className="text-sm text-neutral-600">
                {mode === "enroll"
                  ? "Scan this QR code with Google Authenticator or Authy, then type the 6-digit code it shows."
                  : "Open your authenticator app and type the 6-digit code."}
              </p>
            </div>

            {mode === "enroll" && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  {/* qr_code is an image data URL from Supabase */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="QR code for your authenticator app" className="h-44 w-44" />
                </div>
                <p className="break-all text-center text-xs text-neutral-500">
                  Can’t scan? Enter this key instead: <span className="font-mono">{secret}</span>
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="mfa-code"
                className="mb-2 block text-sm font-semibold text-neutral-700"
              >
                6-digit code
              </label>
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={inputClass}
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-lg bg-brand-500 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Checking..." : mode === "enroll" ? "Confirm" : "Verify"}
            </button>

            <button
              type="button"
              onClick={signOut}
              className="block w-full text-center text-sm text-neutral-500 transition-colors hover:text-neutral-700"
            >
              Use a different account
            </button>
          </form>
        )}
      </div>
    </main>
  );
}