"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase_client";

type RenterNavbarProps = {
  firstName?: string;
  lastName?: string;
  needsVerification?: boolean;
};

export default function RenterNavbar({
  firstName,
  lastName,
  needsVerification = false,
}: RenterNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || "Renter";

  const navItems = [
    { label: "Dashboard", href: "/renter/dashboard" },
    { label: "My Rentals", href: "/renter/my-rentals" },
    { label: "Browse Units", href: "/guest/browse" },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);

    const supabase = createClient();
    if (!supabase) {
      setIsLoggingOut(false);
      router.replace("/auth/login");
      return;
    }

    await supabase.auth.signOut();
    setProfileOpen(false);
    router.replace("/auth/login");
  };

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 md:top-5">
        <nav aria-label="Renter navigation" className="pointer-events-auto relative w-full max-w-6xl rounded-full border border-white/60 bg-white/80 text-slate-800 shadow-[0_10px_40px_-10px_rgba(37,99,235,0.28),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Landing page logo, linked to the renter dashboard */}
          <Link href="/renter/dashboard" className="z-50 shrink-0">
            <img
              src="/images/rentspot-logo.png"
              alt="RentSpotPH Logo"
              className="h-auto w-[125px] object-contain sm:w-[155px] md:w-[180px]"
            />
          </Link>

          {/* Renter navigation */}
          <div className="hidden items-center gap-10 text-sm font-semibold md:flex">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/guest/browse" &&
                pathname.startsWith("/guest/browse"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-blue-600 ${
                  isActive
                    ? "text-blue-600"
                    : "text-neutral-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          </div>

          {/* Profile and mobile menu controls */}
          <div className="flex items-center gap-2">
          <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-white/40"
          >
            <span className="hidden sm:block">{displayName}</span>

            <span className="relative">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {displayName.charAt(0).toUpperCase()}
              </span>

              {needsVerification && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"
                  aria-label="Action required"
                />
              )}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">

              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  Renter Account
                </p>
              </div>

              <Link
                href="/renter/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <span>Profile</span>

                {needsVerification && (
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                )}
              </Link>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setShowConfirm(true);
                }}
                className="block w-full px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          )}
          </div>
          <button
            type="button"
            className="z-50 rounded-lg p-2 text-neutral-800 transition-colors hover:bg-white/40 md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
          </div>
        </div>
        </nav>
      </header>

      {/* Landing-style mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex h-screen flex-col gap-6 overflow-y-auto bg-white/90 px-6 pt-24 backdrop-blur-xl backdrop-saturate-150 md:hidden">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/guest/browse" &&
                pathname.startsWith("/guest/browse"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`border-b border-neutral-200/60 pb-4 text-2xl font-bold transition-colors hover:text-blue-600 ${
                  isActive
                    ? "text-blue-600"
                    : "text-neutral-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/renter/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="border-b border-neutral-200/60 pb-4 text-2xl font-bold text-neutral-800 transition-colors hover:text-blue-600"
          >
            Profile
          </Link>
        </div>
      )}

      {/* LOGOUT CONFIRMATION — rendered via portal so it isn't
          confined by the header's backdrop-blur containing block */}
      {mounted &&
        showConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <LogOut className="h-7 w-7 text-red-600" />
              </div>

              <h2 className="text-xl font-semibold text-slate-900">
                Log out?
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                You'll need to sign in again to access your account.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-lg border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}