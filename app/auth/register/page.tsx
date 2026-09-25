"use client";

import Link from "next/link";

import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 text-neutral-800">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-neutral-50">
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
          className="absolute -top-[260px] right-[5%] h-[700px] w-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(239,68,68,0.08) 38%, transparent 72%)",
            filter: "blur(30px)",
          }}
        />

        {/* Indigo glow */}
        <div
          className="absolute bottom-[-220px] left-[5%] h-[550px] w-[550px] rounded-full"
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

      <main className="relative z-10 flex min-h-screen items-center justify-center">
        {/* Vertical dividers */}
        <div className="absolute bottom-0 left-[9%] top-0 border-l border-neutral-200" />
        <div className="absolute bottom-0 right-[9%] top-0 border-r border-neutral-200" />

        {/* Card container */}
        <div className="relative z-10 mx-auto w-full max-w-xl px-4 py-14 sm:py-16">
          <div className="overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(50,50,93,0.08)]">

          
{/* REGISTER CARD */}
<div className="relative overflow-hidden">
  {/* Background image */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: "url('/images/login-bg.png')",
    }}
  />

  {/* Same white overlay as Login */}
  <div className="absolute inset-0 bg-white/70" />

  {/* Card content */}
  <div className="relative z-10 p-8 sm:p-10">
    <h1 className="mb-7 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[#2C3E50]">
      Create your account
    </h1>

    <RegisterForm />
  </div>
</div>

            {/* Footer */}
            <div className="border-t border-neutral-200 bg-white px-8 py-4 sm:px-10">
              <p className="text-center text-sm text-neutral-500">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-brand-600 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}