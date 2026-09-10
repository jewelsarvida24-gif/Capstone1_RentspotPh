// app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase_client';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

/* =========================
   BACKGROUND
========================= */

const BG_GRADIENTS = {
  grid:
    'linear-gradient(#dfe5ec 1px, transparent 1px), linear-gradient(90deg, #dfe5ec 1px, transparent 1px)',

  warmGlow:
    'radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(239,68,68,0.08) 38%, transparent 72%)',

  coolGlow:
    'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',

  centerWash:
    'radial-gradient(ellipse 55% 70% at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 45%, transparent 75%)',
};

const BackgroundLayer = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none bg-neutral-50">

    {/* Grid */}
    <div
      className="absolute inset-0 opacity-[0.45]"
      style={{
        backgroundImage: BG_GRADIENTS.grid,
        backgroundSize: '72px 72px',
      }}
    />

    {/* Warm glow */}
    <div
      className="absolute -top-[260px] right-[5%] w-[700px] h-[700px] rounded-full"
      style={{
        background: BG_GRADIENTS.warmGlow,
        filter: 'blur(30px)',
      }}
    />

    {/* Cool glow */}
    <div
      className="absolute bottom-[-220px] left-[5%] w-[550px] h-[550px] rounded-full"
      style={{
        background: BG_GRADIENTS.coolGlow,
        filter: 'blur(35px)',
      }}
    />

    {/* Center wash */}
    <div
      className="absolute inset-0"
      style={{
        background: BG_GRADIENTS.centerWash,
      }}
    />
  </div>
);

/* =========================
   VERTICAL DIVIDER
========================= */

const VerticalDivider = ({
  side,
}: {
  side: 'left' | 'right';
}) => (
  <div
    className={`absolute ${side}-[9%] top-0 bottom-0 ${
      side === 'left' ? 'border-l' : 'border-r'
    } border-neutral-200`}
  />
);

/* =========================
   LOGIN PAGE
========================= */

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    /* =========================
       ROLE-BASED REDIRECT
    ========================= */

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('tbl_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role === 'sysadmin') {
        router.push('/sysadmin');
      } else if (profile?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/renter/my-rentals');
      }

      router.refresh();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-50 text-neutral-800">

      {/* Background */}
      <BackgroundLayer />

      {/* Main content */}
      <main className="relative z-10 h-[calc(100vh-72px)] flex items-center justify-center">

        {/* Page-specific dividers */}
        <VerticalDivider side="left" />
        <VerticalDivider side="right" />

        {/* Login card */}
        <div className="w-full max-w-xl relative z-10 mx-auto px-4">

          <div className="shadow-[0_16px_50px_rgba(50,50,93,0.12)] rounded-2xl overflow-hidden">

            {/* Card content */}
            <div className="bg-white px-7 pt-7 pb-3 sm:px-8 sm:pt-8 sm:pb-3">

              <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-[#6b7280] mb-7">
                Sign in to your account
              </h1>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >

                {/* Server error */}
                {serverError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm italic">
                    {serverError}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    Email
                  </label>

                  <input
                    type="email"
                    {...register('email')}
                    placeholder="you@example.com"
                    className="input-field py-3"
                  />

                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1 italic">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    Password
                  </label>

                  <div className="relative">

                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="••••••••"
                      className="input-field py-3 pr-11"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                  </div>

                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1 italic">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-brand-600 hover:underline transition font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign in */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    !isSubmitting
                      ? 'bg-brand-500 text-white hover:bg-brand-600 cursor-pointer shadow-md hover:shadow-lg'
                      : 'bg-brand-200 text-white cursor-not-allowed opacity-60'
                  }`}
                >
                  <LogIn className="w-4 h-4" />

                  {isSubmitting
                    ? 'Signing in...'
                    : 'Sign In'}
                </button>

              </form>
            </div>

            {/* Card footer */}
            <div className="bg-white border-t border-neutral-200 px-8 sm:px-10 py-4">

              <p className="text-center text-sm text-neutral-500">
                Don&apos;t have an account?{' '}

                <Link
                  href="/auth/register"
                  className="text-brand-600 font-medium hover:underline transition"
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