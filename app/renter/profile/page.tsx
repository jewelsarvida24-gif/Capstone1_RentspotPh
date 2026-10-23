import VerifyIdentityButton from "@/components/renter/verify-identity-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
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

/* =========================================================
   BACKGROUND (from the forgot-password page)
========================================================= */

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

/* =========================================================
   SMALL PIECES
========================================================= */

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

/* =========================================================
   PAGE
========================================================= */

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

  const firstName = profile?.first_name || user.user_metadata?.first_name || "";
  const lastName = profile?.last_name || user.user_metadata?.last_name || "";
  const email = profile?.email || user.email || "";
  const phoneNumber = profile?.phone_number || "Not provided";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Renter";

  const normalizedStatus = (kycSubmission?.admin_status || "").toLowerCase();
  const isVerified = normalizedStatus === "approved";
  const isInReview = normalizedStatus === "pending" || normalizedStatus === "flagged";
  const isDeclined = normalizedStatus === "rejected";

  // Every verification label, colour and sentence, decided in one place (same wording as before)
  const verification = isVerified
    ? {
        chip: "Verified",
        chipClass: "bg-emerald-50 text-emerald-700",
        tileClass: "bg-emerald-50 text-emerald-600",
        Icon: CheckCircle2,
        title: "Your identity is verified",
        text: "Your identity has been successfully verified. You can now book available rentals.",
        statusLabel: "Approved",
        statusClass: "text-emerald-600",
      }
    : isInReview
      ? {
          chip: "In Review",
          chipClass: "bg-amber-50 text-amber-700",
          tileClass: "bg-amber-50 text-amber-600",
          Icon: Clock3,
          title: "Your verification is being reviewed",
          text: "Your verification is currently being reviewed. You can continue browsing rentals, but booking is unavailable until your verification is approved.",
          statusLabel: "In Review",
          statusClass: "text-amber-600",
        }
      : isDeclined
        ? {
            chip: "Verification Declined",
            chipClass: "bg-red-50 text-red-700",
            tileClass: "bg-red-50 text-red-600",
            Icon: AlertCircle,
            title: "Verification was unsuccessful",
            text: "Your identity verification was not completed successfully. You may try the verification process again.",
            statusLabel: "Declined",
            statusClass: "text-red-600",
          }
        : {
            chip: "Verification Required",
            chipClass: "bg-red-50 text-red-700",
            tileClass: "bg-blue-50 text-blue-600",
            Icon: ShieldCheck,
            title: "Verify your identity",
            text: "Identity verification is required before you can book a rental. You can still browse available units while your account is unverified.",
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

        {/* 1. Profile header */}
        <section aria-label="Profile summary" className="mt-10">
          <GlassCard>
            <div className="flex flex-col gap-6 px-7 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-9">
              <div className="flex items-center gap-5">
                {/* Avatar */}
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

              {/* Verification mini-status */}
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
            // Edit can be connected later
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
        <section id="identity-verification" aria-labelledby="identity-verification-title" className="mt-7">
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

              {/* Verification status details */}
              <div className="mt-8 rounded-xl border border-neutral-200 bg-white/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Verification Status
                    </p>

                    <p className={`mt-2 text-base font-semibold ${verification.statusClass}`}>
                      {verification.statusLabel}
                    </p>
                  </div>

                  {!isVerified && !isInReview && <VerifyIdentityButton isDeclined={isDeclined} />}

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
          </GlassCard>
        </section>

        {/* 4. Password */}
        <ProfileSection
          id="password"
          title="Password"
          description="Use a strong password that you do not use on other sites. Changing it signs you out of your other devices."
        >
          <ChangePasswordForm email={user.email ?? email} />
        </ProfileSection>
      </main>
    </div>
  );
}