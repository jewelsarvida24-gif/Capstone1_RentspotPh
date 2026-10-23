// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
<<<<<<< HEAD
import '@/app/globals.css';
=======
import './globals.css';
>>>>>>> origin/sarvida-pr

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
<<<<<<< HEAD
  title: 'WEBBERS — RentSpotPH',
=======
  title: 'RentSpotPH',
>>>>>>> origin/sarvida-pr
  description: 'Web-Based Equipment Booking and Rental Service System for RentSpotPH',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}