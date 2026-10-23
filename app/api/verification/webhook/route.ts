import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const KYC_TABLE = "tbl_kyc";

const ALLOWED_DIDIT_STATUSES = new Set([
  "Not Started",
  "In Progress",
  "Approved",
  "Declined",
  "In Review",
  "Abandoned",
  "Resubmitted",
  "Expired",
  "Kyc Expired",
  "Awaiting User",
]);

type WebhookBody = Record<string, unknown>;

function shortenFloats(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(shortenFloats);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(
        ([key, item]) => [key, shortenFloats(item)]
      )
    );
  }

  // JSON.parse converts whole-number values such as 3.0 to 3.
  return value;
}

/**
 * Produces compact JSON with object keys sorted lexicographically.
 * Entries are emitted directly so integer-like keys are not reordered
 * by rebuilding a JavaScript object.
 */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;

    return `{${Object.keys(object)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalJson(object[key])}`
      )
      .join(",")}}`;
  }

  const serialized = JSON.stringify(value);

  if (serialized === undefined) {
    throw new Error("Unable to serialize webhook payload");
  }

  return serialized;
}

function verifySignatureV2(
  body: WebhookBody,
  signature: string,
  timestampHeader: string,
  secret: string
): boolean {
  const timestamp = Number(body.timestamp);

  // Validate both the signed payload timestamp and the header.
  if (
    !Number.isFinite(timestamp) ||
    timestamp <= 0 ||
    String(timestamp) !== timestampHeader ||
    Math.abs(Date.now() / 1000 - timestamp) > 300
  ) {
    return false;
  }

  // Didit V2 signs canonical JSON, not the raw request body.
  const canonicalPayload = canonicalJson(shortenFloats(body));

  const expected = crypto
    .createHmac("sha256", secret)
    .update(canonicalPayload, "utf8")
    .digest();

  // Only accept a 64-character hexadecimal SHA-256 signature.
  if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
    return false;
  }

  const received = Buffer.from(signature, "hex");

  if (received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(received, expected);
}

export async function POST(req: NextRequest) {
  // Parse JSON safely before processing any payload fields.
  let body: WebhookBody;

  try {
    const parsed: unknown = await req.json();

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    body = parsed as WebhookBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const signature = req.headers.get("x-signature-v2") ?? "";
  const timestampHeader = req.headers.get("x-timestamp") ?? "";
  const secret = process.env.DIDIT_SIGNING_SECRET;

  if (!signature || !timestampHeader || !secret) {
    console.error("Didit webhook authentication configuration is missing.");

    return NextResponse.json(
      { error: "Webhook authentication failed" },
      { status: 401 }
    );
  }

  if (!verifySignatureV2(body, signature, timestampHeader, secret)) {
    return NextResponse.json(
      { error: "Invalid webhook signature or timestamp" },
      { status: 401 }
    );
  }

  // Only use payload values after signature verification.
  const sessionId = body.session_id;
  const status = body.status;
  const webhookType = body.webhook_type;

  if (
    typeof sessionId !== "string" ||
    !sessionId ||
    typeof webhookType !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing required webhook fields" },
      { status: 400 }
    );
  }

  // Ignore events this endpoint does not process.
  if (
    webhookType !== "status.updated" &&
    webhookType !== "data.updated"
  ) {
    return NextResponse.json({
      received: true,
      ignored: webhookType,
    });
  }

  if (
    typeof status !== "string" ||
    !ALLOWED_DIDIT_STATUSES.has(status)
  ) {
    console.warn("Didit webhook received an unsupported status.");

    return NextResponse.json({
      received: true,
      ignored: "unsupported_status",
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase webhook configuration is missing.");

    return NextResponse.json(
      { error: "Webhook service unavailable" },
      { status: 500 }
    );
  }

  // Service-role client must remain server-side only.
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: updatedRows, error } = await supabase
    .from(KYC_TABLE)
    .update({
      // Preserve Didit's original status.
      didit_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("didit_session_id", sessionId)
    .select("id");

  if (error) {
    console.error("Failed to update KYC status:", error.message);

    return NextResponse.json(
      { error: "Database update failed" },
      { status: 500 }
    );
  }

  if (!updatedRows || updatedRows.length === 0) {
    // Return a server error so Didit can retry a potentially transient failure.
    console.error("No KYC record matched the verified Didit session.");

    return NextResponse.json(
      { error: "KYC session record not found" },
      { status: 500 }
    );
  }

  // Do not log session IDs, vendor data, or identity information.
  console.info("Didit KYC status synchronized.", {
    webhookType,
    status,
    recordsUpdated: updatedRows.length,
  });

  return NextResponse.json({ received: true });
}