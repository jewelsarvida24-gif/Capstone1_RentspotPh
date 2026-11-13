import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase_server";
import { createAdminClient } from "@/lib/supabase_admin";

const KYC_TABLE = "tbl_kyc";
const LICENSE_TABLE = "tbl_driver_license_verifications";

function todayInManila() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

// POST /api/verification/create-session
// Body: { type?: "identity" | "driver_license" }  (default: identity)
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const type = body?.type === "driver_license" ? "driver_license" : "identity";
  const admin = createAdminClient();

  let workflowId = process.env.DIDIT_WORKFLOW_ID;

  if (type === "driver_license") {
    workflowId = process.env.DIDIT_LICENSE_WORKFLOW_ID;
    if (!workflowId) {
      console.error("DIDIT_LICENSE_WORKFLOW_ID is not configured.");
      return NextResponse.json(
        { error: "Driver's license verification is not available yet." },
        { status: 500 }
      );
    }

    // Identity must be approved first.
    const { data: kyc } = await admin
      .from(KYC_TABLE)
      .select("admin_status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (kyc?.admin_status?.toLowerCase() !== "approved") {
      return NextResponse.json(
        { error: "Verify your identity first, then you can verify your driver's license." },
        { status: 403 }
      );
    }

    const { data: existing, error: existingError } = await admin
      .from(LICENSE_TABLE)
      .select("admin_status, didit_status, license_expiry_date")
      .eq("user_id", user.id)
      .in("admin_status", ["approved", "pending"]);

    if (existingError) {
      console.error("License lookup failed:", existingError.message);
      return NextResponse.json({ error: "Verification setup failed" }, { status: 500 });
    }

    const today = todayInManila();
    const alreadyVerified = (existing ?? []).some(
      (row) =>
        row.admin_status === "approved" &&
        row.license_expiry_date &&
        row.license_expiry_date >= today
    );
    if (alreadyVerified) {
      return NextResponse.json(
        { error: "Your driver's license is already verified." },
        { status: 409 }
      );
    }

    const awaitingReview = (existing ?? []).some(
      (row) =>
        row.admin_status === "pending" &&
        ["Approved", "In Review"].includes(row.didit_status ?? "")
    );
    if (awaitingReview) {
      return NextResponse.json(
        { error: "Your driver's license is already waiting for admin review." },
        { status: 409 }
      );
    }
  }

  try {
    const callbackBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    const callbackUrl = new URL(
      "/renter/verification/callback",
      callbackBaseUrl
    ).toString();

    const response = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "x-api-key": process.env.DIDIT_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: user.id,
        callback: callbackUrl,
        callback_method: "both",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Didit session creation failed:", errText);
      return NextResponse.json({ error: "Verification setup failed" }, { status: 502 });
    }

    const session = await response.json();

    // Service-role client: renters must not be able to write verification rows themselves.
    // user_id always comes from the authenticated session, never from the request.
    const { error: insertError } =
      type === "driver_license"
        ? await admin.from(LICENSE_TABLE).insert({
            user_id: user.id,
            didit_session_id: session.session_id,
            session_url: session.url,
          })
        : await admin.from(KYC_TABLE).insert({
            user_id: user.id,
            document_type: "identity_verification",
            file_url: session.url,
            didit_session_id: session.session_id,
          });

    if (insertError) {
      console.error("FAILED VERIFICATION INSERT", type);
      console.error("code:", insertError.code);
      console.error("message:", insertError.message);
      console.error("details:", insertError.details);
      console.error("hint:", insertError.hint);

      return NextResponse.json(
        { error: "Failed to create verification record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Didit session creation error:", err);
    return NextResponse.json({ error: "Verification setup failed" }, { status: 500 });
  }
}
