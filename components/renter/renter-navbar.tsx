"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Menu, Settings, X } from "lucide-react";
import { createClient } from "@/lib/supabase_client";
import NotificationBell from "@/components/notifications/NotificationBell";

type Props = {
  firstName?: string;
  lastName?: string;
  needsVerification?: boolean;
};

export default function RenterNavbar({ firstName, lastName, needsVerification = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(Boolean(firstName || lastName));
  const [resolvedName, setResolvedName] = useState([firstName, lastName].filter(Boolean).join(" "));
  const displayName = resolvedName || "Renter";
  const navItems = [
    { label: "Dashboard", href: "/renter/dashboard" },
    { label: "My Rentals", href: "/renter/my-rentals" },
    { label: "Browse Units", href: "/guest/browse" },
  ];

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!active || !auth.user) return;
      const { data: profile } = await supabase
        .from("tbl_users")
        .select("first_name, last_name")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!active) return;
      setAuthenticated(true);
      setResolvedName(
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          auth.user.user_metadata?.full_name ||
          auth.user.email?.split("@")[0] ||
          "Renter",
      );
    };
    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    await createClient().auth.signOut();
    router.replace("/auth/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_1px_6px_rgba(15,23,42,0.05)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center px-6 lg:px-10">
        <Link href={authenticated ? "/renter/dashboard" : "/"} className="shrink-0 text-xl font-bold tracking-tight text-blue-600 transition hover:text-blue-700">
          RentSpotPH
        </Link>
        <nav className="mx-auto hidden h-full items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href === "/guest/browse" && pathname.startsWith("/guest/browse"));
            return <Link key={item.href} href={item.href} className={`relative flex h-full items-center px-5 text-[15px] font-medium transition ${active ? "text-blue-600" : "text-slate-600 hover:text-slate-900"}`}>
              {item.label}
              {active && <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-blue-600" />}
            </Link>;
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {authenticated && <NotificationBell />}
          {authenticated && <div className="relative hidden md:block">
            <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100" aria-expanded={settingsOpen}>
              <Settings size={18} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            {settingsOpen && <div className="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate font-semibold text-slate-900">{displayName}</p>
                {needsVerification && <p className="mt-1 text-xs text-red-500">Verification required</p>}
              </div>
              <Link href="/renter/profile" onClick={() => setSettingsOpen(false)} className="block px-4 py-3 text-slate-700 transition hover:bg-slate-50">Profile</Link>
              <Link href="/settings?section=notifications" onClick={() => setSettingsOpen(false)} className="block px-4 py-3 text-slate-700 transition hover:bg-slate-50">Notification settings</Link>
              <Link href="/settings?section=security" onClick={() => setSettingsOpen(false)} className="block px-4 py-3 text-slate-700 transition hover:bg-slate-50">Security</Link>
              <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-red-600 transition hover:bg-red-50"><LogOut size={16} />Log out</button>
            </div>}
          </div>}
          {authenticated && <button type="button" className="rounded-lg p-2 text-slate-700 md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Open account menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>}
        </div>
      </div>
      <nav className="border-t border-slate-100 md:hidden">
        <div className="mx-auto flex max-w-[1280px] overflow-x-auto px-4">
          {navItems.filter((item) => item.label !== "My Rentals").map((item) => <Link key={item.href} href={item.href} className={`whitespace-nowrap px-4 py-3 text-sm font-medium ${pathname === item.href ? "text-blue-600" : "text-slate-600"}`}>{item.label}</Link>)}
        </div>
      </nav>
      {mobileOpen && authenticated && <div className="border-t border-slate-100 bg-white px-6 py-4 md:hidden">
        <div className="rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate font-semibold text-slate-900">{displayName}</p>
            {needsVerification && <p className="mt-1 text-xs text-red-500">Verification required</p>}
          </div>
          <Link href="/renter/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-slate-700">Profile</Link>
          <Link href="/settings?section=notifications" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-slate-700">Notification settings</Link>
          <Link href="/settings?section=security" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-slate-700">Security</Link>
          <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-red-600"><LogOut size={16} />Log out</button>
        </div>
      </div>}
    </header>
  );
}
