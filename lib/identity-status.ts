export type IdState = "approved" | "pending" | "rejected" | "none";

type Submission = {
  admin_status: string | null;
  didit_status: string | null;
  id_document_type?: string | null;
  id_expiry_date?: string | null;
};

const norm = (v?: string | null) =>
  (v || "").toLowerCase().replace(/\s+/g, "_");

// submissions: pinakabago muna (order by created_at desc)
export function getIdentityState(
  submissions: Submission[] | null | undefined,
  accountStatus?: string | null,
): IdState {
  const list = submissions ?? [];

  if (
    norm(accountStatus) === "approved" ||
    list.some((s) => norm(s.admin_status) === "approved")
  ) {
    return "approved";
  }

  const latest = list[0];
  if (!latest) return "none";

  const admin = norm(latest.admin_status);
  const didit = norm(latest.didit_status);

  if (["rejected", "declined"].includes(admin) || didit === "declined") {
    return "rejected";
  }

  // Tapos na si renter sa Didit, hinihintay na lang ang admin
  if (["approved", "in_review"].includes(didit)) return "pending";

  return "none"; // nagsimula pero hindi pa natapos sa Didit
}

// True kung ang approved na primary ID ni renter ay Driver's License
// at hindi pa expired. Ibig sabihin, hindi na siya hihingan ng hiwalay na license.
export function isLicenseCoveredByPrimaryId(
  submissions: Submission[] | null | undefined,
): boolean {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });

  return (submissions ?? []).some(
    (s) =>
      norm(s.admin_status) === "approved" &&
      /driver/i.test(s.id_document_type || "") &&
      !!s.id_expiry_date &&
      s.id_expiry_date >= today,
  );
}