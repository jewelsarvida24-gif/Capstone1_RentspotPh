import { NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/admin-api-auth";
import { createAdminClient } from "@/lib/supabase_admin";
import { isUuid } from "@/lib/uuid";
import { isBookingBlockingUnit } from "@/lib/unit-booking-rules";

type RouteContext = { params: Promise<{ unitId: string }> };

type BlockedDateRow = {
  id: string;
  blocked_date: string;
  reason: string | null;
};

type DateBlock = {
  block_id: string;
  date_ids: Record<string, string>;
  start_date: string;
  end_date: string;
  reason: string | null;
};

function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function groupBlockedDates(rows: BlockedDateRow[]): DateBlock[] {
  const sortedRows = [...rows].sort((a, b) =>
    a.blocked_date.localeCompare(b.blocked_date)
  );
  const groups: DateBlock[] = [];

  for (const row of sortedRows) {
    const previous = groups.at(-1);
    if (
      previous &&
      previous.reason === row.reason &&
      addDays(previous.end_date, 1) === row.blocked_date
    ) {
      previous.end_date = row.blocked_date;
      previous.date_ids[row.blocked_date] = row.id;
    } else {
      groups.push({
        block_id: row.id,
        date_ids: { [row.blocked_date]: row.id },
        start_date: row.blocked_date,
        end_date: row.blocked_date,
        reason: row.reason,
      });
    }
  }
  return groups;
}

function getToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

async function getAuthorizedUnit(unitId: string) {
  const user = await getAdminApiUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      admin: null,
    };
  }
  if (!isUuid(unitId)) {
    return {
      response: NextResponse.json({ error: "A valid unit_id is required." }, { status: 400 }),
      admin: null,
    };
  }

  const admin = createAdminClient();
  const { data: unit, error } = await admin
    .from("tbl_units")
    .select("unit_id")
    .eq("unit_id", unitId)
    .maybeSingle();

  if (error) {
    return { response: NextResponse.json({ error: error.message }, { status: 500 }), admin: null };
  }
  if (!unit) {
    return { response: NextResponse.json({ error: "Unit not found." }, { status: 404 }), admin: null };
  }
  return { response: null, admin };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { unitId } = await params;
  const { response, admin } = await getAuthorizedUnit(unitId);
  if (response) return response;
  if (!admin) return NextResponse.json({ error: "Unable to authorize unit access." }, { status: 500 });

  const [{ data: bookings, error: bookingsError }, { data: blocks, error: blocksError }] =
    await Promise.all([
      admin
        .from("tbl_bookings")
        .select("start_date, end_date, status, created_at")
        .eq("unit_id", unitId)
        .order("start_date", { ascending: true }),
      admin
        .from("tbl_unit_blocked_dates")
        .select("id, blocked_date, reason")
        .eq("unit_id", unitId)
        .order("blocked_date", { ascending: true }),
    ]);

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }
  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  return NextResponse.json({
    bookings: (bookings ?? []).filter((booking) =>
      isBookingBlockingUnit(booking.status, booking.created_at)
    ),
    blocks: groupBlockedDates((blocks ?? []) as BlockedDateRow[]),
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { unitId } = await params;
  const { response, admin } = await getAuthorizedUnit(unitId);
  if (response) return response;
  if (!admin) return NextResponse.json({ error: "Unable to authorize unit access." }, { status: 500 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  const { start_date: startDate, end_date: endDate } = payload;
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";

  if (
    !isValidDateOnly(startDate) ||
    !isValidDateOnly(endDate) ||
    endDate < startDate ||
    startDate < getToday() ||
    reason.length > 200
  ) {
    return NextResponse.json(
      { error: "Provide a future date range and a reason of 200 characters or fewer." },
      { status: 400 }
    );
  }

  const { data: overlappingBookings, error: bookingsError } = await admin
    .from("tbl_bookings")
    .select("status, created_at")
    .eq("unit_id", unitId)
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }
  if ((overlappingBookings ?? []).some((booking) =>
    isBookingBlockingUnit(booking.status, booking.created_at)
  )) {
    return NextResponse.json(
      { error: "These dates overlap an active booking and cannot be blocked." },
      { status: 409 }
    );
  }

  const { data: overlappingBlocks, error: existingBlocksError } = await admin
    .from("tbl_unit_blocked_dates")
    .select("id")
    .eq("unit_id", unitId)
    .gte("blocked_date", startDate)
    .lte("blocked_date", endDate)
    .limit(1);

  if (existingBlocksError) {
    return NextResponse.json({ error: existingBlocksError.message }, { status: 500 });
  }
  if ((overlappingBlocks ?? []).length > 0) {
    return NextResponse.json(
      { error: "These dates overlap an existing unavailable date block." },
      { status: 409 }
    );
  }

  const blockDates: { unit_id: string; blocked_date: string; reason: string | null }[] = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    blockDates.push({
      unit_id: unitId,
      blocked_date: date,
      reason: reason || null,
    });
  }
  const { data: createdRows, error: blockError } = await admin
    .from("tbl_unit_blocked_dates")
    .insert(blockDates)
    .select("id, blocked_date, reason");

  if (blockError) {
    return NextResponse.json({ error: blockError.message }, { status: 500 });
  }
  const createdBlocks = groupBlockedDates((createdRows ?? []) as BlockedDateRow[]);
  return NextResponse.json({ blocks: createdBlocks }, { status: 201 });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { unitId } = await params;
  const { response, admin } = await getAuthorizedUnit(unitId);
  if (response) return response;
  if (!admin) return NextResponse.json({ error: "Unable to authorize unit access." }, { status: 500 });

  const blockIds = new URL(request.url).searchParams.getAll("block_id");
  if (blockIds.length === 0 || blockIds.some((blockId) => !isUuid(blockId))) {
    return NextResponse.json({ error: "Valid block_id values are required." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("tbl_unit_blocked_dates")
    .delete()
    .eq("unit_id", unitId)
    .in("id", blockIds)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length !== blockIds.length) {
    return NextResponse.json({ error: "One or more date blocks were not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
