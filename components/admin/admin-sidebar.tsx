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
  { label: "Booking Management", href: "/dashboard/admin/bookings" },
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
    <aside className="flex h-full min-h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-6 py-6">
        <Link
          href={role === "admin" ? "/admin/dashboard" : "/sysadmin"}
          className="text-xl font-bold tracking-tight text-[#2C3E50]"
        >
          RentSpotPH
        </Link>

        <p className="mt-1 text-xs text-neutral-500">
          {role === "admin" ? "Admin Portal" : "System Administration"}
        </p>
      </div>

      <div className="border-b border-neutral-200 px-5 py-4">
        <p className="truncate text-sm font-semibold text-neutral-800">
          {fullName}
        </p>

        <span className="mt-1 inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium capitalize text-neutral-600">
          {role === "sysadmin" ? "SysAdmin" : "Admin"}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {role === "admin" ? "Operations" : "Administration"}
        </p>

        {items.map((item) => {
          const isActive =
            !item.disabled &&
            item.href !== undefined &&
            pathname === item.href;

          const classes = `block rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
            isActive
              ? "bg-green-50 text-green-800"
              : item.disabled
                ? "cursor-not-allowed text-neutral-400"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          }`;

          if (item.disabled) {
            return (
              <div key={item.label} className={classes}>
                {item.label}
                <span className="ml-2 text-xs font-normal">Soon</span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={classes}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}