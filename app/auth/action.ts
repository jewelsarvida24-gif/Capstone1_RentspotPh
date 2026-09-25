// app/auth/action.ts
'use server';

import { createAdminClient } from '@/lib/supabase_admin';
import {
  sendEmailVerification,
  sendPasswordResetEmail,
} from '@/lib/email';
  
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  'http://localhost:3000';


/* =========================================================
   REGISTER CUSTOMER
========================================================= */

const PASSWORD_REQUIREMENTS_MSG =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';

function isPasswordStrong(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export async function registerUser({
  firstName,
  lastName,
  email,
  mobileNumber,
  password,
  confirmPassword,
}: {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
}) {
  try {
    const adminSupabase = createAdminClient();

    const normalizedEmail = email.trim().toLowerCase();
    const first_name = firstName.trim();
    const last_name = lastName.trim();
    const mobile_number = mobileNumber.trim();

    if (!normalizedEmail || !first_name || !last_name) {
      return { error: 'Please provide your first name, last name, and a valid email.' };
    }

    if (!/^(09|\+639)\d{9}$/.test(mobile_number)) {
      return { error: 'Please provide a valid PH mobile number (e.g. 09XXXXXXXXX).' };
    }
    if (!isPasswordStrong(password)) {
      return { error: PASSWORD_REQUIREMENTS_MSG };
    }

    if (password !== confirmPassword) {
      return { error: 'Password and confirm password do not match.' };
    }

    console.log(
      '[REGISTER CUSTOMER] Creating account:',
      normalizedEmail
    );

    const { data, error } =
      await adminSupabase.auth.admin.generateLink({
        type: 'signup',
        email: normalizedEmail,
        password,
        options: {
          redirectTo: `${APP_URL}/auth/login?verified=true`,
          data: {
            first_name,
            last_name,
            phone_number: mobile_number,
            role: 'customer',
          },
        },
      });

    if (error || !data) {
      console.error(
        '[REGISTER CUSTOMER] Supabase error:',
        error
      );

      return {
        error:
          error?.message ||
          'Failed to create account.',
      };
    }

    if (data.user) {
      const { error: upsertError } =
        await adminSupabase
          .from('tbl_users')
          .upsert(
            {
              user_id: data.user.id,
              first_name,
              last_name,
              email: normalizedEmail,
              phone_number: mobile_number,
              role: 'customer',
            },
            {
              onConflict: 'user_id',
            }
          );

      if (upsertError) {
        console.error(
          '[REGISTER CUSTOMER] tbl_users error:',
          upsertError
        );

        return {
          error:
            `Auth account created, but the user profile could not be saved: ${upsertError.message}`,
        };
      }
    }

    const verificationUrl =
      data.properties.action_link;

    console.log(
      '[REGISTER CUSTOMER] Sending verification email...'
    );

    const emailResult =
      await sendEmailVerification(
        normalizedEmail,
        first_name || 'there',
        verificationUrl
      );

    if (emailResult.error) {
      console.error(
        '[REGISTER CUSTOMER] Resend error:',
        emailResult.error
      );

      return {
        error:
          emailResult.error.message ||
          'Failed to send verification email.',
      };
    }

    console.log(
      '[REGISTER CUSTOMER] Verification email sent.'
    );

    return {
      success: true,
    };
  } catch (error: any) {
    console.error(
      '[REGISTER CUSTOMER] Unexpected error:',
      error
    );

    return {
      error:
        error?.message ||
        'An error occurred.',
    };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { error: 'Email is required.' };
    }

    const adminSupabase = createAdminClient();
    const { data, error } =
      await adminSupabase.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: {
          redirectTo: `${APP_URL}/auth/update-password`,
        },
      });

    if (error || !data?.properties.action_link) {
      return {
        error: error?.message || 'Unable to create a password reset link.',
      };
    }

    const emailResult = await sendPasswordResetEmail(
      normalizedEmail,
      data.properties.action_link
    );

    if (emailResult.error) {
      return {
        error: emailResult.error.message || 'Failed to send password reset email.',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[PASSWORD RESET] Unexpected error:', error);
    return { error: error?.message || 'Unable to send password reset email.' };
  }
}


