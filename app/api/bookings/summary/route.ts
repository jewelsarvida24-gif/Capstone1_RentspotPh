import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { isUuid } from '@/lib/uuid';
import {
  calculateBooking,
  calculateRentalDays,
  isAddOnCategory,
  isCameraCategory,
  MAX_RENTAL_DAYS,
  type BookingAddOn,
} from '@/lib/pricing';
import { isBookingBlockingUnit } from '@/lib/unit-booking-rules';

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitId = String(searchParams.get('unit_id') ?? '').trim();
  const startDate = String(searchParams.get('start_date') ?? '').trim();
  const endDate = String(searchParams.get('end_date') ?? '').trim();
  const pickupDate = String(searchParams.get('pickup_date') ?? '').trim();
  const requestedAddOnIds = [...new Set(searchParams.getAll('addon_id').map((id) => id.trim()).filter(Boolean))];

  if (!unitId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'unit_id, start_date, and end_date are required.' },
      { status: 400 }
    );
  }
  if (requestedAddOnIds.some((id) => !isUuid(id))) {
    return NextResponse.json({ error: 'Every add-on must have a valid unit ID.' }, { status: 400 });
  }

  if (!isUuid(unitId)) {
    return NextResponse.json(
      { error: 'This unit is currently unavailable for online booking.' },
      { status: 400 }
    );
  }

  // 1-day rentals are allowed (start === end).
  if (!isDate(startDate) || !isDate(endDate) || endDate < startDate) {
    return NextResponse.json(
      { error: 'Provide valid dates; end_date cannot be earlier than start_date.' },
      { status: 400 }
    );
  }

  if (calculateRentalDays(startDate, endDate) > MAX_RENTAL_DAYS) {
    return NextResponse.json(
      { error: `The maximum rental period is ${MAX_RENTAL_DAYS} days.` },
      { status: 400 }
    );
  }

  if (pickupDate) {
    if (!isDate(pickupDate) || pickupDate < startDate || pickupDate > endDate) {
      return NextResponse.json(
        { error: 'pickup_date must be a valid date between start_date and end_date.' },
        { status: 400 }
      );
    }
  }

  try {
    const supabase = createAdminClient();

    const { data: unit, error } = await supabase
      .from('tbl_units')
      .select('unit_id, unit_name, category, description, daily_rate, status, image_url, created_at')
      .eq('unit_id', unitId)
      .maybeSingle();

    if (error) {
      console.error('Supabase tbl_units query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
    }
    if (isAddOnCategory(unit.category)) {
      return NextResponse.json(
        { error: 'Add-on items cannot be booked separately. Choose a camera rental to include an add-on.' },
        { status: 400 }
      );
    }

    const dailyRate = Number(unit.daily_rate);

    if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
      return NextResponse.json(
        { error: 'Unit daily rate is invalid or missing.' },
        { status: 400 }
      );
    }

    if (unit.status !== 'available') {
      return NextResponse.json(
        { error: 'Selected unit is not available for booking.' },
        { status: 409 }
      );
    }

    if (requestedAddOnIds.length > 0 && !isCameraCategory(unit.category)) {
      return NextResponse.json({ error: 'Add-ons can only be included with camera rentals.' }, { status: 400 });
    }

    let addOns: BookingAddOn[] = [];
    if (requestedAddOnIds.length > 0) {
      const { data: addOnRows, error: addOnError } = await supabase
        .from('tbl_units')
        .select('unit_id, unit_name, category, daily_rate, status')
        .in('unit_id', requestedAddOnIds);
      if (addOnError) return NextResponse.json({ error: addOnError.message }, { status: 500 });

      if (
        !addOnRows ||
        addOnRows.length !== requestedAddOnIds.length ||
        addOnRows.some((item) => item.status !== 'available' || !isAddOnCategory(item.category))
      ) {
        return NextResponse.json({ error: 'One or more selected add-ons are unavailable.' }, { status: 409 });
      }

      if (addOnRows.some((item) => !Number.isFinite(Number(item.daily_rate)) || Number(item.daily_rate) <= 0)) {
        return NextResponse.json({ error: 'A selected add-on has an invalid daily rate.' }, { status: 400 });
      }

      addOns = addOnRows.map((item) => ({
        unit_id: String(item.unit_id),
        unit_name: item.unit_name,
        daily_rate: Number(item.daily_rate),
      }));
    }

    // Same buffer rule as POST /api/bookings: each booking blocks start_date .. end_date + 1 day.
    const requestedBlockEnd = addDays(endDate, 1);
    const { data: nearbyBookings, error: availabilityError } = await supabase
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
        isBookingBlockingUnit(b.status, b.created_at) &&
        b.start_date <= requestedBlockEnd &&
        addDays(b.end_date, 1) >= startDate
    );
    if (hasConflict) {
      return NextResponse.json(
        { error: 'Selected unit is already booked for the requested dates (including the buffer day).' },
        { status: 409 }
      );
    }

    for (const addOn of addOns) {
      // addon_details is a jsonb column. supabase-js turns a plain JS array into a
      // Postgres array literal ({[object Object]}), which causes
      // "invalid input syntax for type json". Pass the filter as a JSON string instead.
      const { data: addOnBookings, error: addOnBookingError } = await supabase
        .from('tbl_bookings')
        .select('start_date, end_date, status, created_at')
        .contains('addon_details', JSON.stringify([{ unit_id: addOn.unit_id }]))
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
          { error: `The add-on "${addOn.unit_name}" is already reserved for part of those dates.` },
          { status: 409 }
        );
      }
    }

    const addOnDailyRate = addOns.reduce((sum, item) => sum + item.daily_rate, 0);
    const { rentalDays, rentalFee, addOnFee, securityFee, total } = calculateBooking({
      dailyRate,
      startDate,
      endDate,
      addOnDailyRate,
    });

    return NextResponse.json({
      unit,
      start_date: startDate,
      end_date: endDate,
      pickup_date: pickupDate || null,
      rental_days: rentalDays,
      daily_rate: dailyRate,
      addon_details: addOns,
      addon_daily_rate: addOnDailyRate,
      rental_fee: rentalFee,
      addon_fee: addOnFee,
      security_fee: securityFee,
      security_fee_refundable: false,
      total_amount: total,
    });
  } catch (error) {
    console.error('[RP-57] Supabase admin client init error:', error);
    return NextResponse.json(
      { error: 'Supabase configuration error' },
      { status: 500 }
    );
  }
}