"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { id: "home", label: "Home", href: "/#home" },
  { id: "browse", label: "Browse", href: "/#browse" },
  { id: "faqs", label: "FAQs", href: "/#faqs" },
  { id: "contact", label: "Contact Us", href: "/#contact" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("home");

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLinkClick = (id: string) => {
    setActiveLink(id);
  };

  return (
    <>
      {/* HEADER / NAVBAR — glassmorphism */}
      <nav className="sticky top-0 z-50 border-b border-white/30 bg-white/60 shadow-sm backdrop-blur-lg backdrop-saturate-150">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:py-5 lg:px-10">
          {/* LOGO */}
          <Link
            href="/"
            className="z-50 shrink-0"
            onClick={() => handleLinkClick("home")}
          >
            <img
              src="/images/rentspot-logo.png"
              alt="RentSpotPH Logo"
              className="h-6 w-auto object-contain md:h-7"
            />
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-10 text-sm font-semibold md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => handleLinkClick(link.id)}
                className={`transition-colors hover:text-blue-600 ${
                  activeLink === link.id
                    ? "text-blue-600"
                    : "text-neutral-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* DESKTOP AUTH BUTTONS */}
          <div className="hidden items-center gap-4 text-sm font-bold md:flex">
            <Link
              href="/auth/login"
              className="px-5 py-2 text-neutral-800 transition-colors hover:text-blue-600"
            >
              Log in
            </Link>

            <Link
              href="/auth/register"
              className="rounded-full bg-blue-600 px-5 py-2 text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            className="z-50 rounded-lg p-2 text-neutral-800 transition-colors hover:bg-white/40 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU — glassy too, for consistency */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex h-screen flex-col gap-6 overflow-y-auto bg-white/70 px-6 pt-24 backdrop-blur-xl backdrop-saturate-150 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={() => {
                handleLinkClick(link.id);
                closeMobileMenu();
              }}
              className={`border-b border-neutral-200/60 pb-4 text-2xl font-bold transition-colors hover:text-blue-600 ${
                activeLink === link.id
                  ? "text-blue-600"
                  : "text-neutral-800"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* MOBILE AUTH BUTTONS */}
          <div className="mt-8 flex flex-col gap-4">
            <Link
              href="/auth/login"
              onClick={closeMobileMenu}
              className="w-full rounded-xl border-2 border-neutral-800 py-4 text-center text-lg font-bold transition-colors hover:bg-white/40"
            >
              Log in
            </Link>

            <Link
              href="/auth/register"
              onClick={closeMobileMenu}
              className="w-full rounded-xl bg-blue-600 py-4 text-center text-lg font-bold text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </>
  );
}