"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type StaffRole = "admin" | "sysadmin";

type NavItem = {
  label: string;
  href?: string;
  disabled?: boolean;
};

const adminItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "KYC Management", href: "/admin/dashboard/kyc" },
  { label: "Booking Management", href: "/admin/dashboard/bookings" },
  { label: "Unit Management", href: "/dashboard/admin/units" },
  { label: "Renter Management", href: "/dashboard/admin/renters" },
  { label: "Activity Logs", href: "/dashboard/admin/activity-logs" },
  { label: "My Profile", href: "/admin/profile" },
];

const sysadminItems: NavItem[] = [
  { label: "Staff Management", href: "/sysadmin/admins" },
  { label: "Activity Logs", disabled: true },
  { label: "System Settings", disabled: true },
  { label: "My Profile", disabled: true },
];

const LAMP = "#3E7DBB";

// A small signal lamp: lit for the current page, dim for the rest.
function Lamp({ lit, color = LAMP }: { lit: boolean; color?: string }) {
  return (
    <span
      className="block h-3 w-3 shrink-0 rounded-full transition-all duration-300"
      style={
        lit
          ? {
              background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 45%, ${color} 100%)`,
              boxShadow: `0 0 0 2px ${color}, 0 0 12px ${color}88`,
            }
          : {
              background: `${color}14`,
              boxShadow: `0 0 0 2px ${color}40`,
            }
      }
      aria-hidden
    />
  );
}

export default function AdminSidebar({
  role,
  fullName,
}: {
  role: StaffRole;
  fullName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const items = role === "admin" ? adminItems : sysadminItems;
  const initial = fullName.trim().charAt(0).toUpperCase() || "A";

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.signOut();

    router.replace("/admin/auth/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full min-h-screen w-64 shrink-0 flex-col border-r border-[#A8C5E8]/50 bg-white text-[#102A4A]">
      {/* brand */}
      <div className="px-6 pb-5 pt-7">
        <Link
          href={role === "admin" ? "/admin/dashboard" : "/sysadmin"}
          aria-label="RentSpotPH home"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7DBB]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/rentspot-logo.png"
            alt="RentSpotPH Logo"
            className="h-auto w-full max-w-[170px] object-contain"
          />
        </Link>
      </div>

      {/* who is signed in */}
      <div className="mx-6 flex items-center gap-3 border-y border-[#A8C5E8]/50 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A8C5E8]/40 text-base font-semibold text-[#1F5C94]">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{fullName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {role === "sysadmin" ? "SysAdmin" : "Admin"}
          </p>
        </div>
      </div>

      {/* navigation */}
      <nav aria-label="Admin" className="mt-6 flex-1 px-6">
        <p className="mb-3 text-xs font-medium text-slate-400">
          {role === "admin" ? "Operations" : "Administration"}
        </p>

        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive =
              !item.disabled && item.href !== undefined && pathname === item.href;

            if (item.disabled) {
              return (
                <li key={item.label}>
                  <div className="flex cursor-not-allowed items-center gap-3 py-2.5 text-sm font-medium text-slate-300">
                    <Lamp lit={false} color="#A8C5E8" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-xs font-normal text-slate-400">Soon</span>
                  </div>
                </li>
              );
            }

            return (
              <li key={item.label}>
                <Link
                  href={item.href!}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex items-center gap-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7DBB] ${
                    isActive
                      ? "font-semibold text-[#102A4A]"
                      : "font-medium text-slate-500 hover:text-[#102A4A]"
                  }`}
                >
                  <Lamp lit={isActive} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* sign out */}
      <div className="mx-6 border-t border-[#A8C5E8]/50 py-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          <Lamp lit={false} color="#ff5d73" />
          Sign out
        </button>
      </div>
    </aside>
  );
}