import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';
import { createAdminClient } from '@/lib/supabase_admin';
import { notifyBookingStatusChange, notifyUser } from '@/lib/notifications_server';
import { createPayMongoRefund, retrievePayMongoCheckoutSession } from '@/lib/paymongo';
import { calculateCancellationRefund } from '@/lib/refunds';
import { isUuid } from '@/lib/uuid';

const PAID_PAYMENT_STATUSES = ['paid', 'succeeded', 'success', 'completed', 'processed'];
const CANCELLED_STATUSES = ['cancelled', 'canceled'];

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: staff } = await admin
    .from('staff_roles')
    .select('role, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!staff || staff.status !== 'active') return null;
  if (!['admin', 'sysadmin'].includes(staff.role)) return null;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return null;

  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data: bookings, error } = await admin
    .from('tbl_bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = bookings ?? [];
  const userIds = [...new Set(rows.map((b) => b.user_id))];
  const unitIds = [...new Set(rows.map((b) => b.unit_id))];
  const bookingIds = rows.map((b) => b.booking_id);

  const [{ data: users }, { data: units }, { data: payments }] = await Promise.all([
    admin.from('tbl_users').select('user_id, first_name, last_name, email, phone_number').in('user_id', userIds),
    admin.from('tbl_units').select('unit_id, category, description, daily_rate, status, image_url').in('unit_id', unitIds),
    admin.from('tbl_payments').select('*').in('booking_id', bookingIds),
  ]);

  const result = rows.map((b) => {
    const payment = payments?.find((p) => p.booking_id === b.booking_id) ?? null;
    const status = (b.status ?? '').toLowerCase();
    const paymentStatus = (payment?.payment_status ?? '').toLowerCase();
    const refundStatus = (payment?.refund_status ?? '').toLowerCase();

    let computed_refund: Record<string, unknown> | null = null;
    if (
      payment &&
      CANCELLED_STATUSES.includes(status) &&
      (PAID_PAYMENT_STATUSES.includes(paymentStatus) || refundStatus === 'refunded')
    ) {
      const refund = calculateCancellationRefund({
        startDate: b.start_date,
        cancelledAt: b.cancelled_at ?? new Date().toISOString(),
        rentalFee: b.rental_fee,
        securityFee: b.security_fee,
        securityFeeRefundable: b.security_fee_refundable,
        totalAmount: b.total_amount,
      });
      computed_refund = { ...refund, eligible: Number(refund.refundAmount) > 0 };
    }

    return {
      ...b,
      renter: users?.find((u) => u.user_id === b.user_id) ?? null,
      unit: units?.find((u) => u.unit_id === b.unit_id) ?? null,
      payment,
      computed_refund,
    };
  });

  return NextResponse.json({
    bookings: result,
    test_mode: (process.env.PAYMONGO_SECRET_KEY ?? '').startsWith('sk_test_'),
  });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsedBody: unknown = await request.json().catch(() => null);
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }
  const body = parsedBody as Record<string, unknown>;
  const bookingId = typeof body.booking_id === 'string' ? body.booking_id.trim() : '';
  if (!isUuid(bookingId)) {
    return NextResponse.json({ error: 'A valid booking_id is required.' }, { status: 400 });
  }

  if (body.action === 'refund') {
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (reason.length > 500) {
      return NextResponse.json({ error: 'Refund note must be 500 characters or fewer.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: booking, error: bookingLookupError } = await admin
      .from('tbl_bookings')
      .select('booking_id, user_id, status, start_date, rental_fee, security_fee, security_fee_refundable, total_amount, cancelled_at')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (bookingLookupError) return NextResponse.json({ error: bookingLookupError.message }, { status: 500 });
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });

    const bookingStatus = (booking.status ?? '').toLowerCase();
    const isRejected = bookingStatus === 'rejected';
    const isCancelled = CANCELLED_STATUSES.includes(bookingStatus);
    if (!isRejected && !isCancelled) {
      return NextResponse.json(
        { error: 'Only rejected or cancelled bookings can be refunded through this action.' },
        { status: 409 }
      );
    }

    const { data: payment, error: paymentLookupError } = await admin
      .from('tbl_payments')
      .select('payment_id, amount_paid, payment_status, provider_reference, refund_status')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (paymentLookupError) return NextResponse.json({ error: paymentLookupError.message }, { status: 500 });
    if (!payment || !PAID_PAYMENT_STATUSES.includes((payment.payment_status ?? '').toLowerCase())) {
      return NextResponse.json({ error: 'A paid payment record is required before issuing a refund.' }, { status: 409 });
    }
    if (['processing', 'refunded'].includes((payment.refund_status ?? '').toLowerCase())) {
      return NextResponse.json({ error: 'A refund is already processing or has been completed.' }, { status: 409 });
    }
    if (!payment.provider_reference) {
      return NextResponse.json({ error: 'The PayMongo checkout reference is missing for this payment.' }, { status: 409 });
    }

    const amountPaid = Number(payment.amount_paid);
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      return NextResponse.json({ error: 'The recorded payment amount is invalid.' }, { status: 409 });
    }

    // Rejected bookings: full refund. Cancelled bookings: amount set by the cancellation policy.
    let amount = amountPaid;
    let refundReason: string | null = reason || null;
    if (isCancelled) {
      const policy = calculateCancellationRefund({
        startDate: booking.start_date,
        cancelledAt: booking.cancelled_at ?? new Date().toISOString(),
        rentalFee: booking.rental_fee,
        securityFee: booking.security_fee,
        securityFeeRefundable: booking.security_fee_refundable,
        totalAmount: booking.total_amount,
      });
      amount = Number(policy.refundAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json(
          { error: 'This cancelled booking is not eligible for a refund under the cancellation policy.' },
          { status: 409 }
        );
      }
      if (amount > amountPaid) amount = amountPaid;
      refundReason = reason ? `${policy.breakdownLabel} - ${reason}` : policy.breakdownLabel;
    }

    const { data: claimedPayment, error: claimError } = await admin
      .from('tbl_payments')
      .update({
        refund_status: 'processing',
        refund_amount: amount,
        refund_mode: (process.env.PAYMONGO_SECRET_KEY ?? '').startsWith('sk_test_') ? 'test' : 'live',
        refund_reason: refundReason,
        refund_error: null,
      })
      .eq('payment_id', payment.payment_id)
      .in('payment_status', PAID_PAYMENT_STATUSES)
      .or('refund_status.is.null,refund_status.eq.not_applicable,refund_status.eq.eligible,refund_status.eq.failed')
      .select('payment_id')
      .maybeSingle();

    if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });
    if (!claimedPayment) {
      return NextResponse.json({ error: 'This payment is already being refunded or is no longer eligible.' }, { status: 409 });
    }

    try {
      const { raw } = await retrievePayMongoCheckoutSession(payment.provider_reference);
      const payments = raw?.data?.attributes?.payments;

      const paidPayment = Array.isArray(payments)
        ? payments.find(
            (entry) =>
              entry?.attributes?.status === 'paid' &&
              typeof entry?.id === 'string'
          )
        : null;

      if (!paidPayment?.id) {
        throw new Error('No paid PayMongo payment was found for this checkout session.');
      }

      const refund = await createPayMongoRefund({
        paymentId: paidPayment.id,
        amountCentavos: Math.round(amount * 100),
        reason:
          reason === 'duplicate' ||
          reason === 'fraudulent' ||
          reason === 'requested_by_customer'
            ? reason
            : undefined,
      });

      const refundedAt = new Date().toISOString();

      const { error: finalizeError } = await admin
        .from('tbl_payments')
        .update({
          payment_status: refund.status === 'succeeded' ? 'refunded' : payment.payment_status,
          refund_status: refund.status === 'succeeded' ? 'refunded' : 'processing',
          refund_reference: refund.id,
          refunded_at: refund.status === 'succeeded' ? refundedAt : null,
        })
        .eq('payment_id', payment.payment_id)
        .eq('refund_status', 'processing');

      if (finalizeError) {
        console.error('[ADMIN_REFUND_FINALIZE_ERROR]', finalizeError);
        return NextResponse.json(
          {
            error:
              'PayMongo accepted the refund, but the local payment record could not be updated. Contact support before retrying.',
          },
          { status: 500 }
        );
      }

      const notificationSent = await notifyUser({
        userId: booking.user_id,
        bookingId: booking.booking_id,
        type: 'refund_issued',
        title: refund.status === 'succeeded' ? 'Refund sent' : 'Refund processing',
        message:
          refund.status === 'succeeded'
            ? `A refund of PHP ${amount.toFixed(2)} has been issued for your booking.${reason ? ` Note: ${reason}` : ''}`
            : `Your refund of PHP ${amount.toFixed(2)} has been submitted and is processing.${reason ? ` Note: ${reason}` : ''}`,
        link: '/renter/my-rentals',
      });

      return NextResponse.json({
        success: true,
        message: notificationSent
          ? refund.status === 'succeeded'
            ? 'Refund issued and renter notified.'
            : 'Refund submitted and renter notified.'
          : 'Refund submitted, but the renter notification could not be saved.',
      });
    } catch (refundError) {
      const message =
        refundError instanceof Error ? refundError.message : 'Unexpected error issuing refund.';

      const { error: releaseError } = await admin
        .from('tbl_payments')
        .update({ refund_status: 'failed', refund_error: message })
        .eq('payment_id', payment.payment_id)
        .eq('refund_status', 'processing');

      if (releaseError) console.error('[ADMIN_REFUND_RELEASE_ERROR]', releaseError);

      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const decision = body.decision;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (typeof decision !== 'string' || !['approved', 'rejected', 'completed'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (decision === 'rejected' && !reason) {
    return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: updated, error: bookingError } =
    decision === 'completed'
      ? await admin
          .from('tbl_bookings')
          .update({ status: 'completed' })
          .eq('booking_id', bookingId)
          .in('status', ['approved', 'confirmed'])
          .select('booking_id, user_id')
          .maybeSingle()
      : await admin
          .from('tbl_bookings')
          .update({
            status: decision,
            rejection_reason: decision === 'rejected' ? reason : null,
            reviewed_by: user.id,
            reviewed_at: now,
          })
          .eq('booking_id', bookingId)
          .eq('status', 'paid_awaiting_verification')
          .select('booking_id, user_id')
          .maybeSingle();

  if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 });
  if (!updated) {
    return NextResponse.json({ error: 'Booking is not awaiting review.' }, { status: 409 });
  }

  if (decision === 'approved') {
    const { error: paymentError } = await admin
      .from('tbl_payments')
      .update({ payment_status: 'paid', paid_at: now })
      .eq('booking_id', bookingId);

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }
  }

  await notifyBookingStatusChange({
    booking_id: updated.booking_id,
    user_id: updated.user_id,
    status: decision,
    rejection_reason: decision === 'rejected' ? reason : null,
  });

  return NextResponse.json({ message: decision === 'approved' ? 'Booking approved.' : 'Booking rejected.' });
}
