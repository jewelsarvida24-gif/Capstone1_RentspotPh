"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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

    await supabase.auth.signOut();
    setProfileOpen(false);
    router.replace("/auth/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_1px_6px_rgba(15,23,42,0.05)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center px-6 lg:px-10">

        {/* Logo */}
        <Link
          href="/renter/dashboard"
          className="shrink-0 text-xl font-bold tracking-tight text-blue-600 transition hover:text-blue-700"
        >
          RentSpotPH
        </Link>

        {/* Navigation */}
        <nav className="mx-auto hidden h-full items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/guest/browse" &&
                pathname.startsWith("/guest/browse"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex h-full items-center px-5 text-[15px] font-medium transition ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}

                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
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
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">

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
      </div>

      {/* Mobile Navigation */}
      <div className="border-t border-slate-100 md:hidden">
        <nav className="mx-auto flex max-w-[1280px] overflow-x-auto px-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/guest/browse" &&
                pathname.startsWith("/guest/browse"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}

                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

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
    </header>
  );
}