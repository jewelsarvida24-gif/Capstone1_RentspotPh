import VerifyIdentityButton from "@/components/renter/verify-identity-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  AlertCircle,
  UserRound,
  Mail,
  Phone,
} from "lucide-react";

import RenterNavbar from "@/components/renter/renter-navbar";
import { createClient } from "@/lib/supabase_server";

export default async function RenterProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/renter/profile");
  }

  const [{ data: profile }, { data: kycSubmission }] = await Promise.all([
    supabase
      .from("tbl_users")
      .select("first_name, last_name, email, phone_number")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
  .from("tbl_kyc")
  .select("admin_status, didit_status, created_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle(),
  ]);

  const firstName =
    profile?.first_name ||
    user.user_metadata?.first_name ||
    "";

  const lastName =
    profile?.last_name ||
    user.user_metadata?.last_name ||
    "";

  const email =
    profile?.email ||
    user.email ||
    "";

  const phoneNumber =
    profile?.phone_number ||
    "Not provided";

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    "Renter";

  const kycStatus = kycSubmission?.admin_status || null;
const normalizedStatus = kycStatus?.toLowerCase();

const isVerified = normalizedStatus === "approved";

const isInReview =
  normalizedStatus === "pending" ||
  normalizedStatus === "flagged";

const isDeclined = normalizedStatus === "rejected";
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfdff] text-slate-900">

      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-sky-200/30 blur-3xl" />

        <div className="absolute -left-56 top-[45%] h-[500px] w-[500px] rounded-full bg-blue-100/35 blur-3xl" />
      </div>

      <RenterNavbar
        firstName={profile?.first_name || undefined}
        lastName={profile?.last_name || undefined}
        needsVerification={!isVerified}
      />

      <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-10 lg:px-10">

        {/* Back */}
        <Link
          href="/renter/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* Profile header */}
        <section className="mt-10 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">

          <div className="flex flex-col gap-6 border-b border-slate-100 px-7 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-9">

            <div className="flex items-center gap-5">

              {/* Avatar */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-blue-700">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                  {displayName}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Renter Account
                </p>
              </div>
            </div>

            {/* Verification mini-status */}
            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                isVerified
                  ? "bg-emerald-50 text-emerald-700"
                  : isInReview
                    ? "bg-amber-50 text-amber-700"
                    : isDeclined
                      ? "bg-red-50 text-red-700"
                      : "bg-red-50 text-red-700"
              }`}
            >
              {isVerified ? (
                <CheckCircle2 size={16} />
              ) : isInReview ? (
                <Clock3 size={16} />
              ) : isDeclined ? (
                <AlertCircle size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}

              {isVerified
                ? "Verified"
                : isInReview
                  ? "In Review"
                  : isDeclined
                    ? "Verification Declined"
                    : "Verification Required"}
            </div>
          </div>

          {/* Personal Information */}
          <div className="px-7 py-8 sm:px-9">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Personal Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your account information.
                </p>
              </div>

              {/* Edit can be connected later */}
              <button
                type="button"
                disabled
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300"
              >
                Edit
              </button>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">

              {/* Full Name */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <UserRound size={15} />
                  Full Name
                </div>

                <p className="mt-3 text-base font-semibold text-slate-900">
                  {displayName}
                </p>
              </div>

              {/* Email */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <Mail size={15} />
                  Email Address
                </div>

                <p className="mt-3 break-all text-base font-semibold text-slate-900">
                  {email}
                </p>
              </div>

              {/* Phone */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <Phone size={15} />
                  Phone Number
                </div>

                <p className="mt-3 text-base font-semibold text-slate-900">
                  {phoneNumber}
                </p>
              </div>

              {/* Account */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <ShieldCheck size={15} />
                  Account Type
                </div>

                <p className="mt-3 text-base font-semibold text-slate-900">
                  Renter
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Identity Verification */}
        <section className="mt-7 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">

          <div className="px-7 py-8 sm:px-9">

            <div className="flex items-start gap-4">

              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  isVerified
                    ? "bg-emerald-50 text-emerald-600"
                    : isInReview
                      ? "bg-amber-50 text-amber-600"
                      : isDeclined
                        ? "bg-red-50 text-red-600"
                        : "bg-blue-50 text-blue-600"
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 size={23} />
                ) : isInReview ? (
                  <Clock3 size={23} />
                ) : isDeclined ? (
                  <AlertCircle size={23} />
                ) : (
                  <ShieldCheck size={23} />
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Identity Verification
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-900">
                  {isVerified
                    ? "Your identity is verified"
                    : isInReview
                      ? "Your verification is being reviewed"
                      : isDeclined
                        ? "Verification was unsuccessful"
                        : "Verify your identity"}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {isVerified
                    ? "Your identity has been successfully verified. You can now book available rentals."
                    : isInReview
                      ? "Your verification is currently being reviewed. You can continue browsing rentals, but booking is unavailable until your verification is approved."
                      : isDeclined
                        ? "Your identity verification was not completed successfully. You may try the verification process again."
                        : "Identity verification is required before you can book a rental. You can still browse available units while your account is unverified."}
                </p>
              </div>
            </div>


            {/* Verification status details */}
            <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Verification Status
                  </p>

                  <p
                    className={`mt-2 text-base font-semibold ${
                      isVerified
                        ? "text-emerald-600"
                        : isInReview
                          ? "text-amber-600"
                          : isDeclined
                            ? "text-red-600"
                            : "text-slate-700"
                    }`}
                  >
                    {isVerified
                      ? "Approved"
                      : isInReview
                        ? "In Review"
                        : isDeclined
                          ? "Declined"
                          : "Not Verified"}
                  </p>
                </div>

                {!isVerified && !isInReview && (
                  <VerifyIdentityButton isDeclined={isDeclined} />
                )}

                {isInReview && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-5 py-3 text-sm font-semibold text-amber-700">
                    <Clock3 size={16} />
                    Under review
                  </span>
                )}

                {isVerified && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={16} />
                    Ready to book
                  </span>
                )}
              </div>
            </div>

          </div>
        </section>


      </main>
    </div>
  );
}