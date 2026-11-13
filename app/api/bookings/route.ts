import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';
import { createAdminClient } from '@/lib/supabase_admin';
import { createPayMongoCheckoutSession } from '@/lib/paymongo';
import { isUuid } from '@/lib/uuid';
import {
  calculateBooking,
  calculateRentalDays,
  getTodayInManila,
  isAddOnCategory,
  isCameraCategory,
  MAX_RENTAL_DAYS,
} from '@/lib/pricing';
import { BOOKING_STATUS } from '@/lib/booking-status';
import { isBookingBlockingUnit, PAYMENT_SESSION_TTL_MS } from '@/lib/unit-booking-rules';

const MAX_AGREEMENT_IMAGE_BYTES = 12 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

async function expirePendingBooking(
  admin: ReturnType<typeof createAdminClient>,
  booking: { booking_id: string; created_at?: string | null; status?: string | null }
) {
  const createdAt = booking.created_at ? new Date(booking.created_at).getTime() : null;
  const expiresAt = createdAt ? createdAt + PAYMENT_SESSION_TTL_MS : null;
  const isExpired = Boolean(
    createdAt &&
      expiresAt &&
      Date.now() > expiresAt &&
      booking.status === BOOKING_STATUS.PENDING_PAYMENT
  );

  if (isExpired) {
    const [{ error: bookingUpdateError }, { error: paymentUpdateError }] = await Promise.all([
      admin
        .from('tbl_bookings')
        .update({ status: 'expired' })
        .eq('booking_id', booking.booking_id)
        .eq('status', BOOKING_STATUS.PENDING_PAYMENT),
      admin
        .from('tbl_payments')
        .update({ payment_status: 'expired' })
        .eq('booking_id', booking.booking_id)
        .eq('payment_status', 'pending'),
    ]);
    if (bookingUpdateError) throw new Error(bookingUpdateError.message);
    if (paymentUpdateError) throw new Error(paymentUpdateError.message);
  }

  return { expiresAt, isExpired };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id')?.trim();
  if (bookingId) {
    if (!isUuid(bookingId)) {
      return NextResponse.json({ error: 'A valid booking_id is required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: booking, error: bookingError } = await admin
      .from('tbl_bookings')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 });
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });

    try {
      const { expiresAt, isExpired } = await expirePendingBooking(admin, booking);
      const { data: refreshedBooking, error: refreshedBookingError } = isExpired
        ? await admin
            .from('tbl_bookings')
            .select('*')
            .eq('booking_id', bookingId)
            .eq('user_id', user.id)
            .single()
        : { data: booking, error: null };
      if (refreshedBookingError) {
        return NextResponse.json({ error: refreshedBookingError.message }, { status: 500 });
      }

      const [{ data: payment, error: paymentError }, agreementImageResult] = await Promise.all([
        admin.from('tbl_payments').select('*').eq('booking_id', bookingId).maybeSingle(),
        searchParams.get('include_agreement_image') === 'true' && booking.agreement_image_path
          ? admin.storage
              .from('rental-agreements')
              .createSignedUrl(booking.agreement_image_path, 300)
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (paymentError || agreementImageResult.error) {
        return NextResponse.json(
          { error: paymentError?.message ?? agreementImageResult.error?.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        booking: refreshedBooking,
        payment,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        expired: isExpired || refreshedBooking?.status === 'expired',
        payment_status: payment?.payment_status ?? null,
        agreement_image_url: agreementImageResult.data?.signedUrl ?? null,
      });
    } catch (error) {
      console.error('[BOOKING_GET_ERROR]', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unable to load booking.' },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabase
    .from('tbl_bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

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
  if (kycError) {
    return NextResponse.json({ error: kycError.message }, { status: 500 });
  }
  if (kycSubmission?.admin_status?.toLowerCase() !== 'approved') {
    return NextResponse.json(
      { error: 'Identity verification is required before booking. Complete verification and wait for admin approval.' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }
  const unitId = typeof body.unit_id === 'string' ? body.unit_id.trim() : '';
  const startDate = typeof body.start_date === 'string' ? body.start_date.trim() : '';
  const endDate = typeof body.end_date === 'string' ? body.end_date.trim() : '';
  const pickupDate = typeof body.pickup_date === 'string' ? body.pickup_date.trim() : '';
  const paymentMethod = typeof body.payment_method === 'string' && body.payment_method.trim()
    ? body.payment_method.trim()
    : 'paymongo_checkout';
  const agreementAccepted = body.agreement_accepted === true;
  const signatureData = typeof body.signature_data === 'string' ? body.signature_data : '';
  const agreementImageData = typeof body.agreement_image_data === 'string' ? body.agreement_image_data : '';
  const agreementUploadId = typeof body.agreement_upload_id === 'string' ? body.agreement_upload_id.trim() : '';
  if (body.addon_ids !== undefined && !Array.isArray(body.addon_ids)) {
    return NextResponse.json({ error: 'addon_ids must be an array of add-on unit IDs.' }, { status: 400 });
  }
  const rawAddOnIds: unknown[] = Array.isArray(body.addon_ids) ? body.addon_ids : [];
  if (rawAddOnIds.some((id) => typeof id !== 'string' || !isUuid(id))) {
    return NextResponse.json({ error: 'Every add-on must have a valid unit ID.' }, { status: 400 });
  }
  const addOnIds = [...new Set(rawAddOnIds as string[])];

  if (!agreementAccepted || !signatureData.startsWith('data:image/png;base64,') || signatureData.length > 1_500_000) {
    return NextResponse.json(
      { error: 'Review the Rental Agreement, accept the terms, and sign before proceeding to payment.' },
      { status: 400 }
    );
  }
  const maxAgreementImageDataLength = 'data:image/png;base64,'.length + Math.ceil(MAX_AGREEMENT_IMAGE_BYTES / 3) * 4;
  if (agreementImageData.length > maxAgreementImageDataLength) {
    return NextResponse.json({ error: 'The signed Rental Agreement image must be no larger than 12 MB.' }, { status: 400 });
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
    agreementImage.length > MAX_AGREEMENT_IMAGE_BYTES ||
    !agreementImage.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
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
    return NextResponse.json({ error: 'This unit is currently unavailable for online booking.' }, { status: 400 });
  }
  if (!isDate(startDate) || !isDate(endDate) || !isDate(pickupDate)) {
    return NextResponse.json({ error: 'Please provide valid rental and pickup dates.' }, { status: 400 });
  }
  if (startDate <= getTodayInManila()) {
    return NextResponse.json(
      { error: 'Same-day bookings are not allowed. Please select tomorrow or a later date.' },
      { status: 400 }
    );
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: 'end_date cannot be earlier than start_date.' }, { status: 400 });
  }
  if (calculateRentalDays(startDate, endDate) > MAX_RENTAL_DAYS) {
    return NextResponse.json(
      { error: `The maximum rental period is ${MAX_RENTAL_DAYS} days.` },
      { status: 400 }
    );
  }
  if (pickupDate < startDate || pickupDate > endDate) {
    return NextResponse.json(
      { error: 'pickup_date must be a valid date between start_date and end_date.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: unit, error: unitError } = await admin
    .from('tbl_units')
    .select('unit_id, category, daily_rate, status, requires_driver_license')
    .eq('unit_id', unitId)
    .maybeSingle();
  if (unitError) return NextResponse.json({ error: unitError.message }, { status: 500 });
  if (!unit) return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
  if (unit.status !== 'available') {
    return NextResponse.json({ error: 'Selected unit is not available for booking.' }, { status: 409 });
  }
  const normalizedCategory = (unit.category ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (normalizedCategory === 'addon' || normalizedCategory === 'addons') {
    return NextResponse.json(
      { error: 'Add-on items cannot be booked separately. They are only available with a camera rental.' },
      { status: 400 }
    );
  }
  if (addOnIds.length > 0 && !isCameraCategory(unit.category)) {
    return NextResponse.json({ error: 'Add-ons can only be included with camera rentals.' }, { status: 400 });
  }

  let addOnDetails: { unit_id: string; unit_name: string; daily_rate: number }[] = [];
  if (addOnIds.length > 0) {
    const { data: addOnRows, error: addOnError } = await admin
      .from('tbl_units')
      .select('unit_id, unit_name, category, daily_rate, status')
      .in('unit_id', addOnIds);
    if (addOnError) return NextResponse.json({ error: addOnError.message }, { status: 500 });
    if (
      !addOnRows ||
      addOnRows.length !== addOnIds.length ||
      addOnRows.some((item) => item.status !== 'available' || !isAddOnCategory(item.category))
    ) {
      return NextResponse.json({ error: 'One or more selected add-ons are unavailable.' }, { status: 409 });
    }
    if (addOnRows.some((item) => !Number.isFinite(Number(item.daily_rate)) || Number(item.daily_rate) <= 0)) {
      return NextResponse.json({ error: 'A selected add-on has an invalid daily rate.' }, { status: 400 });
    }
    addOnDetails = addOnRows.map((item) => ({
      unit_id: String(item.unit_id),
      unit_name: item.unit_name,
      daily_rate: Number(item.daily_rate),
    }));
  }

  if (unit.requires_driver_license) {
    const { data: licenses, error: licenseError } = await admin
      .from('tbl_driver_license_verifications')
      .select('license_expiry_date')
      .eq('user_id', user.id)
      .eq('admin_status', 'approved');
    if (licenseError) return NextResponse.json({ error: licenseError.message }, { status: 500 });
    const hasValidLicense = (licenses ?? []).some(
      (license) => license.license_expiry_date && license.license_expiry_date >= endDate
    );
    if (!hasValidLicense) {
      return NextResponse.json(
        {
          code: 'driver_license_required',
          error:
            "A verified driver's license is required to rent this vehicle. Go to your Profile and complete Driver's License verification (the license must be valid through your rental end date).",
        },
        { status: 403 }
      );
    }
  }

  const requestedBlockEnd = addDays(endDate, 1);
  const { data: nearbyBookings, error: availabilityError } = await admin
    .from('tbl_bookings')
    .select('start_date, end_date, status, created_at')
    .eq('unit_id', unitId)
    .lte('start_date', requestedBlockEnd)
    .gte('end_date', addDays(startDate, -1));
  if (availabilityError) return NextResponse.json({ error: availabilityError.message }, { status: 500 });
  const hasBookingConflict = (nearbyBookings ?? []).some(
    (booking) =>
      isBookingBlockingUnit(booking.status, booking.created_at) &&
      booking.start_date <= requestedBlockEnd &&
      addDays(booking.end_date, 1) >= startDate
  );
  if (hasBookingConflict) {
    return NextResponse.json(
      { error: 'Selected unit is already booked for the requested dates (including the buffer day).' },
      { status: 409 }
    );
  }
  for (const addOnId of addOnIds) {
    // addon_details is a jsonb column. supabase-js turns a plain JS array into a
    // Postgres array literal ({[object Object]}), which causes
    // "invalid input syntax for type json". Pass the filter as a JSON string instead.
    const { data: addOnBookings, error: addOnBookingError } = await admin
      .from('tbl_bookings')
      .select('start_date, end_date, status, created_at')
      .contains('addon_details', JSON.stringify([{ unit_id: addOnId }]))
      .lte('start_date', requestedBlockEnd)
      .gte('end_date', addDays(startDate, -1));
    if (addOnBookingError) {
      return NextResponse.json({ error: addOnBookingError.message }, { status: 500 });
    }
    if (
      (addOnBookings ?? []).some(
        (booking) =>
          isBookingBlockingUnit(booking.status, booking.created_at) &&
          booking.start_date <= requestedBlockEnd &&
          addDays(booking.end_date, 1) >= startDate
      )
    ) {
      return NextResponse.json(
        { error: 'A selected add-on is already reserved for part of those dates. Choose a different add-on or date range.' },
        { status: 409 }
      );
    }
  }

  const { data: overlappingBlocks, error: blocksError } = await admin
    .from('tbl_unit_blocked_dates')
    .select('id')
    .eq('unit_id', unitId)
    .gte('blocked_date', startDate)
    .lte('blocked_date', endDate)
    .limit(1);
  if (blocksError) return NextResponse.json({ error: blocksError.message }, { status: 500 });
  if (overlappingBlocks?.length) {
    return NextResponse.json({ error: 'Selected unit is unavailable for the requested dates.' }, { status: 409 });
  }

  const dailyRate = Number(unit.daily_rate);
  if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
    return NextResponse.json({ error: 'Unit daily rate is invalid or missing.' }, { status: 400 });
  }
  const addOnDailyRate = addOnDetails.reduce((sum, item) => sum + item.daily_rate, 0);
  const { rentalDays, rentalFee, addOnFee, securityFee, total: totalAmount } = calculateBooking({
    dailyRate,
    startDate,
    endDate,
    addOnDailyRate,
  });

  const bookingId = crypto.randomUUID();
  const agreementImagePath = `${user.id}/${agreementUploadId}/signed-agreement.png`;
  const agreementStorage = admin.storage.from('rental-agreements');
  const { error: agreementUploadError } = await agreementStorage.upload(agreementImagePath, agreementImage, {
    cacheControl: '3600',
    contentType: 'image/png',
    upsert: false,
  });
  if (agreementUploadError) {
    const { data: existingImage, error: existingImageError } = await agreementStorage.download(agreementImagePath);
    if (!existingImageError && existingImage) {
      const existingImageBuffer = Buffer.from(await existingImage.arrayBuffer());
      if (!existingImageBuffer.equals(agreementImage)) {
        return NextResponse.json(
          { code: 'agreement_image_upload_failed', error: 'This agreement upload ID is already associated with a different image.' },
          { status: 409 }
        );
      }
    } else {
      return NextResponse.json(
        { code: 'agreement_image_upload_failed', error: `Unable to save the signed Rental Agreement image: ${agreementUploadError.message}` },
        { status: 502 }
      );
    }
  }

  const { data: booking, error: bookingError } = await admin
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
      security_fee_refundable: false,
      total_amount: totalAmount,
      addon_details: addOnDetails,
      status: BOOKING_STATUS.PENDING_PAYMENT,
      created_at: new Date().toISOString(),
      rental_agreement_accepted: true,
      rental_agreement_signed_at: new Date().toISOString(),
      rental_agreement_signature_data: signatureData,
      agreement_image_path: agreementImagePath,
    })
    .select('*')
    .single();
  if (bookingError || !booking) {
    const { error: cleanupError } = await agreementStorage.remove([agreementImagePath]);
    if (cleanupError) console.error('[BOOKING_AGREEMENT_CLEANUP_ERROR]', cleanupError);
    return NextResponse.json(
      { code: 'agreement_not_saved', error: bookingError?.message ?? 'Unable to create booking record.' },
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
      metadata: { booking_id: bookingId, user_id: user.id, unit_id: unitId },
      referenceNumber: bookingId,
    });
  } catch (checkoutError) {
    await admin.from('tbl_bookings').update({ status: 'payment_setup_failed' }).eq('booking_id', bookingId);
    return NextResponse.json(
      { error: checkoutError instanceof Error ? checkoutError.message : 'Unable to create PayMongo checkout session.' },
      { status: 502 }
    );
  }
  if (!checkout.id || !checkout.checkout_url) {
    await admin.from('tbl_bookings').update({ status: 'payment_setup_failed' }).eq('booking_id', bookingId);
    return NextResponse.json({ error: 'PayMongo did not return a checkout URL.' }, { status: 502 });
  }

  const paymentId = crypto.randomUUID();
  const { error: paymentError } = await admin.from('tbl_payments').insert({
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
    await admin.from('tbl_bookings').update({ status: 'payment_setup_failed' }).eq('booking_id', bookingId);
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({
    booking,
    payment: { payment_id: paymentId, payment_method: paymentMethod, payment_status: 'pending' },
    checkout_url: checkout.checkout_url,
    total_amount: totalAmount,
    rental_fee: rentalFee,
    addon_fee: addOnFee,
    security_fee: securityFee,
    rental_days: rentalDays,
    daily_rate: dailyRate,
  });
}

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
    return NextResponse.json(
      { error: 'A valid booking_id and cancel action are required.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: booking, error: lookupError } = await admin
    .from('tbl_bookings')
    .select('booking_id, status')
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) {
    return NextResponse.json({ error: 'Only a booking awaiting payment can be cancelled this way.' }, { status: 409 });
  }

  const { data: updated, error: updateError } = await admin
    .from('tbl_bookings')
    .update({ status: BOOKING_STATUS.CANCELLED, cancelled_at: new Date().toISOString() })
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .eq('status', BOOKING_STATUS.PENDING_PAYMENT)
    .select('booking_id')
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Booking is no longer awaiting payment.' }, { status: 409 });

  const { error: paymentUpdateError } = await admin
    .from('tbl_payments')
    .update({ payment_status: 'cancelled' })
    .eq('booking_id', bookingId)
    .eq('payment_status', 'pending');
  if (paymentUpdateError) {
    return NextResponse.json({ error: paymentUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    booking_id: bookingId,
    status: BOOKING_STATUS.CANCELLED,
    payment_status: 'cancelled',
  });
}