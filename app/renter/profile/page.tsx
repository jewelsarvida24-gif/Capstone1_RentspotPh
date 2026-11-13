import VerifyIdentityButton from "@/components/renter/verify-identity-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import RenterNavbar from "@/components/renter/renter-navbar";
import ChangePasswordForm from "@/components/renter/change-password-form";
import ProfileSection, { GlassCard } from "@/components/renter/profile-section";
import { createClient } from "@/lib/supabase_server";
import {
  getIdentityState,
  isLicenseCoveredByPrimaryId,
} from "@/lib/identity-status";

const BACKGROUND_STYLES = {
  grid: "linear-gradient(#dfe5ec 1px, transparent 1px), linear-gradient(90deg, #dfe5ec 1px, transparent 1px)",
  warmGlow:
    "radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(239,68,68,0.08) 38%, transparent 72%)",
  coolGlow: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
  centerWash:
    "radial-gradient(ellipse 55% 70% at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 45%, transparent 75%)",
} as const;

function PageBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-neutral-50">
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{ backgroundImage: BACKGROUND_STYLES.grid, backgroundSize: "72px 72px" }}
      />
      <div
        className="absolute -top-[260px] right-[5%] h-[700px] w-[700px] rounded-full"
        style={{ background: BACKGROUND_STYLES.warmGlow, filter: "blur(30px)" }}
      />
      <div
        className="absolute bottom-[-220px] left-[5%] h-[550px] w-[550px] rounded-full"
        style={{ background: BACKGROUND_STYLES.coolGlow, filter: "blur(35px)" }}
      />
      <div className="absolute inset-0" style={{ background: BACKGROUND_STYLES.centerWash }} />
      <div className="absolute bottom-0 left-[9%] top-0 border-l border-[#e6ebf1]" />
      <div className="absolute bottom-0 right-[9%] top-0 border-r border-[#e6ebf1]" />
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  breakAll = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white/70 p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        <Icon size={15} />
        {label}
      </div>
      <p className={`mt-3 text-base font-semibold text-slate-900 ${breakAll ? "break-all" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export default async function RenterProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/renter/auth/login?redirectTo=/renter/profile");
  }

  const [
    { data: profile },
    { data: identitySubmissions },
    { data: licenseSubmissions },
  ] = await Promise.all([
    supabase
      .from("tbl_users")
      .select("first_name, last_name, email, phone_number, verification_status")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("tbl_kyc")
      .select(
        "admin_status, didit_status, document_type, id_document_type, id_expiry_date, created_at"
      )
      .eq("user_id", user.id)
      .eq("document_type", "identity_verification")
      .order("created_at", { ascending: false }),

    supabase
      .from("tbl_driver_license_verifications")
      .select(
        "admin_status, didit_status, license_expiry_date, rejection_reason, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const firstName = profile?.first_name || user.user_metadata?.first_name || "";
  const lastName = profile?.last_name || user.user_metadata?.last_name || "";
  const email = profile?.email || user.email || "";
  const phoneNumber = profile?.phone_number || "Not provided";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Renter";

  // Iisang batayan ng status (pareho sa dashboard at sa unit page)
  const idState = getIdentityState(identitySubmissions, profile?.verification_status);
  const isIdentityApproved = idState === "approved";
  const isIdentityUnderReview = idState === "pending";
  const isIdentityDeclined = idState === "rejected";

  // True kung Driver's License mismo ang ginamit sa approved na primary ID
  const licenseViaPrimaryId = isLicenseCoveredByPrimaryId(identitySubmissions);

  const latestLicense = licenseSubmissions?.[0] || null;
  const licenseAdminStatus = (latestLicense?.admin_status || "").toLowerCase();

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });

  const licenseExpiryDate = latestLicense?.license_expiry_date || null;
  const isLicenseExpired =
    licenseAdminStatus === "approved" &&
    (!licenseExpiryDate || licenseExpiryDate < today);

  const isSeparateLicenseApproved =
    licenseAdminStatus === "approved" && !isLicenseExpired;

  const isLicenseApproved = isSeparateLicenseApproved || licenseViaPrimaryId;
  const showLicenseExpired = isLicenseExpired && !licenseViaPrimaryId;

  const isLicensePending =
    !isLicenseApproved &&
    (licenseAdminStatus === "pending" || licenseAdminStatus === "in review");

  const isLicenseDeclined = !isLicenseApproved && licenseAdminStatus === "rejected";

  const verification = isIdentityApproved
    ? {
        chip: "Verified",
        chipClass: "bg-emerald-50 text-emerald-700",
        tileClass: "bg-emerald-50 text-emerald-600",
        Icon: CheckCircle2,
        title: "Your identity is verified",
        text: "Your identity verification has already been approved. You can book standard rental units. A separate driver's license verification may be required for vehicles or units that require driving credentials.",
        statusLabel: "Approved",
        statusClass: "text-emerald-600",
      }
    : isIdentityUnderReview
      ? {
          chip: "Under Review",
          chipClass: "bg-amber-50 text-amber-700",
          tileClass: "bg-amber-50 text-amber-600",
          Icon: Clock3,
          title: "Your identity is under review",
          text: "We received your verification. An admin is reviewing it, and you will be able to book once it is approved.",
          statusLabel: "Under Review",
          statusClass: "text-amber-600",
        }
      : isIdentityDeclined
        ? {
            chip: "Verification Declined",
            chipClass: "bg-red-50 text-red-700",
            tileClass: "bg-red-50 text-red-600",
            Icon: ShieldCheck,
            title: "Verification declined",
            text: "Your identity verification was not approved. Please try again with a clear photo of a valid ID.",
            statusLabel: "Declined",
            statusClass: "text-red-600",
          }
        : {
            chip: "Verification Required",
            chipClass: "bg-red-50 text-red-700",
            tileClass: "bg-blue-50 text-blue-600",
            Icon: ShieldCheck,
            title: "Verify your identity",
            text: "Identity verification is required before you can book rental units.",
            statusLabel: "Not Verified",
            statusClass: "text-slate-700",
          };

  const StatusIcon = verification.Icon;

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-neutral-50 text-slate-900">
      <PageBackground />

      <RenterNavbar
        firstName={profile?.first_name || undefined}
        lastName={profile?.last_name || undefined}
        needsVerification={!isIdentityApproved && !isIdentityUnderReview}
      />

      <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-10 lg:px-10">
        <Link
          href="/renter/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* 1. Profile header */}
        <section aria-label="Profile summary" className="mt-10">
          <GlassCard>
            <div className="flex flex-col gap-6 px-7 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-9">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-blue-700">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#2C3E50]">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-sm text-[#697386]">Renter Account</p>
                </div>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${verification.chipClass}`}
              >
                <StatusIcon size={16} />
                {verification.chip}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* 2. Personal information */}
        <ProfileSection
          id="personal-information"
          title="Personal Information"
          description="Your account information."
          action={
            <button
              type="button"
              disabled
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300"
            >
              Edit
            </button>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <InfoTile icon={UserRound} label="Full Name" value={displayName} />
            <InfoTile icon={Mail} label="Email Address" value={email} breakAll />
            <InfoTile icon={Phone} label="Phone Number" value={phoneNumber} />
            <InfoTile icon={ShieldCheck} label="Account Type" value="Renter" />
          </div>
        </ProfileSection>

        {/* 3. Identity verification */}
        <section
          id="identity-verification"
          aria-labelledby="identity-verification-title"
          className="mt-7"
        >
          <GlassCard>
            <div className="px-7 py-8 sm:px-9">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${verification.tileClass}`}
                >
                  <StatusIcon size={23} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Identity Verification
                  </p>
                  <h2
                    id="identity-verification-title"
                    className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#2C3E50]"
                  >
                    {verification.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#697386]">
                    {verification.text}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-neutral-200 bg-white/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Primary ID Status
                    </p>
                    <p className={`mt-2 text-base font-semibold ${verification.statusClass}`}>
                      {verification.statusLabel}
                    </p>
                  </div>

                  {!isIdentityApproved && !isIdentityUnderReview && (
                    <VerifyIdentityButton isDeclined={isIdentityDeclined} />
                  )}

                  {isIdentityUnderReview && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-5 py-3 text-sm font-semibold text-amber-700">
                      <Clock3 size={16} />
                      Under Review
                    </span>
                  )}

                  {isIdentityApproved && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 size={16} />
                      Verified via Primary ID
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Separate driver's license status */}
              <div className="mt-5 rounded-xl border border-neutral-200 bg-white/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Driver's License Status
                    </p>

                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {isLicenseApproved
                        ? licenseViaPrimaryId && !isSeparateLicenseApproved
                          ? "Approved via Primary ID"
                          : "Approved"
                        : showLicenseExpired
                          ? "Expired"
                          : isLicensePending
                            ? "Pending Review"
                            : isLicenseDeclined
                              ? "Rejected"
                              : "Not Submitted"}
                    </p>

                    {licenseViaPrimaryId && !isSeparateLicenseApproved && (
                      <p className="mt-1 text-xs text-slate-500">
                        You verified with a driver's license, so no separate submission is needed.
                      </p>
                    )}

                    {licenseExpiryDate && (
                      <p className="mt-1 text-xs text-slate-500">
                        Expiry date: {licenseExpiryDate}
                      </p>
                    )}

                    {isLicenseDeclined && latestLicense?.rejection_reason && (
                      <p className="mt-2 text-sm text-red-600">
                        Reason: {latestLicense.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {isLicenseApproved && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 size={16} />
                        License Approved
                      </span>
                    )}

                    {isLicensePending && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-5 py-3 text-sm font-semibold text-amber-700">
                        <Clock3 size={16} />
                        Pending Review
                      </span>
                    )}

                    {showLicenseExpired && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-5 py-3 text-sm font-semibold text-red-700">
                        <ShieldCheck size={16} />
                        License Expired
                      </span>
                    )}

                    {isLicenseDeclined && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-5 py-3 text-sm font-semibold text-red-700">
                        License Rejected
                      </span>
                    )}

                    {!latestLicense && !licenseViaPrimaryId && (
                      <span className="text-sm text-slate-500">
                        Separate verification required for applicable vehicle rentals.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* 5. Password */}
        <ProfileSection
          id="password"
          title="Password"
          description="Use a strong password that you do not use on other sites."
        >
          <ChangePasswordForm email={user.email ?? email} />
        </ProfileSection>
      </main>
    </div>
  );
}