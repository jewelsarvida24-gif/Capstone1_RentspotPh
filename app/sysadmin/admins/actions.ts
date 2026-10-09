// app/sysadmin/admins/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/lib/admin_guard';
import { createAdminClient } from '@/lib/supabase_admin';
import { createClient } from '@/lib/supabase_server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';

// Where the invite email link lands. Whitelist this in Supabase
// Authentication > URL Configuration (http://localhost:3000/** already covers it).
const ACCEPT_INVITE_URL = `${APP_URL}/admin/auth/accept-invite`;

type Result = { success: true } | { error: string };

function isEmailTaken(error: { message?: string; code?: string }) {
  return (
    error.code === 'email_exists' ||
    error.message?.toLowerCase().includes('already been registered') ||
    error.message?.toLowerCase().includes('already registered')
  );
}

/* =========================================================
   INVITE ADMIN (SysAdmin only)
========================================================= */

export async function inviteAdmin(input: {
  fullName: string;
  email: string;
  role: 'admin' | 'sysadmin';
}): Promise<Result> {
  // Runs on the server: needs a sysadmin with an MFA-verified session.
  await requireStaff(['sysadmin']);

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName) return { error: 'Enter the admin’s full name.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (!['admin', 'sysadmin'].includes(input.role)) return { error: 'Choose a role.' };

  const adminSupabase = createAdminClient();

  // 1. Create the auth user and send the invite email (through your Resend SMTP).
  //    The role is NOT put in user_metadata (RP-108).
  const { data, error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: ACCEPT_INVITE_URL,
    data: { full_name: fullName },
  });

  if (error || !data?.user) {
    if (error && isEmailTaken(error)) {
      return { error: 'This email already has an account.' };
    }
    console.error('[INVITE ADMIN] Supabase error:', error);
    return { error: error?.message || 'Unable to send the invite.' };
  }

  // 2. Save the role. Only this server code can write staff_roles.
  const { error: roleError } = await adminSupabase.from('staff_roles').insert({
    user_id: data.user.id,
    full_name: fullName,
    role: input.role,
    status: 'invited',
  });

  if (roleError) {
    console.error('[INVITE ADMIN] staff_roles error:', roleError);
    // Undo the auth user so the email isn't left stuck without a role.
    await adminSupabase.auth.admin.deleteUser(data.user.id);
    return { error: 'The role could not be saved, so the invite was cancelled. Try again.' };
  }

  revalidatePath('/sysadmin/admins');
  return { success: true };
}

/* =========================================================
   RESEND INVITE (SysAdmin only, only while still "invited")
========================================================= */

export async function resendInvite(userId: string): Promise<Result> {
  await requireStaff(['sysadmin']);

  const adminSupabase = createAdminClient();

  const { data: row } = await adminSupabase
    .from('staff_roles')
    .select('full_name, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (!row || row.status !== 'invited') {
    return { error: 'Only pending invites can be resent.' };
  }

  const { data: found, error: lookupError } =
    await adminSupabase.auth.admin.getUserById(userId);

  const email = found?.user?.email;
  if (lookupError || !email) return { error: 'Could not find this account.' };

  const { error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: ACCEPT_INVITE_URL,
    data: { full_name: row.full_name },
  });

  if (error) {
    console.error('[RESEND INVITE] Supabase error:', error);
    return { error: error.message || 'Unable to resend the invite.' };
  }

  return { success: true };
}

/* =========================================================
   ACTIVATE (called by the accept-invite page after the new admin
   sets their password). Only flips THEIR OWN row, and only from
   "invited" to "active".
========================================================= */

export async function activateInvitedAdmin(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'You are not signed in.' };

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from('staff_roles')
    .update({ status: 'active' })
    .eq('user_id', user.id)
    .eq('status', 'invited');

  if (error) {
    console.error('[ACTIVATE ADMIN] error:', error);
    return { error: 'Unable to activate your account.' };
  }

  return { success: true };
}