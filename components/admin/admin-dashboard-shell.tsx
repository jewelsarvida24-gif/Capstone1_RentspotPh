import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminHeader from "@/components/admin/admin-header";

type StaffRole = "admin" | "sysadmin";

export default function AdminDashboardShell({
  role,
  fullName,
  title,
  children,
}: {
  role: StaffRole;
  fullName: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 md:flex">
      <div className="hidden md:block">
        <AdminSidebar role={role} fullName={fullName} />
      </div>

      <div className="min-w-0 flex-1">
        <AdminHeader title={title} />

        <main className="px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}