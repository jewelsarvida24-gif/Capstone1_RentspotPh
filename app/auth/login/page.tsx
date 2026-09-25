"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase_client";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

function getFriendlyAuthError(message: string) {
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Incorrect email or password.";
  }

  if (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed")
  ) {
    return "Please verify your email before signing in.";
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return "Too many login attempts. Please try again later.";
  }

  return message || "Unable to sign in. Please try again.";
}

/* SAME BACKGROUND AS REGISTER PAGE */
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

function LoginPageContent() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showVerifiedOverlay, setShowVerifiedOverlay] = useState(
    searchParams.get("verified") === "true"
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setAuthError("");

    try {
      /* SIGN IN */
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setAuthError(getFriendlyAuthError(error.message));
        return;
      }

      /* GET CURRENT USER */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthError("Unable to retrieve your account.");
        return;
      }

      /* GET USER ROLE */
      const { data: profile, error: profileError } = await supabase
        .from("tbl_users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setAuthError("Unable to retrieve your account information.");
        return;
      }

      /* ROLE-BASED REDIRECT */
      if (profile?.role === "sysadmin") {
        router.replace("/sysadmin");
      } else if (profile?.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        /* RENTER */
        router.replace("/renter/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Something went wrong. Please try again.");
    }
  };

  return (

    
    <div className="min-h-screen relative overflow-hidden bg-neutral-50 text-neutral-800">
      {/* Background */}
      <BackgroundLayer />

      <main className="relative z-10 min-h-screen flex items-center justify-center">

                {/* EMAIL VERIFIED OVERLAY */}
        {showVerifiedOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
            <div className="card w-full max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-7 w-7 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-neutral-800">
                Email Verified
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Please proceed to log in.
              </p>

              <button
                type="button"
                onClick={() => setShowVerifiedOverlay(false)}
                className="btn-primary mt-6 w-full"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        
        {/* Card container */}
        <div className="w-full max-w-xl relative z-10 mx-auto px-4 py-14 sm:py-16">
          <div className="shadow-[0_12px_40px_rgba(50,50,93,0.08)] rounded-2xl overflow-hidden">

            {/* LOGIN CARD */}
            <div
              className="relative min-h-[430px] overflow-hidden bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/login-bg.png')",
              }}
            >
              {/* White overlay */}
              <div className="absolute inset-0 bg-white/70" />

              {/* Card content */}
              <div className="relative z-10 flex min-h-[430px] flex-col justify-center p-8 sm:p-10">
                <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-[#2C3E50] mb-7">
                  Sign in to your account
                </h1>

                {/* AUTH ERROR */}
                {authError && (
                  <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {authError}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* EMAIL */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-neutral-700 mb-2"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...register("email")}
                      className="
                        w-full
                        rounded-lg
                        border
                        border-neutral-300
                        bg-white
                        px-4
                        py-3
                        text-sm
                        text-neutral-900
                        placeholder:text-neutral-400
                        outline-none
                        transition-all
                        duration-200
                        focus:border-brand-500
                        focus:ring-2
                        focus:ring-brand-100
                      "
                    />

                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-neutral-700"
                      >
                        Password
                      </label>

                      <Link
                        href="/auth/forgot-password"
                        className="
                          text-sm
                          font-medium
                          text-brand-600
                          hover:text-brand-700
                          transition-colors
                        "
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        {...register("password")}
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

                    {errors.password && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* SIGN IN BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
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
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              </div>
            </div>

            {/* FOOTER */}
            <div className="bg-white border-t border-neutral-200 px-8 sm:px-10 py-4">
              <p className="text-center text-sm text-neutral-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-brand-600 font-medium hover:underline"
                >
                  Create one
                </Link>
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}