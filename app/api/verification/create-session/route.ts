import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase_server";

const KYC_TABLE = "tbl_kyc"; 
// POST /api/verification/create-session
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const response = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "x-api-key": process.env.DIDIT_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: process.env.DIDIT_WORKFLOW_ID,
        vendor_data: user.id,
        callback: `${process.env.NEXT_PUBLIC_SITE_URL}/renter/verification/callback`,
        callback_method: "both",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Didit session creation failed:", errText);
      return NextResponse.json({ error: "Verification setup failed" }, { status: 502 });
    }

    const session = await response.json();

    const { error: kycError } = await supabase
  .from(KYC_TABLE)
  .insert({
    user_id: user.id,
    document_type: "identity_verification",
    file_url: session.url,
    didit_session_id: session.session_id,
  });

if (kycError) {
  console.error("FAILED KYC INSERT");
  console.error("code:", kycError.code);
  console.error("message:", kycError.message);
  console.error("details:", kycError.details);
  console.error("hint:", kycError.hint);

  return NextResponse.json(
    { error: "Failed to create KYC record" },
    { status: 500 }
  );
}
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Didit session creation error:", err);
    return NextResponse.json({ error: "Verification setup failed" }, { status: 500 });
  }
}