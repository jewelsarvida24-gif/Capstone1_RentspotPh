"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function AdminLoginPage() {
  const router = useRouter();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);

    // 1. Email + password
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError || !data.user) {
      setError("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    // 2. Must be an ACTIVE admin or sysadmin (renter accounts are turned away)
    const { data: staff } = await supabase
      .from("staff_roles")
      .select("role, status")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!staff || staff.status !== "active") {
      await supabase.auth.signOut();
      setError("This account does not have admin access.");
      setSubmitting(false);
      return;
    }

    // 3. MFA page handles both first-time setup (QR code) and entering the code
    router.replace("/admin/auth/mfa");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-[0_12px_40px_rgba(50,50,93,0.08)]"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#2C3E50]">
            Admin login
          </h1>
          <p className="text-sm text-neutral-600">
            Sign in with your admin email and password.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-neutral-700"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-neutral-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-lg bg-brand-500 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}