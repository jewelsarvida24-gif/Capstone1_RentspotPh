import { NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/admin-api-auth";
import { isUuid } from "@/lib/uuid";

const MAX_RETURN_NOTE_LENGTH = 1000;

export async function POST(request: Request) {
  const adminUser = await getAdminApiUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const bookingId =
    typeof payload.booking_id === "string" ? payload.booking_id.trim() : "";
  const returnCondition = payload.return_condition;
  const returnNote = payload.return_note;
  const isLate = payload.is_late;

  if (!isUuid(bookingId)) {
    return NextResponse.json({ error: "A valid booking_id is required." }, { status: 400 });
  }
  if (returnCondition !== "ok" && returnCondition !== "damaged") {
    return NextResponse.json(
      { error: "return_condition must be either 'ok' or 'damaged'." },
      { status: 400 }
    );
  }
  if (
    returnNote !== undefined &&
    returnNote !== null &&
    (typeof returnNote !== "string" || returnNote.trim().length > MAX_RETURN_NOTE_LENGTH)
  ) {
    return NextResponse.json(
      { error: `return_note must be ${MAX_RETURN_NOTE_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }
  if (typeof isLate !== "boolean") {
    return NextResponse.json({ error: "is_late must be a boolean." }, { status: 400 });
  }

  return NextResponse.json(
    {
      error:
        "Return processing is unavailable until the database completion operation is provided and integrated.",
    },
    { status: 503 }
  );
}
