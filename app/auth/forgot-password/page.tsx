'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/auth/actions';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

const BG_GRADIENTS = {
  grid: 'linear-gradient(#dfe5ec 1px, transparent 1px), linear-gradient(90deg, #dfe5ec 1px, transparent 1px)',
  warmGlow:
    'radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(239,68,68,0.08) 38%, transparent 72%)',
  coolGlow:
    'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
  centerWash:
    'radial-gradient(ellipse 55% 70% at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 45%, transparent 75%)',
};

const BackgroundLayer = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#f8fafc]">
    <div
      className="absolute inset-0 opacity-[0.45]"
      style={{
        backgroundImage: BG_GRADIENTS.grid,
        backgroundSize: '72px 72px',
      }}
    />

    <div
      className="absolute -top-[260px] right-[5%] w-[700px] h-[700px] rounded-full"
      style={{
        background: BG_GRADIENTS.warmGlow,
        filter: 'blur(30px)',
      }}
    />

    <div
      className="absolute bottom-[-220px] left-[5%] w-[550px] h-[550px] rounded-full"
      style={{
        background: BG_GRADIENTS.coolGlow,
        filter: 'blur(35px)',
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        background: BG_GRADIENTS.centerWash,
      }}
    />
  </div>
);

const VerticalDivider = ({ side }: { side: 'left' | 'right' }) => (
  <div
    className={`absolute ${side}-[9%] top-0 bottom-0 border-${
      side === 'left' ? 'l' : 'r'
    } border-[#e6ebf1]`}
  />
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f6f9fc] text-[#425466]">
      <BackgroundLayer />

      <main className="relative z-10 min-h-[calc(100vh-72px)] flex items-center justify-center">
        <VerticalDivider side="left" />
        <VerticalDivider side="right" />

        <div className="w-full max-w-xl relative z-10 mx-auto px-4 py-14 sm:py-16">
          <div className="shadow-[0_16px_50px_rgba(50,50,93,0.12)] rounded-2xl overflow-hidden">

            {/* Card */}
            <div className="bg-white px-7 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-8">

              {!submitted ? (
                <>
                  {/* Heading */}
                  <div className="text-center mb-7">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>

                    <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-[#475569]">
                      Reset your password
                    </h1>

                    <p className="text-[15px] leading-6 text-[#697386] mt-2">
                      Enter your email and we&apos;ll send you a link to reset
                      your password.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Error */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-[#475569] mb-1">
                        Email
                      </label>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white border border-neutral-600 rounded-lg px-4 py-3 text-sm text-neutral-800 placeholder:italic placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition"
                        required
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading || !email}
                      className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                        !loading && email
                          ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-md hover:shadow-lg'
                          : 'bg-blue-200 text-white cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Mail className="w-4 h-4" />

                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              ) : (
                /* Success */
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  </div>

                  <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-[#475569]">
                    Check your email
                  </h1>

                  <p className="text-[15px] leading-6 text-[#697386] mt-2">
                    If an account exists for that email, we sent a password
                    reset link to:
                  </p>

                  <p className="text-[15px] font-semibold text-[#475569] mt-1 break-all">
                    {email}
                  </p>

                  <Link
                    href="/auth/login"
                    className="mt-7 w-full inline-flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Back to Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white/50 backdrop-blur-sm border-t border-[#e6ebf1]/70 px-8 sm:px-10 py-4">
              <p className="text-center text-[14px] text-[#697386]">
                Remember your password?{' '}
                <Link
                  href="/auth/login"
                  className="text-blue-600 font-medium hover:underline transition"
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