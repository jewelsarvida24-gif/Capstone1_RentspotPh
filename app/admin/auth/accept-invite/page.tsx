"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { activateInvitedAdmin } from "@/app/sysadmin/admins/actions";

const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

type Stage = "checking" | "ready" | "invalid" | "done";

export default function AcceptInvitePage() {
  const router = useRouter();

  // Browser client that keeps the session in cookies, so the server action
  // (activateInvitedAdmin) can see who is signed in.
  // detectSessionInUrl is off because this page reads the link tokens itself.
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { isSingleton: false, auth: { detectSessionInUrl: false } }
      ),
    []
  );

  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // If the password saved but activation failed, a retry must not call
  // updateUser again (Supabase rejects reusing the same password).
  const [passwordSaved, setPasswordSaved] = useState(false);

  const started = useRef(false);

  // 1. Turn the email link into a session.
  useEffect(() => {
    if (started.current) return; // React strict mode runs effects twice in dev
    started.current = true;

    async function init() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      // Expired or already-used link: Supabase puts the error in the hash.
      if (hash.get("error") || hash.get("error_code")) {
        setStage("invalid");
        return;
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Remove the tokens from the address bar either way.
        window.history.replaceState(null, "", window.location.pathname);
        setStage(error ? "invalid" : "ready");
        return;
      }

      // No tokens in the URL (for example a page refresh after the first load):
      // continue only if the session from the link is still there.
      const { data } = await supabase.auth.getSession();
      setStage(data.session ? "ready" : "invalid");
    }

    init();
  }, [supabase]);

  // 2. Save the password, mark the admin active, send them to login.
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passwordSaved) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
      if (password !== confirm) {
        setError("The passwords do not match.");
        return;
      }
    }

    setSubmitting(true);

    if (!passwordSaved) {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || "Unable to set your password.");
        setSubmitting(false);
        return;
      }
      setPasswordSaved(true);
    }

    const result = await activateInvitedAdmin();
    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Sign out so they log in properly (password, then MFA setup) on the admin login.
    await supabase.auth.signOut();
    setStage("done");
    router.replace("/admin/auth/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_12px_40px_rgba(50,50,93,0.08)]">
        {stage === "checking" && (
          <p className="text-center text-sm text-neutral-500">Checking your invite...</p>
        )}

        {stage === "invalid" && (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#2C3E50]">
              This invite link can’t be used
            </h1>
            <p className="text-sm text-neutral-600">
              The link may have expired or already been used. Ask your SysAdmin to
              resend the invite, then open the newest email.
            </p>
            <a
              href="/admin/auth/login"
              className="inline-block text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              Go to admin login
            </a>
          </div>
        )}

        {stage === "done" && (
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#2C3E50]">
              Password set
            </h1>
            <p className="text-sm text-neutral-600">Taking you to the admin login...</p>
          </div>
        )}

        {stage === "ready" && (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#2C3E50]">
                Set your password
              </h1>
              <p className="text-sm text-neutral-600">
                Choose a password for your admin account. You’ll set up two-step
                verification the first time you log in.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!passwordSaved && (
              <>
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-semibold text-neutral-700"
                  >
                    New password
                  </label>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-semibold text-neutral-700"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Show passwords
                </label>
              </>
            )}

            {passwordSaved && (
              <p className="text-sm text-neutral-600">
                Your password is saved. Press the button to finish activating your account.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-lg bg-brand-500 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : passwordSaved
                ? "Finish activation"
                : "Set password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}