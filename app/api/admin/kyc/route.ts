import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase_server";
import { createAdminClient } from "@/lib/supabase_admin";

const KYC_TABLE = "tbl_kyc";
const USERS_TABLE = "tbl_users";

const REVIEWABLE_DIDIT_STATUSES = ["Approved", "Declined"] as const;

type Decision = "approved" | "rejected";

type KycSubmission = {
id: string;
user_id: string;
document_type: string | null;
status: string | null;
didit_status: string | null;
admin_status: string | null;
rejection_reason: string | null;
created_at: string;
updated_at: string | null;
};

type KycRenter = {
user_id: string;
first_name: string | null;
last_name: string | null;
email: string | null;
phone_number: string | null;
};

type KycDecisionSubmission = {
id: string;
admin_status: string | null;
didit_status: string | null;
};

async function authorizeStaff() {
const supabase = await createClient();

const {
data: { user },
error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
return {
response: NextResponse.json(
{ error: "Authentication required." },
{ status: 401 }
),
userId: null,
adminSupabase: null,
};
}

// Require a completed MFA challenge.
const { data: assurance, error: assuranceError } =
await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

if (assuranceError || assurance?.currentLevel !== "aal2") {
return {
response: NextResponse.json(
{ error: "Multi-factor authentication is required." },
{ status: 403 }
),
userId: null,
adminSupabase: null,
};
}

// Service-role access is restricted to this server-side route.
const adminSupabase = createAdminClient();

const { data: staff, error: staffError } = await adminSupabase
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
{ error: "You are not authorized to manage KYC submissions." },
{ status: 403 }
),
userId: null,
adminSupabase: null,
};
}

return {
response: null,
userId: user.id,
adminSupabase,
};
}

// GET /api/admin/kyc
// Retrieve completed Didit submissions awaiting admin review.
export async function GET() {
try {
const auth = await authorizeStaff();

if (auth.response) {
  return auth.response;
}

const adminSupabase = auth.adminSupabase!;

const { data, error } = await adminSupabase
  .from(KYC_TABLE)
  .select(
    [
      "id",
      "user_id",
      "document_type",
      "status",
      "didit_status",
      "admin_status",
      "rejection_reason",
      "created_at",
      "updated_at",
    ].join(", ")
  )
  .eq("admin_status", "pending")
  .order("created_at", { ascending: true });

if (error) {
  console.error("Failed to retrieve KYC submissions:", error.message);

  return NextResponse.json(
    { error: "Failed to retrieve KYC submissions." },
    { status: 500 }
  );
}

// Explicitly type the result because the table name is stored in a variable.
const submissions = (data ?? []) as unknown as KycSubmission[];

if (submissions.length === 0) {
  return NextResponse.json({ submissions: [] });
}

const userIds = [
  ...new Set(submissions.map((submission) => submission.user_id)),
];

const { data: renterData, error: rentersError } = await adminSupabase
  .from(USERS_TABLE)
  .select("user_id, first_name, last_name, email, phone_number")
  .in("user_id", userIds);

if (rentersError) {
  console.error(
    "Failed to retrieve KYC renter details:",
    rentersError.message
  );

  return NextResponse.json(
    { error: "Failed to retrieve renter details." },
    { status: 500 }
  );
}

const renters = (renterData ?? []) as unknown as KycRenter[];

const renterMap = new Map(
  renters.map((renter) => [renter.user_id, renter])
);

const result = submissions.map((submission) => ({
  ...submission,
  renter: renterMap.get(submission.user_id) ?? null,
}));

return NextResponse.json({ submissions: result });

} catch (error) {
console.error("Unexpected KYC queue error:", error);

return NextResponse.json(
  {
    error:
      "An unexpected error occurred while loading KYC submissions.",
  },
  { status: 500 }
);

}
}

// POST /api/admin/kyc
// Approve or reject a submission through the existing database RPC.
export async function POST(req: NextRequest) {
try {
const auth = await authorizeStaff();


if (auth.response) {
  return auth.response;
}

const adminSupabase = auth.adminSupabase!;

let body: unknown;

try {
  body = await req.json();
} catch {
  return NextResponse.json(
    { error: "Invalid JSON request body." },
    { status: 400 }
  );
}

if (!body || typeof body !== "object" || Array.isArray(body)) {
  return NextResponse.json(
    { error: "Invalid request body." },
    { status: 400 }
  );
}

const payload = body as Record<string, unknown>;

const kycId = payload.kycId;
const decision = payload.decision;
const reason = payload.reason;

if (
  typeof kycId !== "string" ||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    kycId
  )
) {
  return NextResponse.json(
    { error: "A valid KYC submission ID is required." },
    { status: 400 }
  );
}

if (decision !== "approved" && decision !== "rejected") {
  return NextResponse.json(
    { error: "Decision must be approved or rejected." },
    { status: 400 }
  );
}

const normalizedDecision: Decision = decision;

const normalizedReason =
  typeof reason === "string" ? reason.trim() : "";

if (normalizedDecision === "rejected" && !normalizedReason) {
  return NextResponse.json(
    { error: "A rejection reason is required." },
    { status: 400 }
  );
}

if (normalizedReason.length > 1000) {
  return NextResponse.json(
    { error: "The rejection reason must not exceed 1000 characters." },
    { status: 400 }
  );
}

// Only completed Didit sessions can enter admin review.
const { data: submissionData, error: submissionError } =
  await adminSupabase
    .from(KYC_TABLE)
    .select("id, admin_status, didit_status")
    .eq("id", kycId)
    .maybeSingle();

if (submissionError) {
  console.error(
    "Failed to retrieve KYC submission:",
    submissionError.message
  );

  return NextResponse.json(
    { error: "Failed to retrieve the KYC submission." },
    { status: 500 }
  );
}

const submission =
  submissionData as unknown as KycDecisionSubmission | null;

if (!submission) {
  return NextResponse.json(
    { error: "KYC submission not found." },
    { status: 404 }
  );
}

if (submission.admin_status !== "pending") {
  return NextResponse.json(
    { error: "This KYC submission has already been reviewed." },
    { status: 409 }
  );
}

// The database function records the decision, synchronizes renter status,
// and creates the appropriate audit/history records.
const { data: result, error: decisionError } = await adminSupabase.rpc(
  "admin_decide_kyc",
  {
    p_kyc_id: kycId,
    p_admin_id: auth.userId!,
    p_decision: normalizedDecision,
    p_reason:
      normalizedDecision === "rejected" ? normalizedReason : null,
  }
);

if (decisionError) {
  console.error("KYC decision failed:", decisionError.message);

  return NextResponse.json(
    {
      error:
        "The KYC decision could not be completed. Refresh the queue and try again if the submission is still pending.",
    },
    { status: 409 }
  );
}

return NextResponse.json({
  success: true,
  message:
    normalizedDecision === "approved"
      ? "KYC submission approved successfully."
      : "KYC submission rejected successfully.",
  result,
});

} catch (error) {
console.error("Unexpected KYC decision error:", error);

return NextResponse.json(
  {
    error:
      "An unexpected error occurred while reviewing the submission.",
  },
  { status: 500 }
);

}
}
