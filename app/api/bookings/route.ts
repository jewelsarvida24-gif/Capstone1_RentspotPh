import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { createClient } from '@/lib/supabase_server';
import { createPayMongoCheckoutSession } from '@/lib/paymongo';
import { isUuid } from '@/lib/uuid';
<<<<<<< Updated upstream
import { calculateBooking, getTodayInManila } from '@/lib/pricing';
import {
  BOOKING_STATUS,
  DATE_BLOCKING_STATUSES,
  PENDING_HOLD_MS,
  normalizeStatus,
} from '@/lib/booking-status';
=======
import { isBookingBlockingUnit, PAYMENT_SESSION_TTL_MS } from '@/lib/unit-booking-rules';
import { calculateBooking } from '@/lib/pricing';
>>>>>>> Stashed changes

const MAX_AGREEMENT_IMAGE_BYTES = 12 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

<<<<<<< Updated upstream
function isDateBlocking(status: string | null, createdAt?: string | null) {
  const s = normalizeStatus(status);
  if (!DATE_BLOCKING_STATUSES.has(s)) return false;
  if (s === BOOKING_STATUS.PENDING_PAYMENT && createdAt) {
    const created = new Date(createdAt).getTime();
    if (Number.isFinite(created) && Date.now() - created >= PENDING_HOLD_MS) return false;
  }
  return true;
}

