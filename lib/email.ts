import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'onboarding@resend.dev';

export async function sendEmailVerification(
  toEmail: string,
  firstName: string,
  verificationUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Verify your RentSpotPH account',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Hi ${firstName},</h2>
          <p>Thanks for signing up for RentSpotPH. Please verify your email to activate your account.</p>
          <p>
            <a href="${verificationUrl}"
               style="display:inline-block;padding:10px 20px;background:#f59e0b;color:#fff;
                      text-decoration:none;border-radius:6px;">
              Verify Email
            </a>
          </p>
          <p>If you didn't sign up for RentSpotPH, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      return { error };
    }

    return { data };
  } catch (error: any) {
    return { error: { message: error?.message || 'Failed to send verification email.' } };
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Reset your RentSpotPH password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>We received a request to reset your RentSpotPH account password.</p>
          <p>
            <a href="${resetUrl}"
               style="display:inline-block;padding:10px 20px;background:#f59e0b;color:#fff;
                      text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p style="word-break: break-all;">${resetUrl}</p>
        </div>
      `,
    });

    if (error) {
      return { error };
    }

    return { data };
  } catch (error: any) {
    return { error: { message: error?.message || 'Failed to send password reset email.' } };
  }
}
