'use client';

import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-50 text-neutral-800">

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-neutral-50">
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `
              linear-gradient(#dfe5ec 1px, transparent 1px),
              linear-gradient(90deg, #dfe5ec 1px, transparent 1px)
            `,
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

        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 70% at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 45%, transparent 75%)',
          }}
        />
      </div>

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