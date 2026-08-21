// lib/email.ts — Resend email helper
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'noreply@rentspotph.com';

interface BookingStatusEmailParams {
  to: string;
  firstName: string;
  bookingId: string;
  status: string;
  notes?: string;
}

export async function sendBookingStatusEmail({
  to, firstName, bookingId, status, notes,
}: BookingStatusEmailParams) {
  const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const subject =
    status === 'confirmed' ? 'Your booking has been approved! ✅' :
    status === 'rejected' ? 'Booking update — action required' :
    `Booking Update: ${statusLabel}`;

  const body = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <h2 style="color:#c0392b">RentSpot.ph</h2>
      <p>Hi ${firstName},</p>
      <p>Your booking <strong>#${bookingId.slice(0, 8)}</strong> has been updated.</p>
      <div style="background:#f9f9f9;border-left:4px solid #c0392b;padding:16px;border-radius:4px;margin:20px 0">
        <strong>Status:</strong> ${statusLabel}<br/>
        ${notes ? `<strong>Note:</strong> ${notes}` : ''}
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/renter/my-rentals"
        style="background:#c0392b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
        View My Rentals
      </a>
      <p style="color:#999;font-size:12px;margin-top:32px">
        This email was sent by RentSpotPH. Do not reply to this email.
      </p>
    </div>
  `;

  return resend.emails.send({ from: FROM, to, subject, html: body });
}

export async function sendReturnReminderEmail(to: string, firstName: string, unitName: string, returnDate: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: Return "${unitName}" tomorrow`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#c0392b">RentSpot.ph</h2>
        <p>Hi ${firstName},</p>
        <p>This is a reminder that your rental of <strong>${unitName}</strong> is due for return on <strong>${returnDate}</strong>.</p>
        <p>Please ensure you return the unit on time to avoid late fees.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/renter/my-rentals"
          style="background:#c0392b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          Mark as Ready for Return
        </a>
      </div>
    `,
  });
}

export async function sendEmailVerification(to: string, firstName: string, verificationUrl: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your RentSpot.ph account',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#c0392b">RentSpot.ph</h2>
        <p>Hi ${firstName}, welcome to RentSpotPH!</p>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verificationUrl}"
          style="background:#c0392b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
          Verify Email
        </a>
      </div>
    `,
  });
}