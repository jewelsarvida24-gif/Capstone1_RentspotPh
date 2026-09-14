import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase_admin';

function dayDifferenceInDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitId = String(searchParams.get('unit_id') ?? '').trim();
  const startDate = String(searchParams.get('start_date') ?? '').trim();
  const endDate = String(searchParams.get('end_date') ?? '').trim();

  if (!unitId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'unit_id, start_date, and end_date are required.' },
      { status: 400 }
    );
  }

  const rentalDays = dayDifferenceInDays(startDate, endDate);

  if (!rentalDays) {
    return NextResponse.json(
      { error: 'end_date must be later than start_date.' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: unit, error } = await supabase
    .from('tbl_units')
    .select('unit_id, category, description, daily_rate, status, image_url, created_at')
    .eq('unit_id', unitId)
    .maybeSingle();

  if (error) {
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

  if (unit.status && unit.status !== 'available') {
    return NextResponse.json(
      { error: 'Selected unit is not available for booking.' },
      { status: 409 }
    );
  }

  const totalAmount = Number((dailyRate * rentalDays).toFixed(2));

  return NextResponse.json({
    unit,
    start_date: startDate,
    end_date: endDate,
    rental_days: rentalDays,
    daily_rate: dailyRate,
    total_amount: totalAmount,
  });
}
