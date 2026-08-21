import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentSpotPH | Find what fits your life",
  description: "Discover cameras, phones, and vehicles for your next project, trip, or everyday need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