=======
>>>>>>> Stashed changes
async function expirePendingBooking(adminSupabase: ReturnType<typeof createAdminClient>, booking: { booking_id: string; created_at?: string | null; status?: string | null }) {
  const createdAt = booking.created_at ? new Date(booking.created_at).getTime() : null;
  const expiresAt = createdAt ? createdAt + PENDING_HOLD_MS : null;
  const isExpired = Boolean(
    createdAt &&
    expiresAt &&
    Date.now() > expiresAt &&
    booking.status === BOOKING_STATUS.PENDING_PAYMENT
  );

  if (isExpired) {
    await adminSupabase
      .from('tbl_bookings')
      .update({ status: BOOKING_STATUS.EXPIRED })
      .eq('booking_id', booking.booking_id);

    await adminSupabase
      .from('tbl_payments')
      .update({ payment_status: 'expired' })
      .eq('booking_id', booking.booking_id);
  }

  return { expiresAt, isExpired };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id')?.trim();
  const includeAgreementImage = searchParams.get('include_agreement_image') === 'true';
  const adminSupabase = createAdminClient();

  // The caller must be signed in, and a booking ID may only access that renter's own booking.
  if (!bookingId) {
    return NextResponse.json(
      { error: 'booking_id is required.' },
      { status: 400 }
    );
  }

  const { data: booking, error: bookingError } = await adminSupabase
    .from('tbl_bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  const { expiresAt, isExpired } = await expirePendingBooking(adminSupabase, booking);

  const { data: refreshedBooking, error: refreshedBookingError } = isExpired
    ? await adminSupabase.from('tbl_bookings').select('*').eq('booking_id', bookingId).eq('user_id', user.id).single()
    : { data: booking, error: null };

  if (refreshedBookingError) {
    return NextResponse.json({ error: refreshedBookingError.message }, { status: 500 });
  }

  const { data: payment, error: paymentError } = await adminSupabase
    .from('tbl_payments')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  let agreementImageUrl: string | null = null;
  if (includeAgreementImage && refreshedBooking?.agreement_image_path) {
    const { data: agreementImage, error: agreementImageError } = await adminSupabase.storage
      .from('rental-agreements')
      .createSignedUrl(refreshedBooking.agreement_image_path, 300);

    if (agreementImageError) {
      return NextResponse.json({ error: agreementImageError.message }, { status: 500 });
    }

    agreementImageUrl = agreementImage.signedUrl;
  }

  return NextResponse.json({
    booking: refreshedBooking,
    payment,
    agreement_image_url: agreementImageUrl,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    expired: isExpired || refreshedBooking?.status === BOOKING_STATUS.EXPIRED,
    payment_status: payment?.payment_status ?? null,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: kycSubmission, error: kycError } = await supabase
    .from('tbl_kyc')
    .select('admin_status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (kycError || kycSubmission?.admin_status?.toLowerCase() !== 'approved') {
    return NextResponse.json(
      {
        error:
          'Identity verification is required before booking. Complete verification from your profile and wait for admin approval.',
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const unitId = String(body.unit_id ?? '').trim();
  const startDate = String(body.start_date ?? '').trim();
  const endDate = String(body.end_date ?? '').trim();
  const pickupDate = String(body.pickup_date ?? '').trim();
  const paymentMethod = String(body.payment_method ?? 'paymongo_checkout').trim() || 'paymongo_checkout';
  const agreementAccepted = body.agreement_accepted === true;
  const signatureData = typeof body.signature_data === 'string' ? body.signature_data : '';
  const agreementImageData = typeof body.agreement_image_data === 'string' ? body.agreement_image_data : '';
  const agreementUploadId = typeof body.agreement_upload_id === 'string' ? body.agreement_upload_id.trim() : '';

  if (!agreementAccepted || !signatureData.startsWith('data:image/png;base64,') || signatureData.length > 1_500_000) {
    return NextResponse.json(
      { error: 'Review the Rental Agreement, accept the terms, and sign before proceeding to payment.' },
      { status: 400 }
    );
  }
  const maxAgreementImageDataLength = 'data:image/png;base64,'.length + Math.ceil(MAX_AGREEMENT_IMAGE_BYTES / 3) * 4;
  if (agreementImageData.length > maxAgreementImageDataLength) {
    return NextResponse.json(
      { error: 'The signed Rental Agreement image must be no larger than 12 MB.' },
      { status: 400 }
    );
  }
  const agreementImageMatch = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(agreementImageData);
  if (!isUuid(agreementUploadId) || !agreementImageMatch) {
    return NextResponse.json(
      { error: 'A valid signed Rental Agreement image is required before proceeding to payment.' },
      { status: 400 }
    );
  }
  const agreementImage = Buffer.from(agreementImageMatch[1], 'base64');
  if (
    agreementImage.length > MAX_AGREEMENT_IMAGE_BYTES
    || !agreementImage.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    return NextResponse.json(
      { error: 'The signed Rental Agreement must be a valid PNG image no larger than 12 MB.' },
      { status: 400 }
    );
  }

  if (!unitId || !startDate || !endDate || !pickupDate) {
    return NextResponse.json(
      { error: 'unit_id, start_date, end_date, and pickup_date are required.' },
      { status: 400 }
    );
  }

  if (!isUuid(unitId)) {
    return NextResponse.json(
      { error: 'This unit is currently unavailable for online booking.' },
      { status: 400 }
    );
  }

  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate) || !isValidDateOnly(pickupDate)) {
    return NextResponse.json(
      { error: 'Please provide valid rental and pickup dates.' },
      { status: 400 }
    );
  }

  // Enforce the no-same-day rule on the server, using Philippine local time.
  if (startDate <= getTodayInManila()) {
    return NextResponse.json(
      { error: 'Same-day bookings are not allowed. Please select tomorrow or a later date.' },
      { status: 400 }
    );
  }

<<<<<<< Updated upstream
  // 1-day rentals are allowed (start === end).
=======
  // J2: 1-day rentals are allowed (start === end); only an end before the start is invalid.
>>>>>>> Stashed changes
  if (endDate < startDate) {
    return NextResponse.json(
      { error: 'end_date cannot be earlier than start_date.' },
      { status: 400 }
    );
  }

  if (pickupDate < startDate || pickupDate > endDate) {
    return NextResponse.json(
      { error: 'pickup_date must be a valid date between start_date and end_date.' },
      { status: 400 }
    );
  }

  const adminSupabase = createAdminClient();
  const { data: unit, error: unitError } = await adminSupabase
    .from('tbl_units')
    .select('unit_id, category, description, daily_rate, status')
    .eq('unit_id', unitId)
    .maybeSingle();

  if (unitError) {
    return NextResponse.json({ error: unitError.message }, { status: 500 });
  }
  if (!unit) {
    return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
  }
  if (unit.status !== 'available') {
    return NextResponse.json(
      { error: 'Selected unit is not available for booking.' },
      { status: 409 }
    );
  }

  // Each booking blocks start_date .. end_date + 1 day (buffer), whatever its length.
  // The new rental needs its own buffer day too, so compare buffered range to buffered range.
  const requestedBlockEnd = addDays(endDate, 1);
  const { data: nearbyBookings, error: availabilityError } = await adminSupabase
    .from('tbl_bookings')
    .select('start_date, end_date, status, created_at')
    .eq('unit_id', unitId)
    .lte('start_date', requestedBlockEnd)
    .gte('end_date', addDays(startDate, -1));

  if (availabilityError) {
    return NextResponse.json({ error: availabilityError.message }, { status: 500 });
  }
  const hasConflict = (nearbyBookings ?? []).some(
    (b) =>
      isDateBlocking(b.status, b.created_at) &&
      b.start_date <= requestedBlockEnd &&
      addDays(b.end_date, 1) >= startDate
  );
  if (hasConflict) {
    return NextResponse.json(
      { error: 'Selected unit is already booked for the requested dates (including the buffer day).' },
      { status: 409 }
    );
  }

  const { data: overlappingBlocks, error: blocksError } = await adminSupabase
    .from('tbl_unit_blocked_dates')
    .select('id')
    .eq('unit_id', unitId)
    .gte('blocked_date', startDate)
    .lte('blocked_date', endDate)
    .limit(1);

  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }
  if ((overlappingBlocks ?? []).length > 0) {
    return NextResponse.json(
      { error: 'Selected unit is unavailable for the requested dates.' },
      { status: 409 }
    );
  }

  const dailyRate = Number(unit.daily_rate);
  if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
    return NextResponse.json(
      { error: 'Unit daily rate is invalid or missing.' },
      { status: 400 }
    );
  }

<<<<<<< Updated upstream
  // totalAmount = rental fee + ₱300 security fee. This is what PayMongo is charged.
=======
  // J2: all pricing comes from calculateBooking(). totalAmount = rental fee + ₱300 security fee,
  // and that total is what PayMongo is charged.
>>>>>>> Stashed changes
  const { rentalDays, rentalFee, securityFee, total: totalAmount } = calculateBooking({
    dailyRate,
    startDate,
    endDate,
  });

  const bookingId = crypto.randomUUID();
  const agreementImagePath = `${user.id}/${agreementUploadId}/signed-agreement.png`;
  const agreementStorage = adminSupabase.storage.from('rental-agreements');
  const { error: agreementUploadError } = await agreementStorage.upload(agreementImagePath, agreementImage, {
    cacheControl: '3600',
    contentType: 'image/png',
    upsert: false,
  });

  if (agreementUploadError) {
    const { data: existingImage, error: existingImageError } = await agreementStorage
      .download(agreementImagePath);
    if (!existingImageError && existingImage) {
      const existingImageBuffer = Buffer.from(await existingImage.arrayBuffer());
      if (existingImageBuffer.equals(agreementImage)) {
        // A byte-identical image at this retry token is already saved.
      } else {
        return NextResponse.json(
          {
            code: 'agreement_image_upload_failed',
            error: 'This agreement upload ID is already associated with a different image.',
          },
          { status: 409 }
        );
      }
    } else {
      return NextResponse.json(
        {
          code: 'agreement_image_upload_failed',
          error: `Unable to save the signed Rental Agreement image: ${agreementUploadError.message}`,
        },
        { status: 502 }
      );
    }
  }

  const { data: booking, error: bookingError } = await adminSupabase
    .from('tbl_bookings')
    .insert({
      booking_id: bookingId,
      user_id: user.id,
      unit_id: unitId,
      start_date: startDate,
      end_date: endDate,
      pickup_date: pickupDate,
      rental_fee: rentalFee,
      security_fee: securityFee,
      total_amount: totalAmount,
      status: BOOKING_STATUS.PENDING_PAYMENT,
      rental_agreement_accepted: true,
      rental_agreement_signed_at: new Date().toISOString(),
      rental_agreement_signature_data: signatureData,
      agreement_image_path: agreementImagePath,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (bookingError || !booking) {
    const { error: cleanupError } = await adminSupabase.storage
      .from('rental-agreements')
      .remove([agreementImagePath]);
    if (cleanupError) {
      console.error('Unable to remove an agreement image after booking creation failed.', cleanupError);
    }
    return NextResponse.json(
      {
        code: 'agreement_not_saved',
        error: bookingError?.message ?? 'Unable to create booking record.',
      },
      { status: 500 }
    );
  }

  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  let checkout: Awaited<ReturnType<typeof createPayMongoCheckoutSession>>;

  try {
    checkout = await createPayMongoCheckoutSession({
      amount: Math.round(totalAmount * 100),
      description: `${unit.category ?? 'Rental'} booking`,
      customerEmail: user.email ?? undefined,
      successUrl: `${appBaseUrl}/renter/booking?booking_id=${encodeURIComponent(bookingId)}&status=success`,
      cancelUrl: `${appBaseUrl}/renter/booking?booking_id=${encodeURIComponent(bookingId)}&status=cancelled`,
      metadata: {
        booking_id: bookingId,
        user_id: user.id,
        unit_id: unitId,
        amount: totalAmount,
      },
      referenceNumber: bookingId,
    });
  } catch (checkoutError) {
    await adminSupabase.from('tbl_bookings').update({ status: BOOKING_STATUS.CANCELLED }).eq('booking_id', bookingId);
    return NextResponse.json(
      { error: checkoutError instanceof Error ? checkoutError.message : 'Unable to create PayMongo checkout session.' },
      { status: 502 }
    );
  }

  if (!checkout.checkout_url) {
    await adminSupabase.from('tbl_bookings').update({ status: BOOKING_STATUS.CANCELLED }).eq('booking_id', bookingId);
    return NextResponse.json(
      { error: 'PayMongo did not return a checkout URL.' },
      { status: 502 }
    );
  }

  const paymentId = crypto.randomUUID();
  const { error: paymentError } = await adminSupabase.from('tbl_payments').insert({
    payment_id: paymentId,
    booking_id: bookingId,
    amount_paid: totalAmount,
    payment_method: paymentMethod,
    proof_of_payment_url: checkout.checkout_url,
    provider_reference: checkout.id,
    payment_status: 'pending',
    paid_at: null,
  });

  if (paymentError) {
    await adminSupabase.from('tbl_bookings').update({ status: BOOKING_STATUS.CANCELLED }).eq('booking_id', bookingId);
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({
    booking,
    payment: {
      payment_id: paymentId,
      payment_method: paymentMethod,
      payment_status: 'pending',
      proof_of_payment_url: checkout.checkout_url,
    },
    checkout_url: checkout.checkout_url,
    total_amount: totalAmount,
    rental_fee: rentalFee,
    security_fee: securityFee,
    rental_days: rentalDays,
    daily_rate: dailyRate,
  });
}


// PATCH /api/bookings — cancel a pending checkout when PayMongo returns via the cancel URL.
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  const bookingId = typeof payload.booking_id === 'string' ? payload.booking_id.trim() : '';
  if (!isUuid(bookingId) || payload.action !== 'cancel') {
    return NextResponse.json({ error: 'A valid booking_id and cancel action are required.' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: booking, error: lookupError } = await adminSupabase
    .from('tbl_bookings')
    .select('booking_id, user_id, status')
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) {
    return NextResponse.json({ error: 'Only a booking awaiting payment can be cancelled this way.' }, { status: 409 });
  }

  const { error: updateBookingError } = await adminSupabase
    .from('tbl_bookings')
    .update({ status: BOOKING_STATUS.CANCELLED })
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .eq('status', BOOKING_STATUS.PENDING_PAYMENT);
  if (updateBookingError) return NextResponse.json({ error: updateBookingError.message }, { status: 500 });

  const { error: updatePaymentError } = await adminSupabase
    .from('tbl_payments')
    .update({ payment_status: 'cancelled' })
    .eq('booking_id', bookingId)
    .eq('payment_status', 'pending');
  if (updatePaymentError) return NextResponse.json({ error: updatePaymentError.message }, { status: 500 });

<<<<<<< Updated upstream
  return NextResponse.json({ success: true, booking_id: bookingId, status: BOOKING_STATUS.CANCELLED, payment_status: 'cancelled' });
=======
  return NextResponse.json({ success: true, booking_id: bookingId, status: 'cancelled', payment_status: 'cancelled' });
>>>>>>> Stashed changes
}