<<<<<<< HEAD:app/auth/register/page.tsx
'use client';

import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-50 text-neutral-800">

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-neutral-50">
=======
"use client";

import Link from "next/link";

import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 text-neutral-800">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-neutral-50">
        {/* Grid */}
>>>>>>> origin/sarvida-pr:app/renter/auth/register/page.tsx
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `
              linear-gradient(#dfe5ec 1px, transparent 1px),
              linear-gradient(90deg, #dfe5ec 1px, transparent 1px)
            `,
<<<<<<< HEAD:app/auth/register/page.tsx
            backgroundSize: '72px 72px',
          }}
        />

        <div
          className="absolute -top-[260px] right-[5%] w-[700px] h-[700px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(239,68,68,0.08) 38%, transparent 72%)',
            filter: 'blur(30px)',
          }}
        />

        <div
          className="absolute bottom-[-220px] left-[5%] w-[550px] h-[550px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
            filter: 'blur(35px)',
          }}
        />

=======
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
>>>>>>> origin/sarvida-pr:app/renter/auth/register/page.tsx
        <div
          className="absolute inset-0"
          style={{
            background:
<<<<<<< HEAD:app/auth/register/page.tsx
              'radial-gradient(ellipse 55% 70% at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 45%, transparent 75%)',
=======
              "radial-gradient(ellipse 55% 70% at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 45%, transparent 75%)",
>>>>>>> origin/sarvida-pr:app/renter/auth/register/page.tsx
          }}
        />
      </div>

<<<<<<< HEAD:app/auth/register/page.tsx
      <main className="relative z-10 min-h-[calc(100vh-72px)] flex items-center justify-center">

        {/* Vertical dividers */}
        <div className="absolute left-[9%] top-0 bottom-0 border-l border-neutral-200" />
        <div className="absolute right-[9%] top-0 bottom-0 border-r border-neutral-200" />

        <div className="w-full max-w-xl relative z-10 mx-auto px-4 py-14 sm:py-16">

          <div className="shadow-[0_12px_40px_rgba(50,50,93,0.08)] rounded-2xl overflow-hidden">

            {/* Registration content */}
            <div className="bg-white p-8 sm:p-10">

                <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-[#6b7280] mb-7">
                  Create your account
                </h1>

            <RegisterForm />

            </div>

            {/* Footer */}
            <div className="bg-white border-t border-neutral-200 px-8 sm:px-10 py-4">
              <p className="text-center text-sm text-neutral-500">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-brand-600 font-medium hover:underline"
=======
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
                  href="/renter/auth/login"
                  className="font-medium text-brand-600 hover:underline"
>>>>>>> origin/sarvida-pr:app/renter/auth/register/page.tsx
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