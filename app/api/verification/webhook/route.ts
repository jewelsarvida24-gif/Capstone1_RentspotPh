// app/api/webhook/didit/route.ts
import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase_admin"; // service-role client

function shortenFloats(data: any): any {
  if (Array.isArray(data)) return data.map(shortenFloats);
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, shortenFloats(v)]));
  }
  return data;
}
function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).sort().reduce((acc: any, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
  }
  return obj;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature-V2");
  const timestamp = req.headers.get("X-Timestamp");

  if (!signature || !timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return NextResponse.json({ error: "Invalid or stale request" }, { status: 401 });
  }

  const canonical = JSON.stringify(sortKeys(shortenFloats(JSON.parse(rawBody))));
  const expected = crypto.createHmac("sha256", process.env.DIDIT_WEBHOOK_SECRET!).update(canonical, "utf8").digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const { session_id, status, vendor_data } = payload; // vendor_data = user_id

  const supabase = createAdminClient();
  await supabase
    .from("tbl_kyc_submissions")
    .update({ status })
    .eq("session_id", session_id)
    .eq("user_id", vendor_data);

  return NextResponse.json({ received: true });
}