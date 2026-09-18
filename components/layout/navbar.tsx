"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogOut, Menu, Settings, X } from "lucide-react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase_client";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsSettingsMenuOpen(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadAuthState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setIsAuthenticated(Boolean(user));
        setIsLoadingAuth(false);
      }
    };

    void loadAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (isMounted) {
        setIsAuthenticated(Boolean(session?.user));
        setIsLoadingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return;
    }
    setIsAuthenticated(false);
    window.location.replace('/');
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
            <Link href="/" className="transition-colors hover:text-brand-600">
              Home
            </Link>
            <Link href="/guest/browse" className="transition-colors hover:text-brand-600">
              Browse
            </Link>
            <Link href="/#why-rentspot" className="transition-colors hover:text-brand-600">
              About Us
            </Link>
            <span className="cursor-default transition-colors hover:text-brand-600">
              Contact Us
            </span>
          </div>

          {/* DESKTOP ACCOUNT ACTIONS */}
          {!isLoadingAuth && (
            <div className="hidden items-center gap-4 text-sm font-bold md:flex">
              {isAuthenticated ? (
                <div className="relative">
                  <button type="button" onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)} className="flex items-center gap-2 px-5 py-2 transition-colors hover:text-brand-600" aria-expanded={isSettingsMenuOpen}>
                    <Settings size={18} />
                    Settings
                  </button>
                  {isSettingsMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-2 text-sm font-medium shadow-lg">
                      <Link href="/settings?section=account" onClick={closeMobileMenu} className="block rounded-lg px-3 py-2.5 text-neutral-700 hover:bg-neutral-50">Account</Link>
                      <Link href="/settings?section=notifications" onClick={closeMobileMenu} className="block rounded-lg px-3 py-2.5 text-neutral-700 hover:bg-neutral-50">Notifications</Link>
                      <Link href="/settings?section=security" onClick={closeMobileMenu} className="block rounded-lg px-3 py-2.5 text-neutral-700 hover:bg-neutral-50">Security</Link>
                      <Link href="/renter/my-rentals" onClick={closeMobileMenu} className="block rounded-lg px-3 py-2.5 text-neutral-700 hover:bg-neutral-50">My Rentals</Link>
                      <div className="my-1 border-t border-neutral-100" />
                      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-red-600 hover:bg-red-50"><LogOut size={16} />Log out</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/auth/login" className="px-5 py-2 transition-colors hover:text-brand-600">Log in</Link>
                  <Link href="/auth/register" className="rounded-full bg-brand-500 px-5 py-2 text-white transition-colors hover:bg-brand-600">Sign up</Link>
                </>
              )}
            </div>
          )}

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
            href="/"
            onClick={closeMobileMenu}
            className="border-b border-neutral-200 pb-4 text-2xl font-bold"
          >
            Home
          </Link>
          <Link
            href="/guest/browse"
            onClick={closeMobileMenu}
            className="border-b border-neutral-200 pb-4 text-2xl font-bold"
          >
            Browse
          </Link>
          <Link
            href="/#why-rentspot"
            onClick={closeMobileMenu}
            className="border-b border-neutral-200 pb-4 text-2xl font-bold"
          >
            About US
          </Link>
          <span className="border-b border-neutral-200 pb-4 text-2xl font-bold">
            Contact Us
          </span>

          {/* MOBILE AUTH BUTTONS */}
          {!isLoadingAuth && (
            <div className="mt-8 flex flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <button type="button" onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-neutral-800 px-4 py-4 text-lg font-bold">
                    <Settings size={20} />Settings
                  </button>
                  {isSettingsMenuOpen && (
                    <div className="ml-4 flex flex-col gap-1 border-l-2 border-brand-200 pl-4">
                      <Link href="/settings?section=account" onClick={closeMobileMenu} className="py-2 text-base font-medium text-neutral-600">Account</Link>
                      <Link href="/settings?section=notifications" onClick={closeMobileMenu} className="py-2 text-base font-medium text-neutral-600">Notifications</Link>
                      <Link href="/settings?section=security" onClick={closeMobileMenu} className="py-2 text-base font-medium text-neutral-600">Security</Link>
                      <Link href="/renter/my-rentals" onClick={closeMobileMenu} className="py-2 text-base font-medium text-neutral-600">My Rentals</Link>
                      <button type="button" onClick={handleLogout} className="flex items-center gap-2 py-2 text-left text-base font-medium text-red-600"><LogOut size={18} />Log out</button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={closeMobileMenu} className="w-full rounded-xl border-2 border-neutral-800 py-4 text-center text-lg font-bold transition-colors hover:bg-neutral-50">Log in</Link>
                  <Link href="/auth/register" onClick={closeMobileMenu} className="w-full rounded-xl bg-brand-500 py-4 text-center text-lg font-bold text-white shadow-lg transition-colors hover:bg-brand-600">Sign up</Link>
                </>
              )}
            </div>
          )}
        </div>
      )}

    </>
  );
}
