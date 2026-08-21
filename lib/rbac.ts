import type { SupabaseClient } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'admin' | 'sysadmin';

export async function getUserRole(supabase: SupabaseClient): Promise<UserRole | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from('tbl_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role as UserRole;
}

export async function requireRole(supabase: SupabaseClient, allowedRoles: UserRole[]): Promise<UserRole> {
  const role = await getUserRole(supabase);
  if (!role || !allowedRoles.includes(role)) {
    throw new Error('Unauthorized');
  }
  return role;
}
