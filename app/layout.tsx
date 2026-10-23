// app/layout.tsx
import type { Metadata } from 'next';
<<<<<<< HEAD
import { Inter } from 'next/font/google';
<<<<<<< HEAD
import '@/app/globals.css';
=======
=======
>>>>>>> origin/testing-v3
import './globals.css';
>>>>>>> origin/sarvida-pr

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
      <body className="antialiased">{children}</body>
    </html>
  );
}