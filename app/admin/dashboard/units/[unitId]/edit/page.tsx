import UnitForm from "@/components/admin/unit-form";
import { createClient } from "@/lib/supabase_server";
import { notFound } from "next/navigation";

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const supabase = await createClient();
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

  return <UnitForm title="Edit rental unit" values={unit} />;
}
