import { createAdminClient } from "@/lib/supabase_admin";
import { createClient } from "@/lib/supabase_server";

export async function getAdminApiUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const admin = createAdminClient();
  const { data: staff, error: staffError } = await admin
    .from("staff_roles")
    .select("role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    staffError ||
    !staff ||
    staff.status !== "active" ||
    !["admin", "sysadmin"].includes(staff.role)
  ) {
    return null;
  }

  const {
    data: assurance,
    error: assuranceError,
  } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError || assurance?.currentLevel !== "aal2") return null;

  return user;
}
