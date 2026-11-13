import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase_server";
import { createAdminClient } from "@/lib/supabase_admin";

export default async function VerificationCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ verificationSessionId?: string; status?: string }>;
}) {
  const { verificationSessionId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/renter/auth/login?redirectTo=/renter/profile");

  let query = supabase
    .from("tbl_kyc")
    .select("didit_session_id")
    .eq("user_id", user.id)
    .eq("document_type", "identity_verification");

  if (verificationSessionId) {
    query = query.eq("didit_session_id", verificationSessionId);
  }

  const { data: row } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (row?.didit_session_id) {
    try {
      // Itanong kay Didit ang totoong status, huwag magtiwala sa URL
      const res = await fetch(
        `https://verification.didit.me/v3/session/${row.didit_session_id}/decision/`,
        {
          headers: { "x-api-key": process.env.DIDIT_API_KEY! },
          cache: "no-store",
        },
      );

      if (res.ok) {
        const decision = await res.json();
        const diditStatus = String(decision.status || "")
          .toLowerCase()
          .replace(/\s+/g, "_"); // "In Review" -> "in_review"

        // Anong klaseng ID ang ginamit? (Passport, Identity Card, Driver's License, ...)
        const idv = Array.isArray(decision.id_verifications)
          ? decision.id_verifications[0]
          : null;

        console.log("Didit decision:", {
          status: diditStatus,
          document_type: idv?.document_type,
          expiration_date: idv?.expiration_date,
        }); // TEMP

        const updates: Record<string, string | null> = {
          didit_status: diditStatus,
        };
        if (idv?.document_type) updates.id_document_type = idv.document_type;
        if (idv?.expiration_date) updates.id_expiry_date = idv.expiration_date;

        const admin = createAdminClient();
        const { error } = await admin
          .from("tbl_kyc")
          .update(updates)
          .eq("didit_session_id", row.didit_session_id)
          .eq("user_id", user.id);

        if (error) console.error("KYC update failed:", error);
      } else {
        console.error("Didit decision fetch failed:", await res.text());
      }
    } catch (err) {
      console.error("Verification callback error:", err);
    }
  }

  redirect("/renter/profile");
}