/* =========================================================
   REGISTER ADMIN
========================================================= */

export async function registerAdminUser({
  first_name,
  last_name,
  email,
  phone_number,
  password,
  invitation_code,
}: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  invitation_code: string;
}) {
  try {
    const adminSupabase = createAdminClient();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!invitation_code?.trim()) {
      return {
        error: 'Invitation code is required.',
      };
    }

    const {
      data: invitation,
      error: invitationError,
    } = await adminSupabase
      .from('tbl_admin_invitations')
      .select('*')
      .eq('code', invitation_code.trim())
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      console.error(
        '[REGISTER ADMIN] Invitation error:',
        invitationError
      );

      return {
        error:
          'Invalid or expired invitation code.',
      };
    }

    const { data, error } =
      await adminSupabase.auth.admin.generateLink({
        type: 'signup',
        email: normalizedEmail,
        password,
        options: {
          redirectTo:
            `${APP_URL}/admin/auth/login`,
          data: {
            first_name,
            last_name,
            phone_number,
            role: 'admin',
          },
        },
      });

    if (error || !data) {
      console.error(
        '[REGISTER ADMIN] Supabase error:',
        error
      );

      return {
        error:
          error?.message ||
          'Failed to create admin account.',
      };
    }

    if (data.user) {
      const { error: upsertError } =
        await adminSupabase
          .from('tbl_users')
          .upsert(
            {
              user_id: data.user.id,
              first_name,
              last_name,
              email: normalizedEmail,
              phone_number,
              role: 'admin',
            },
            {
              onConflict: 'user_id',
            }
          );

      if (upsertError) {
        console.error(
          '[REGISTER ADMIN] tbl_users error:',
          upsertError
        );
      }

      const { error: invitationUpdateError } =
        await adminSupabase
          .from('tbl_admin_invitations')
          .update({
            status: 'used',
            used_by: data.user.id,
            used_at:
              new Date().toISOString(),
          })
          .eq('id', invitation.id);

      if (invitationUpdateError) {
        console.error(
          '[REGISTER ADMIN] Invitation update error:',
          invitationUpdateError
        );
      }
    }

    const verificationUrl =
      data.properties.action_link;

    const emailResult =
      await sendEmailVerification(
        normalizedEmail,
        first_name || 'there',
        verificationUrl
      );

    if (emailResult.error) {
      console.error(
        '[REGISTER ADMIN] Resend error:',
        emailResult.error
      );

      return {
        error:
          emailResult.error.message ||
          'Failed to send verification email.',
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error(
      '[REGISTER ADMIN] Unexpected error:',
      error
    );

    return {
      error:
        error?.message ||
        'An error occurred.',
    };
  }
}

/* =========================================================
   RESEND VERIFICATION EMAIL
========================================================= */

export async function resendVerificationEmail(email: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return { error: "Email is required." };
    }

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: {
        redirectTo: `${APP_URL}/auth/login?verified=true`,
      },
    });

    if (error || !data?.properties.action_link) {
      console.error("[RESEND VERIFICATION] Supabase error:", error);

      const isRateLimited =
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.status === 429;

      return {
        error: isRateLimited
          ? "Too many requests. Please wait a minute before trying again."
          : error?.message || "Unable to resend verification email.",
        rateLimited: isRateLimited,
      };
    }

    const { data: profile } = await adminSupabase
      .from("tbl_users")
      .select("first_name")
      .eq("email", normalizedEmail)
      .maybeSingle();

    const emailResult = await sendEmailVerification(
      normalizedEmail,
      profile?.first_name || "there",
      data.properties.action_link
    );

    if (emailResult.error) {
      console.error("[RESEND VERIFICATION] Resend error:", emailResult.error);

      const isRateLimited =
        emailResult.error.message?.toLowerCase().includes("rate limit") ||
        (emailResult.error as any)?.statusCode === 429;

      return {
        error: isRateLimited
          ? "Too many requests. Please wait a minute before trying again."
          : emailResult.error.message || "Failed to resend verification email.",
        rateLimited: isRateLimited,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[RESEND VERIFICATION] Unexpected error:", error);
    return { error: error?.message || "An error occurred." };
  }
}