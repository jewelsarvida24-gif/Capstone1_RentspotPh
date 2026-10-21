import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UnitForm from "@/components/admin/unit-form";
import { createAdminClient } from "@/lib/supabase_admin";
import { notFound } from "next/navigation";

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const supabase = createAdminClient();
  const { data: unit, error } = await supabase
    .from("tbl_units")
    .select("*")
    .eq("unit_id", unitId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load rental unit ${unitId}: ${error.message}`);
  }

  if (!unit) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <Link
        href="/admin/dashboard/units"
        className="inline-flex items-center gap-2 rounded-full border border-[#A8C5E8] px-4 py-2.5 text-sm font-semibold text-[#1F5C94] transition hover:bg-[#A8C5E8]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7DBB]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Unit Management
      </Link>
      <UnitForm title="Edit rental unit" values={unit} />
    </div>
  );
}
