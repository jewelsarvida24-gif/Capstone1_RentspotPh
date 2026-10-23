import { requireStaff } from "@/lib/admin_guard";
import AdminDashboardShell from "@/components/admin/admin-dashboard-shell";
import Link from "next/link";

export default async function SysAdminDashboardPage() {
  const { staff } = await requireStaff(["sysadmin"]);

  return (
    <AdminDashboardShell
      role="sysadmin"
      fullName={staff.full_name}
      title="System Administration"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-[#2C3E50]">
            Welcome to System Administration
          </h2>

          <p className="mt-2 text-sm text-neutral-600">
            Manage staff access and system-level administration.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2C3E50]">
              Staff Management
            </h3>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Invite administrators and review staff account status.
            </p>

            <Link
              href="/sysadmin/admins"
              className="mt-5 inline-flex rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-800"
            >
              Manage Staff
            </Link>
          </article>

          <article className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2C3E50]">
              System Settings
            </h3>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              System-wide configuration and administrative controls.
            </p>

            <span className="mt-5 inline-flex rounded-lg bg-neutral-100 px-4 py-2.5 text-sm text-neutral-500">
              Coming Soon
            </span>
          </article>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="font-semibold text-[#2C3E50]">
            Administrative Access
          </h3>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            This portal is restricted to SysAdmin accounts.
            Rental operations, including KYC reviews, booking management,
            unit management, renter management, and the operational
            dashboard, are not available here.
          </p>
        </section>
      </div>
    </AdminDashboardShell>
  );
}