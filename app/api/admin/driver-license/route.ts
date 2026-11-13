import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase_server";
import { createAdminClient } from "@/lib/supabase_admin";
import { notify } from "@/lib/notify";

const LICENSE_TABLE = "tbl_driver_license_verifications";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMPLETED_DIDIT_STATUSES = ["Approved", "In Review"];

async function authorizeStaff() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") {
    return {
      response: NextResponse.json(
        { error: "Multi-factor authentication is required." },
        { status: 403 }
      ),
    };
  }

  const admin = createAdminClient();
  const { data: staff, error: staffError } = await admin
    .from("staff_roles")
    .select("user_id, role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    staffError ||
    !staff ||
    staff.status !== "active" ||
    !["admin", "sysadmin"].includes(staff.role)
  ) {
    return {
      response: NextResponse.json(
        { error: "You are not authorized to review driver's licenses." },
        { status: 403 }
      ),
    };
  }

  return { response: null, userId: user.id, admin };
}

// GET /api/admin/driver-license
// Pending submissions whose Didit session has finished.
export async function GET() {
  try {
    const auth = await authorizeStaff();
    if (auth.response) return auth.response;
    const admin = auth.admin!;

    const { data, error } = await admin
      .from(LICENSE_TABLE)
      .select(
        "id, user_id, didit_session_id, didit_status, admin_status, rejection_reason, license_expiry_date, created_at, updated_at"
      )
      .eq("admin_status", "pending")
      .in("didit_status", COMPLETED_DIDIT_STATUSES)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load license submissions:", error.message);
      return NextResponse.json({ error: "Failed to load license submissions." }, { status: 500 });
    }

    const submissions = data ?? [];
    if (submissions.length === 0) return NextResponse.json({ submissions: [] });

    const userIds = [...new Set(submissions.map((s) => s.user_id))];
    const { data: renters, error: rentersError } = await admin
      .from("tbl_users")
      .select("user_id, first_name, last_name, email, phone_number")
      .in("user_id", userIds);

    if (rentersError) {
      console.error("Failed to load renter details:", rentersError.message);
      return NextResponse.json({ error: "Failed to load renter details." }, { status: 500 });
    }

    const renterMap = new Map((renters ?? []).map((r) => [r.user_id, r]));
    return NextResponse.json({
      submissions: submissions.map((s) => ({ ...s, renter: renterMap.get(s.user_id) ?? null })),
    });
  } catch (error) {
    console.error("Unexpected license queue error:", error);
    return NextResponse.json({ error: "Unexpected error loading submissions." }, { status: 500 });
  }
}

// POST /api/admin/driver-license
// Body: { licenseId, decision: "approved" | "rejected", reason?, expiryDate? (YYYY-MM-DD, required to approve) }
export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeStaff();
    if (auth.response) return auth.response;
    const admin = auth.admin!;

    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const payload = body as Record<string, unknown>;

    const licenseId = payload.licenseId;
    const decision = payload.decision;
    const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
    const expiryDate = typeof payload.expiryDate === "string" ? payload.expiryDate.trim() : "";

    if (typeof licenseId !== "string" || !UUID_RE.test(licenseId)) {
      return NextResponse.json({ error: "A valid submission ID is required." }, { status: 400 });
    }
    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json({ error: "Decision must be approved or rejected." }, { status: 400 });
    }
    if (decision === "rejected" && !reason) {
      return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
    }
    if (reason.length > 1000) {
      return NextResponse.json({ error: "The reason must not exceed 1000 characters." }, { status: 400 });
    }
    if (decision === "approved") {
      const parsed = new Date(`${expiryDate}T00:00:00.000Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate) ||
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== expiryDate
      ) {
        return NextResponse.json(
          { error: "Enter the license expiry date (YYYY-MM-DD) to approve." },
          { status: 400 }
        );
      }
    }

    const { data: submission, error: lookupError } = await admin
      .from(LICENSE_TABLE)
      .select("id, user_id, admin_status, didit_status")
      .eq("id", licenseId)
      .maybeSingle();

    if (lookupError) {
      console.error("License lookup failed:", lookupError.message);
      return NextResponse.json({ error: "Failed to retrieve the submission." }, { status: 500 });
    }
    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }
    if (submission.admin_status !== "pending") {
      return NextResponse.json({ error: "This submission was already reviewed." }, { status: 409 });
    }
    if (decision === "approved" && !COMPLETED_DIDIT_STATUSES.includes(submission.didit_status ?? "")) {
      return NextResponse.json(
        { error: "The renter has not completed license verification with Didit yet." },
        { status: 409 }
      );
    }

    const { data: result, error: decisionError } = await admin.rpc("admin_decide_driver_license", {
      p_id: licenseId,
      p_admin_id: auth.userId!,
      p_decision: decision,
      p_reason: decision === "rejected" ? reason : null,
      p_expiry: decision === "approved" ? expiryDate : null,
    });

    if (decisionError) {
      console.error("License decision failed:", decisionError.message);
      return NextResponse.json(
        {
          error:
            decisionError.message.includes("valid_expiry_required")
              ? "The expiry date must be today or later."
              : "The decision could not be completed. Refresh the queue and try again.",
        },
        { status: 409 }
      );
    }

    const notified = await notify(
      submission.user_id,
      decision === "approved"
        ? `Your driver's license was verified. You can now book vehicles. It is valid through ${expiryDate}.`
        : `Your driver's license verification was rejected. ${reason} You can submit it again from your profile.`,
      {
        title: decision === "approved" ? "Driver's license verified" : "Driver's license verification update",
        type: decision === "approved" ? "verification_license_approved" : "verification_license_rejected",
        link: "/renter/profile",
      }
    );
    if (!notified) {
      console.error("License decision saved, but the renter notification was not created.");
    }

    return NextResponse.json({
      success: true,
      message:
        decision === "approved"
          ? "Driver's license approved."
          : "Driver's license rejected.",
      result,
    });
  } catch (error) {
    console.error("Unexpected license decision error:", error);
    return NextResponse.json({ error: "Unexpected error reviewing the submission." }, { status: 500 });
  }
}
