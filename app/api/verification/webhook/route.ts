import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const KYC_TABLE = "tbl_kyc"; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function mapDiditStatus(diditStatus: string): "pending" | "approved" | "rejected" | "flagged" {
  switch (diditStatus) {
    case "Approved":
      return "approved";
    case "Declined":
      return "rejected";
    case "In Review":
    case "Resubmitted":
      return "flagged"; 
    default:
      return "pending"; // Not Started, In Progress, Awaiting User, Abandoned, Expired, Kyc Expired
  }
}

function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = sortKeys(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}

function shortenFloats(data: any): any {
  if (Array.isArray(data)) return data.map(shortenFloats);
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, shortenFloats(v)]));
  }
  if (typeof data === "number" && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data);
  }
  return data;
}

function verifySignatureV2(
  parsedBody: any,
  signatureHeader: string,
  timestampHeader: string,
  secret: string
): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestampHeader, 10)) > 300) return false; // reject stale (>5 min)

  const canonical = JSON.stringify(sortKeys(shortenFloats(parsedBody)));
  const expected = crypto.createHmac("sha256", secret).update(canonical, "utf8").digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const signatureV2 = req.headers.get("x-signature-v2");
  const timestamp = req.headers.get("x-timestamp");
  const secret = process.env.DIDIT_SIGNING_SECRET as string;

  if (!signatureV2 || !timestamp || !secret) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
  }

  if (!verifySignatureV2(body, signatureV2, timestamp, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { session_id, status, vendor_data, webhook_type } = body;
  // status is one of: Not Started | In Progress | Approved | Declined | In Review |
  //                    Abandoned | Resubmitted | Expired | Kyc Expired | Awaiting User

  if (webhook_type !== "status.updated" && webhook_type !== "data.updated") {
    return NextResponse.json({ received: true, ignored: webhook_type });
  }

  const isFinal = status === "Approved" || status === "Declined";
  const kycStatus = mapDiditStatus(status);

  const { data: updatedRows, error: kycError } = await supabase
  .from(KYC_TABLE)
  .update({
    didit_status: kycStatus,
    updated_at: new Date().toISOString(),
  })
  .eq("didit_session_id", session_id)
  .select();

  if (kycError) {
    console.error(`Failed to update ${KYC_TABLE}:`, kycError);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  if (!updatedRows || updatedRows.length === 0) {
    console.warn(`No ${KYC_TABLE} row for session ${session_id}, vendor_data=${vendor_data}`);
  }

  console.log(
  `Session ${session_id} for user ${vendor_data} → Didit:${status} / mapped:${kycStatus} / Admin:pending`
);

  return NextResponse.json({ received: true });
}