import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="h-[72px] border-b border-[#e6ebf1] bg-white">
        <div className="h-full max-w-[1280px] mx-auto px-8 flex items-center">
          <Link href="/" className="flex items-center">
            <img
              src="/images/rentspot-logo.png"
              alt="RentSpot.ph"
              className="w-[180px] h-auto"
            />
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}