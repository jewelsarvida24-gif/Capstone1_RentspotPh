"use client";

<<<<<<< HEAD
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
=======
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase_client";
import RenterNavbar from "@/components/renter/renter-navbar";

const navLinks = [
  { id: "home", label: "Home", href: "/#home" },
  { id: "browse", label: "Browse", href: "/guest/browse" },
  { id: "faqs", label: "FAQs", href: "/#faqs" },
  { id: "contact", label: "Contact Us", href: "/#contact" },
];

export default function Navbar({ variant = "default" }: { variant?: "default" | "auth" }) {
  const pathname = usePathname();
  const isAuthVariant = variant === "auth";

  if (isAuthVariant) {
    return (
      <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 md:top-5">
        <nav aria-label="Account navigation" className="pointer-events-auto flex w-full max-w-4xl items-center justify-between gap-3 rounded-full border border-white/60 bg-white/80 px-4 py-2.5 text-slate-800 shadow-[0_10px_40px_-10px_rgba(37,99,235,0.28),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150 sm:px-6">
          <Link href="/" aria-label="RentSpotPH home" className="shrink-0">
            <img
              src="/images/rentspot-logo.png"
>>>>>>> origin/sarvida-pr
              alt="RentSpotPH Logo"
              className="h-auto w-[125px] object-contain sm:w-[155px] md:w-[180px]"
            />
          </Link>

<<<<<<< HEAD
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
=======
          <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold sm:gap-2 sm:text-sm">
            <Link
              href="/renter/auth/login"
              className="rounded-full px-3 py-2 text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 sm:px-4"
            >
              Log in
            </Link>
            <Link
              href="/renter/auth/register"
              className="rounded-full bg-blue-600 px-3.5 py-2 text-white shadow-sm transition-colors hover:bg-blue-700 sm:px-5"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>
    );
  }
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(() =>
    pathname.startsWith("/guest/browse") ? "browse" : "home"
  );
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountName, setAccountName] = useState<{ firstName?: string; lastName?: string }>({});

  // sliding highlight behind the active link
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  /* ---------- auth ---------- */
  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      setAuthLoaded(true);
      setIsAuthenticated(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user;
      setIsAuthenticated(Boolean(authUser));
      setAccountName({
        firstName: authUser?.user_metadata?.first_name,
        lastName: authUser?.user_metadata?.last_name,
      });
      setAuthLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ---------- highlight the section currently in view ---------- */
  useEffect(() => {
    if (pathname !== "/") return;

    const isAtPageBottom = () =>
      Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
    const handleScroll = () => {
      if (isAtPageBottom()) setActiveLink("contact");
    };

    const sections = navLinks
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isAtPageBottom()) {
          setActiveLink("contact");
          return;
        }
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [authLoaded, isAuthenticated, pathname]);

  /* ---------- keep route-based navigation highlight in sync ---------- */
  useEffect(() => {
    if (pathname.startsWith("/guest/browse")) setActiveLink("browse");
    else if (pathname === "/") setActiveLink((current) => current === "browse" ? "home" : current);
  }, [pathname]);

  /* ---------- measure the active link for the sliding pill ---------- */
  useEffect(() => {
    const el = linkRefs.current[activeLink];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    }
  }, [activeLink, authLoaded, isAuthenticated]);

  /* ---------- close mobile menu on Escape ---------- */
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMobileMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleLinkClick = (id: string) => setActiveLink(id);

  if (authLoaded && isAuthenticated) {
    return <RenterNavbar firstName={accountName.firstName} lastName={accountName.lastName} />;
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 md:top-5">
      {/* THE ISLAND */}
      <nav
        aria-label="Main"
        className={[
          "pointer-events-auto relative w-full overflow-hidden border border-white/50 bg-white/70 text-neutral-800 backdrop-blur-xl backdrop-saturate-150",
          "shadow-[0_10px_40px_-10px_rgba(37,99,235,0.28),0_2px_8px_rgba(0,0,0,0.06)]",
          "transition-[max-width,border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          isMobileMenuOpen ? "max-w-md rounded-[32px]" : "rounded-full",
          !isMobileMenuOpen && "max-w-[420px] md:max-w-[880px]",
        ].join(" ")}
      >
        {/* soft blue glow at the top edge */}
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* TOP ROW */}
        <div className="flex h-14 items-center justify-between gap-4 pl-5 pr-2 md:h-[60px] md:pl-6 md:pr-2.5">
          {/* LOGO */}
          <Link
            href="/"
            className="shrink-0"
            onClick={() => {
              handleLinkClick("home");
              closeMobileMenu();
            }}
          >
            <img
              src="/images/rentspot-logo.png"
              alt="RentSpotPH Logo"
              className="h-7 w-auto object-contain md:h-8"
            />
          </Link>

          {/* DESKTOP LINKS with sliding highlight */}
          <div className="relative hidden items-center text-sm font-semibold md:flex">
            <span
              aria-hidden
              className={`absolute inset-y-0 rounded-full bg-blue-600/10 transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
                indicator.ready ? "opacity-100" : "opacity-0"
              }`}
              style={{ left: indicator.left, width: indicator.width }}
            />
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                ref={(el) => {
                  linkRefs.current[link.id] = el;
                }}
                onClick={() => handleLinkClick(link.id)}
                className={`relative rounded-full px-4 py-2 transition-colors ${
                  activeLink === link.id ? "text-blue-600" : "text-neutral-800 hover:text-blue-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* DESKTOP AUTH */}
          <div className="hidden items-center gap-1 text-sm font-semibold md:flex">
            {authLoaded && !isAuthenticated && (
              <>
                <Link
                  href="/renter/auth/login"
                  className="rounded-full px-4 py-2 text-neutral-800 transition-colors hover:text-blue-600"
                >
                  Log in
                </Link>
                <Link
                  href="/renter/auth/register"
                  className="rounded-full bg-blue-600 px-5 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
>>>>>>> origin/sarvida-pr

          {/* MOBILE TOGGLE */}
          <button
            type="button"
<<<<<<< HEAD
            className="z-50 rounded-lg p-2 text-neutral-800 transition-colors hover:bg-neutral-100 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
=======
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-900/5 text-neutral-800 transition-colors hover:bg-neutral-900/10 md:hidden"
            onClick={() => setIsMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
>>>>>>> origin/sarvida-pr
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M4 5h16" />
                  <path d="M4 12h16" />
                  <path d="M4 19h16" />
                </>
              )}
            </svg>
          </button>
        </div>

<<<<<<< HEAD
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
=======
        {/* MOBILE PANEL — the island grows downward */}
        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none md:hidden ${
            isMobileMenuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div
              className={`flex flex-col gap-1 px-3 pb-4 pt-1 transition-opacity duration-300 ${
                isMobileMenuOpen ? "opacity-100 delay-150" : "pointer-events-none opacity-0"
              }`}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                  onClick={() => {
                    handleLinkClick(link.id);
                    closeMobileMenu();
                  }}
                  className={`rounded-2xl px-4 py-3 text-lg font-semibold transition-colors ${
                    activeLink === link.id
                      ? "bg-blue-600/10 text-blue-600"
                      : "text-neutral-800 hover:bg-white/60 hover:text-blue-600"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {authLoaded && !isAuthenticated && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/renter/auth/login"
                    tabIndex={isMobileMenuOpen ? 0 : -1}
                    onClick={closeMobileMenu}
                    className="rounded-2xl border-2 border-neutral-800 py-3 text-center font-semibold text-neutral-800 transition-colors hover:bg-white/60"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/renter/auth/register"
                    tabIndex={isMobileMenuOpen ? 0 : -1}
                    onClick={closeMobileMenu}
                    className="rounded-2xl bg-blue-600 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
>>>>>>> origin/sarvida-pr
  );
}
