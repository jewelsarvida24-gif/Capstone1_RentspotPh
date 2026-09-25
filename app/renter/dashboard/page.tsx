import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CheckCircle2 } from "@/components/client-icons";

import RenterNavbar from "@/components/renter/renter-navbar";
import { createClient } from "@/lib/supabase_server";

export default async function RenterDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/renter/dashboard");
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

  console.log("KYC SUBMISSION:", kycSubmission);

  const firstName =
    profile?.first_name ||
    user.user_metadata?.first_name ||
    "there";

  const kycStatus = kycSubmission?.admin_status || "Not started";
  const normalizedStatus = kycStatus.toLowerCase();

  const isVerified = normalizedStatus === "approved";
  const isInReview = normalizedStatus === "in review";
  const isDeclined = normalizedStatus === "declined";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfdff] text-slate-900">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-sky-200/35 blur-3xl" />

        <div className="absolute -left-56 top-[35%] h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />

        <div className="absolute bottom-[-220px] right-[15%] h-[500px] w-[500px] rounded-full bg-indigo-100/25 blur-3xl" />
      </div>

      <RenterNavbar firstName={profile?.first_name || undefined} lastName={profile?.last_name || undefined} needsVerification={!isVerified} />

      <main className="mx-auto max-w-[1280px] px-6 pb-28 pt-8 lg:px-10">
        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative min-h-[520px] overflow-hidden rounded-[36px] border border-white/80 bg-white/70 shadow-[0_20px_70px_rgba(37,99,235,0.08)] backdrop-blur-2xl">
          {/* Soft glow */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-400/15 blur-3xl" />

          <div className="pointer-events-none absolute bottom-[-180px] right-[22%] h-[400px] w-[400px] rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="relative grid min-h-[520px] lg:grid-cols-[0.95fr_1.05fr]">
            {/* LEFT — Greeting */}
            <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-14 lg:py-16">
              <p className="text-sm font-semibold tracking-[0.14em] text-blue-600">
                WELCOME BACK
              </p>

              <h1 className="mt-4 max-w-xl text-[46px] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[56px] lg:text-[62px]">
                Good to see you,{" "}
                <span className="text-blue-600">
                  {firstName}.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                What are you looking for today? Explore
                available rentals, plan your booking, and get
                ready for your next experience.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/guest/browse"
                  className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_16px_34px_rgba(37,99,235,0.25)]"
                >
                  Explore rentals

                  <ArrowUpRight
                    size={17}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>

                <Link
                  href="/renter/my-rentals"
                  className="rounded-full px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  My rentals
                </Link>
              </div>
            </div>

            {/* RIGHT — Visual rental composition */}
            <div className="relative min-h-[380px] lg:min-h-full">
              {/* Large visual panel */}
              <div className="absolute inset-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 sm:inset-7 lg:inset-8">
                {/* Decorative light */}
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-2xl" />

                <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

                {/* Large typography */}
                <div className="absolute left-7 top-7 z-10 sm:left-9 sm:top-9">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
                    RENTSPOTPH
                  </p>

                  <p className="mt-2 max-w-[220px] text-2xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-3xl">
                    Your next rental
                    starts here.
                  </p>
                </div>

                {/* Camera-inspired visual */}
                <div className="absolute bottom-[-15px] right-[-15px] h-[72%] w-[88%] sm:bottom-[-20px] sm:right-[-20px] sm:h-[76%] sm:w-[82%]">
                  <div className="absolute right-[8%] top-[5%] h-[82%] w-[72%] rotate-[-7deg] rounded-[42px] bg-white/95 shadow-[0_30px_60px_rgba(15,23,42,0.22)]" />

                  <div className="absolute right-[12%] top-[10%] h-[72%] w-[64%] rotate-[-7deg] rounded-[36px] bg-slate-100 shadow-inner">
                    <div className="absolute left-[9%] top-[8%] h-[5%] w-[25%] rounded-full bg-slate-300" />

                    <div className="absolute left-[9%] right-[9%] top-[18%] bottom-[10%] overflow-hidden rounded-[25px] bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-300">
                      <div className="absolute left-[12%] top-[17%] h-24 w-24 rounded-full bg-white/30 blur-xl" />

                      <div className="absolute bottom-[12%] left-[8%] h-[38%] w-[85%] rounded-t-[45%] bg-white/20 blur-md" />
                    </div>
                  </div>

                  {/* Floating rental tag */}
                  <div className="absolute bottom-[11%] left-[4%] rounded-2xl border border-white/50 bg-white/90 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.15)] backdrop-blur-xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                      Ready when you are
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Browse. Book. Enjoy.
                    </p>
                  </div>
                </div>

                {/* Small decorative circles */}
                <div className="absolute right-7 top-[47%] h-3 w-3 rounded-full bg-white/70" />
                <div className="absolute right-12 top-[52%] h-1.5 w-1.5 rounded-full bg-white/50" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            RENTAL FLOW
        ========================================================== */}
        <section className="mt-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              THE RENTAL FLOW
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              From browsing to pickup.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Everything you need for a smooth rental experience,
              without the unnecessary steps.
            </p>
          </div>

          {/* Editorial rows — no giant container */}
          <div className="mt-10 border-t border-slate-200">
            {/* Row 1 */}
            <Link
              href="/guest/browse"
              className="group grid gap-4 border-b border-slate-200 py-8 transition-all duration-300 hover:px-3 sm:grid-cols-[170px_1fr_auto] sm:items-center"
            >
              <p className="text-sm font-semibold text-blue-600">
                Start here
              </p>

              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 transition group-hover:text-blue-700 sm:text-3xl">
                  Find something you love
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Explore cameras, smartphones, vehicles, and
                  other available rental units.
                </p>
              </div>

              <ArrowUpRight
                size={21}
                className="hidden text-slate-300 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-blue-600 sm:block"
              />
            </Link>

            {/* Row 2 */}
            <div className="grid gap-4 border-b border-slate-200 py-8 sm:grid-cols-[170px_1fr_auto] sm:items-center">
              <p className="text-sm font-semibold text-sky-600">
                Plan
              </p>

              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl">
                  Choose when you need it
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Select your rental dates and check the unit's
                  availability before booking.
                </p>
              </div>

              <span className="hidden text-sm font-medium text-slate-300 sm:block">
                Next
              </span>
            </div>

            {/* Row 3 */}
            <Link
              href="/renter/profile"
              className="group grid gap-4 border-b border-slate-200 py-8 transition-all duration-300 hover:px-3 sm:grid-cols-[170px_1fr_auto] sm:items-center"
            >
              <p className="text-sm font-semibold text-indigo-500">
                Prepare
              </p>

              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 transition group-hover:text-indigo-700 sm:text-3xl">
                  Get your account ready
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Complete your profile and identity verification
                  when required for your rental.
                </p>
              </div>

              <ArrowUpRight
                size={21}
                className="hidden text-slate-300 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-indigo-500 sm:block"
              />
            </Link>

            {/* Row 4 */}
            <div className="grid gap-4 py-8 sm:grid-cols-[170px_1fr_auto] sm:items-center">
              <p className="text-sm font-semibold text-emerald-600">
                Enjoy
              </p>

              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl">
                  Pick it up and go
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Once everything is approved, pick up your
                  rental and enjoy the experience.
                </p>
              </div>

              <CheckCircle2
                size={21}
                className="hidden text-emerald-400 sm:block"
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            MY RENTALS
        ========================================================== */}
        <section className="mt-24">
          <div className="flex items-end justify-between border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                YOUR SPACE
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                My Rentals
              </h2>
            </div>

            <Link
              href="/renter/my-rentals"
              className="hidden text-sm font-semibold text-blue-600 transition hover:text-blue-700 sm:block"
            >
              Rental history →
            </Link>
          </div>

          {/* Empty rental shelf */}
          <div className="relative mt-8 min-h-[360px] overflow-hidden rounded-[30px] bg-gradient-to-br from-blue-50 via-white to-sky-50">
            {/* Background typography */}
            <div className="pointer-events-none absolute -right-4 top-8 select-none text-[100px] font-bold tracking-[-0.08em] text-blue-100/50 sm:text-[150px]">
              RENT
            </div>

            <div className="pointer-events-none absolute -bottom-10 -left-8 h-52 w-52 rounded-full bg-sky-100/70 blur-2xl" />

            <div className="relative flex min-h-[360px] flex-col items-center justify-center px-7 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
                <div className="h-7 w-7 rounded-lg border-2 border-blue-200" />
              </div>

              <p className="mt-7 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                Your rental shelf is empty.
              </p>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">
                Once you make a booking, your upcoming and
                previous rentals will appear here.
              </p>

              <Link
                href="/guest/browse"
                className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-blue-600 shadow-[0_8px_25px_rgba(37,99,235,0.08)] ring-1 ring-blue-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"
              >
                Explore available units

                <ArrowUpRight
                  size={17}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}