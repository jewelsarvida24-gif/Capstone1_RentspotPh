
// app/sysadmin/admins/page.tsx

import { requireStaff } from "@/lib/admin_guard";
import { createAdminClient } from "@/lib/supabase_admin";
import AdminDashboardShell from "@/components/admin/admin-dashboard-shell";
import {
  InviteAdminForm,
  ResendInviteButton,
} from "./AdminAccountsClient";

const roleLabel: Record<string, string> = {
  admin: "Admin",
  sysadmin: "SysAdmin",
};

const statusStyle: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  invited: "bg-amber-100 text-amber-700",
  disabled: "bg-neutral-200 text-neutral-600",
};

export default async function AdminAccountsPage() {
  // SysAdmin only, with an MFA-verified session.
  const { staff } = await requireStaff(["sysadmin"]);

  const adminSupabase = createAdminClient();

  // Fetch staff accounts.
  const { data: rows, error: rowsError } = await adminSupabase
    .from("staff_roles")
    .select("user_id, full_name, role, status, created_at")
    .order("created_at", { ascending: false });

  if (rowsError) {
    console.error("[ADMIN ACCOUNTS] Failed to fetch staff:", rowsError);
  }

  // staff_roles has no email column, so retrieve emails from Supabase Auth.
  const { data: usersPage, error: usersError } =
    await adminSupabase.auth.admin.listUsers({
      perPage: 200,
    });

  if (usersError) {
    console.error("[ADMIN ACCOUNTS] Failed to fetch auth users:", usersError);
  }

  const emailById = new Map(
    (usersPage?.users ?? []).map((user) => [
      user.id,
      user.email ?? "",
    ])
  );

  return (
    <AdminDashboardShell
      role="sysadmin"
      fullName={staff.full_name}
      title="Staff Management"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#2C3E50]">
            Admin Accounts
          </h2>

          <p className="mt-2 text-sm text-neutral-600">
            Invite administrators and manage staff account access.
          </p>
        </section>

        <div className="grid items-start gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <InviteAdminForm />

          <section className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 px-5 py-4">
              <h3 className="font-semibold text-[#2C3E50]">
                Staff Accounts
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                Review staff roles and invitation status.
              </p>
            </div>

            {rowsError || usersError ? (
              <div className="p-5 text-sm text-red-600">
                Some account information could not be loaded. Please refresh
                the page or check the server logs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="whitespace-nowrap px-5 py-3 font-medium">
                        Name
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 font-medium">
                        Email
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 font-medium">
                        Role
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 font-medium">
                        Status
                      </th>
                      <th className="px-5 py-3 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {(rows ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-neutral-500"
                        >
                          No staff accounts found. Send an invitation to add
                          an administrator.
                        </td>
                      </tr>
                    ) : (
                      (rows ?? []).map((row) => (
                        <tr
                          key={row.user_id}
                          className="border-b border-neutral-100 last:border-0"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-neutral-800">
                            {row.full_name}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-neutral-600">
                            {emailById.get(row.user_id) || "Unavailable"}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-neutral-600">
                            {roleLabel[row.role] ?? row.role}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                statusStyle[row.status] ??
                                statusStyle.disabled
                              }`}
                            >
                              {row.status === "invited"
                                ? "Invited"
                                : row.status === "active"
                                  ? "Active"
                                  : "Deactivated"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            {row.status === "invited" && (
                              <ResendInviteButton userId={row.user_id} />
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminDashboardShell>
  );
}