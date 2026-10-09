// lib/admin_guard.ts
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase_admin';
import { createClient } from '@/lib/supabase_server';

export type StaffRole = 'admin' | 'sysadmin';

/**
 * Server-side guard for admin pages and actions.
 * Usage:
 *   await requireStaff();              // any active admin or sysadmin
 *   await requireStaff(['sysadmin']);  // sysadmin only
 *
 * Sends the person away if they are:
 *   - not signed in
 *   - not in staff_roles, or not "active"
 *   - not allowed for this page's role
 *   - signed in without finishing MFA
 */
export async function requireStaff(
  allowedRoles: StaffRole[] = ['admin', 'sysadmin']
) {
  const supabase = await createClient();

  // 1. Signed in?
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/auth/login');

  // 2. Active staff with an allowed role?
  //    Uses the server-only admin client, so it does not depend on RLS policies.
  const adminSupabase = createAdminClient();
  const { data: staff } = await adminSupabase
    .from('staff_roles')
    .select('full_name, role, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (
    !staff ||
    staff.status !== 'active' ||
    !allowedRoles.includes(staff.role as StaffRole)
  ) {
    redirect('/admin/auth/login');
  }

  // 3. Passed MFA in this session?
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.currentLevel !== 'aal2') {
    // The MFA page handles both first-time setup (QR code) and entering the code.
    redirect('/admin/auth/mfa');
  }

  return { user, staff };
}