import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';
import { isUuid } from '@/lib/uuid';
import { calculateBooking } from '@/lib/pricing';
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

  if (!unitId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'unit_id, start_date, and end_date are required.' },
      { status: 400 }
    );
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

    const { rentalDays, rentalFee, securityFee, total } = calculateBooking({
      dailyRate,
      startDate,
      endDate,
    });

    return NextResponse.json({
      unit,
      start_date: startDate,
      end_date: endDate,
      pickup_date: pickupDate || null,
      rental_days: rentalDays,
      daily_rate: dailyRate,
      rental_fee: rentalFee,
      security_fee: securityFee,
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