"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* HEADER / NAVBAR */}
     <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white shadow-sm">
  <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:py-5 lg:px-10">
          {/* LOGO */}
          <Link href="/" className="z-50 shrink-0">
            <img
              src="/Pics/logo.png"
              alt="RentSpotPH Logo"
              className="h-6 w-auto object-contain md:h-7"
            />
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-10 text-sm font-semibold md:flex">
            <Link
              href="#home"
              className="transition-colors hover:text-brand-600"
            >
              Home
            </Link>

            <a
              href="#browse"
              className="transition-colors hover:text-brand-600"
            >
              Browse
            </a>

            <a
              href="#why-rentspot"
              className="transition-colors hover:text-brand-600"
            >
              About Us
            </a>

            <a
              href="#contact"
              className="transition-colors hover:text-brand-600"
            >
              Contact Us
            </a>
          </div>

          {/* DESKTOP AUTH BUTTONS */}
          <div className="hidden items-center gap-4 text-sm font-bold md:flex">
            <Link
              href="/auth/login"
              className="px-5 py-2 transition-colors hover:text-brand-600"
            >
              Log in
            </Link>

            <Link
              href="/auth/register"
              className="rounded-full bg-brand-500 px-5 py-2 text-white transition-colors hover:bg-brand-600"
            >
              Sign up
            </Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            className="z-50 rounded-lg p-2 text-neutral-800 transition-colors hover:bg-neutral-100 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex h-screen flex-col gap-6 overflow-y-auto bg-white px-6 pt-24 md:hidden">
          <Link
            href=""
            onClick={closeMobileMenu}
            className="border-b border-neutral-200 pb-4 text-2xl font-bold"
          >
            Home
          </Link>

          <a
            href="#featured"
            onClick={closeMobileMenu}
            className="border-b border-neutral-200 pb-4 text-2xl font-bold"
          >
            Browse
          </a>

          <a
            href="#why-rentspot"
            onClick={closeMobileMenu}
            className="border-b border-neutral-200 pb-4 text-2xl font-bold"
          >
            About US
          </a>

          <a
            href="#contact"
            onClick={closeMobileMenu}
            className="border-b border-neutral-200 pb-4 text-2xl font-bold"
          >
            Contact Us
          </a>

          {/* MOBILE AUTH BUTTONS */}
          <div className="mt-8 flex flex-col gap-4">
            <Link
              href="/auth/login"
              onClick={closeMobileMenu}
              className="w-full rounded-xl border-2 border-neutral-800 py-4 text-center text-lg font-bold transition-colors hover:bg-neutral-50"
            >
              Log in
            </Link>

            <Link
              href="/auth/register"
              onClick={closeMobileMenu}
              className="w-full rounded-xl bg-brand-500 py-4 text-center text-lg font-bold text-white shadow-lg transition-colors hover:bg-brand-600"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

