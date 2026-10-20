import { requireStaff } from "@/lib/admin_guard";
import AdminDashboardShell from "@/components/admin/admin-dashboard-shell";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { staff } = await requireStaff(["admin"]);

  return (
    <AdminDashboardShell
      role="admin"
      fullName={staff.full_name}
      title="Admin Dashboard"
    >
      {children}
    </AdminDashboardShell>
  );
}