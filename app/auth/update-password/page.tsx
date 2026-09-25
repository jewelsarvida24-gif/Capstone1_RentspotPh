"use client";

import { FormEvent, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase_client";

import { Eye, EyeOff } from "lucide-react";

/* SAME BACKGROUND AS LOGIN PAGE */

function BackgroundLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-neutral-50">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `
            linear-gradient(#dfe5ec 1px, transparent 1px),
            linear-gradient(90deg, #dfe5ec 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
        }}
      />

      {/* Orange / Red glow */}
      <div
        className="absolute -top-[260px] right-[5%] w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(239,68,68,0.08) 38%, transparent 72%)",
          filter: "blur(30px)",
        }}
      />

      {/* Indigo glow */}
      <div
        className="absolute bottom-[-220px] left-[5%] w-[550px] h-[550px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
          filter: "blur(35px)",
        }}
      />

      {/* Center white wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 70% at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 45%, transparent 75%)",
        }}
      />
    </div>
  );
}

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function establishRecoverySession() {
      try {
        // First check whether Supabase already established a session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          console.log("Recovery session found.");
          setCheckingSession(false);
          return;
        }

        // If there is no session, check the URL hash
        const hash = window.location.hash;

        if (!hash) {
          setError("Password reset session is missing or expired.");
          setCheckingSession(false);
          return;
        }

        const params = new URLSearchParams(hash.substring(1));

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          setError("Password reset session is missing or invalid.");
          setCheckingSession(false);
          return;
        }

        // Create the Supabase session from the recovery tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Failed to establish session:", error);

          setError("Your password reset link is invalid or expired.");
          setCheckingSession(false);

          return;
        }

        console.log("Recovery session established.");

        setCheckingSession(false);
      } catch (err) {
        console.error("Recovery session error:", err);

        setError("Unable to establish password reset session.");
        setCheckingSession(false);
      }
    }

    establishRecoverySession();
  }, []);

  async function handleUpdatePassword(e: FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain an uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain a lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain a number.");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain a special character.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Make absolutely sure a session exists
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "Auth session is missing. Please request a new reset link."
        );

        return;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("Password update error:", error);

        setError(error.message);

        return;
      }

      setSuccess("Password updated successfully!");

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      console.error(err);

      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* SESSION CHECKING */

  if (checkingSession) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-neutral-50 text-neutral-800">
        <BackgroundLayer />

        <main className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="w-full max-w-xl relative z-10 mx-auto px-4 py-14 sm:py-16">
            <div className="shadow-[0_12px_40px_rgba(50,50,93,0.08)] rounded-2xl overflow-hidden">
              <div
                className="relative min-h-[300px] overflow-hidden bg-cover bg-center"
                style={{
                  backgroundImage: "url('/images/login-bg.png')",
                }}
              >
                {/* White overlay */}
                <div className="absolute inset-0 bg-white/10" />

                {/* Content */}
                <div className="relative z-10 flex min-h-[300px] flex-col items-center justify-center p-8 text-center sm:p-10">
                  <div className="mb-5 h-9 w-9 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-500" />

                  <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em] text-[#6b7280]">
                    Verifying reset link
                  </h1>

                  <p className="mt-2 text-sm text-neutral-500">
                    Please wait while we verify your password reset session.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-50 text-neutral-800">
      {/* Background */}
      <BackgroundLayer />

      <main className="relative z-10 min-h-screen flex items-center justify-center">
        {/* Card container */}
        <div className="w-full max-w-xl relative z-10 mx-auto px-4 py-14 sm:py-16">
          <div className="shadow-[0_12px_40px_rgba(50,50,93,0.08)] rounded-2xl overflow-hidden">

            {/* RESET PASSWORD CARD */}
            <div
              className="relative min-h-[500px] overflow-hidden bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/login-bg.png')",
              }}
            >
              {/* White overlay */}
              <div className="absolute inset-0 bg-white/20" />

              {/* Card content */}
              <div className="relative z-10 flex min-h-[500px] flex-col justify-center p-8 sm:p-10">

                {/* Heading */}
                <div className="mb-7">
                  <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-[#2C3E50]">
                    Reset your password
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-[#697386]">
                    Enter a new password below to secure your account.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={handleUpdatePassword}
                  className="space-y-5"
                >

                  {/* NEW PASSWORD */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-neutral-700 mb-2"
                    >
                      New Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your new password"
                        disabled={loading}
                        className="
                          w-full
                          rounded-lg
                          border
                          border-neutral-300
                          bg-white
                          px-4
                          py-3
                          pr-12
                          text-sm
                          text-neutral-900
                          placeholder:text-neutral-400
                          outline-none
                          transition-all
                          duration-200
                          focus:border-brand-500
                          focus:ring-2
                          focus:ring-brand-100
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="
                          absolute
                          right-3
                          top-1/2
                          -translate-y-1/2
                          text-neutral-400
                          hover:text-neutral-600
                          transition-colors
                        "
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-semibold text-neutral-700 mb-2"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={
                          showConfirmPassword ? "text" : "password"
                        }
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        placeholder="Confirm your new password"
                        disabled={loading}
                        className="
                          w-full
                          rounded-lg
                          border
                          border-neutral-300
                          bg-white
                          px-4
                          py-3
                          pr-12
                          text-sm
                          text-neutral-900
                          placeholder:text-neutral-400
                          outline-none
                          transition-all
                          duration-200
                          focus:border-brand-500
                          focus:ring-2
                          focus:ring-brand-100
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="
                          absolute
                          right-3
                          top-1/2
                          -translate-y-1/2
                          text-neutral-400
                          hover:text-neutral-600
                          transition-colors
                        "
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* UPDATE BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      w-full
                      py-3
                      rounded-lg
                      font-semibold
                      text-white
                      flex
                      items-center
                      justify-center
                      bg-brand-500
                      transition-all
                      duration-200
                      shadow-md
                      hover:bg-brand-600
                      hover:shadow-lg
                      hover:-translate-y-0.5
                      active:translate-y-0
                      active:scale-[0.98]
                      focus:outline-none
                      focus:ring-2
                      focus:ring-brand-500
                      focus:ring-offset-2
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>

            {/* FOOTER */}
            <div className="bg-white border-t border-neutral-200 px-8 sm:px-10 py-4">
              <p className="text-center text-sm text-neutral-500">
                Remember your password?{" "}
                <a
                  href="/auth/login"
                  className="text-brand-600 font-medium hover:underline"
                >
                  Sign in
                </a>
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}