import Link from "next/link";
import { ArrowUpRight } from "@/components/client-icons";

import { createClient } from "@/lib/supabase_server";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import type { RentalUnit } from "@/lib/type";
import { resolveUnitImageUrl } from "@/lib/demoUnits";

const PAGE_BG = "#fbfdff";

const unitHref = (unitId: string) => `/guest/browse/${unitId}`;
const rateOf = (unit: RentalUnit): number | null => {
  const raw = (unit as unknown as Record<string, unknown>).price_per_day;
  return typeof raw === "number" ? raw : null;
};

interface Props {
  searchParams: Promise<{ category?: string; search?: string }>;
}

const browseHref = (category?: string, search?: string) => {
  const p = new URLSearchParams();
  if (category) p.set("category", category);
  if (search) p.set("search", search);
  const qs = p.toString();
  return qs ? `/guest/browse?${qs}` : "/guest/browse";
};

// Top to bottom, like a signal: red, amber, green, then cyan for the fourth.
const NEON = ["#ff5d73", "#ffc233", "#39f08e", "#38d6ff"];

/* ---------- pieces ---------- */

// Unit reference styled like a licence plate.
function Plate({ id, compact }: { id: string; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border-2 border-[#102A4A] bg-white font-bold text-[#102A4A] ${
        compact
          ? "gap-1.5 px-2 py-0.5 text-[11px] tracking-[0.12em]"
          : "gap-2 px-2.5 py-1 text-xs tracking-[0.2em]"
      }`}
    >
      <span className="h-3 w-1 rounded-full bg-[#3E7DBB]" />
      RSP {id.slice(0, 6).toUpperCase()}
    </span>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden>
      <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5Z" />
    </svg>
  );
}

type LightState = "lit" | "steady" | "off";

// One category as a signal lamp. Lit = the one you picked. Steady = nothing picked, all on. Off = another one is picked.
function NeonLight({
  href,
  title,
  count,
  color,
  state,
}: {
  href: string;
  title: string;
  count: number;
  color: string;
  state: LightState;
}) {
  const bulb =
    state === "lit"
      ? {
          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 42%, ${color}dd 100%)`,
          boxShadow: `0 0 0 2px ${color}, 0 0 14px ${color}, 0 0 36px ${color}99, inset 0 0 8px #ffffff66`,
        }
      : state === "steady"
        ? {
            background: `radial-gradient(circle at 35% 30%, ${color}ee 0%, ${color}99 60%, ${color}66 100%)`,
            boxShadow: `0 0 0 2px ${color}, 0 0 12px ${color}77`,
          }
        : {
            background: `${color}12`,
            boxShadow: `0 0 0 2px ${color}33`,
          };

  return (
    <Link
      href={href}
      aria-current={state === "lit" ? "page" : undefined}
      className={`group flex items-center gap-4 rounded-2xl p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        state === "off" ? "opacity-55 hover:opacity-100" : ""
      }`}
    >
      <span
        className="block h-12 w-12 shrink-0 rounded-full transition-all duration-300"
        style={bulb}
        aria-hidden
      />
      <span className="min-w-0">
        <span
          className={`block truncate text-base font-semibold leading-tight tracking-[-0.01em] ${
            state === "off" ? "text-white/70" : "text-white"
          }`}
          style={state === "lit" ? { textShadow: `0 0 12px ${color}` } : undefined}
        >
          {title}
        </span>
        <span
          className="mt-0.5 block text-xs tabular-nums"
          style={{ color: state === "off" ? "#ffffff66" : color }}
        >
          {count} {count === 1 ? "unit" : "units"}
        </span>
      </span>
    </Link>
  );
}

// One rental unit, drawn as a ticket with a tear-off stub.
function UnitTicket({ unit }: { unit: RentalUnit }) {
  const id = String(unit.unit_id);
  const rate = rateOf(unit);

  return (
    <Link
      href={unitHref(id)}
      className="group relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white text-[#102A4A] ring-1 ring-[#A8C5E8]/70 shadow-[0_18px_36px_-12px_rgba(16,42,74,0.4),0_4px_10px_-2px_rgba(16,42,74,0.18)] transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#A8C5E8]/30">
        {unit.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={unit.image_url}
            alt={unit.unit_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-[#6E9BD3]">
            {unit.unit_name.trim().charAt(0).toUpperCase() || "R"}
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Plate id={id} compact />
        </div>
        {typeof unit.avg_rating === "number" && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#102A4A]/85 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white">
            <span className="text-amber-300">
              <Star />
            </span>
            {unit.avg_rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div>
          <p className="truncate text-xl font-semibold leading-tight tracking-[-0.03em]">
            {unit.unit_name}
          </p>
          {unit.description && (
            <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-xs leading-5 text-slate-500">
              {unit.description}
            </p>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-x-3 border-t border-slate-200 pt-3">
          <div>
            <p className="text-[11px] text-slate-500">Category</p>
            <p className="truncate text-xs font-semibold">{unit.category || "Uncategorized"}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Rating</p>
            <p className="text-xs font-semibold tabular-nums">
              {typeof unit.avg_rating === "number" ? `${unit.avg_rating.toFixed(1)} / 5` : "No reviews yet"}
            </p>
          </div>
        </div>
      </div>

      {/* tear-off stub */}
      <div className="relative flex items-center justify-between gap-3 border-t-2 border-dashed border-slate-300 px-5 py-3">
        <span
          className="absolute left-0 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-slate-200"
          style={{ background: PAGE_BG }}
        />
        <span
          className="absolute right-0 top-0 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-slate-200"
          style={{ background: PAGE_BG }}
        />
        {rate !== null ? (
          <p className="text-xs text-slate-500">
            <span className="text-sm font-semibold tabular-nums text-[#102A4A]">
              ₱{rate.toLocaleString()}
            </span>{" "}
            / day
          </p>
        ) : (
          <p className="text-xs text-slate-500">Available now</p>
        )}
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1F5C94]">
          View unit
          <ArrowUpRight
            size={15}
            className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

/* ---------- page ---------- */

export default async function BrowsePage({ searchParams }: Props) {
  const filters = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("tbl_units")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false });
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.search) query = query.ilike("unit_name", `%${filters.search}%`);

  const { data: units, error: unitsError } = await query;

  // Every category that currently has an available unit, with how many.
  const { data: categoryRows } = await supabase
    .from("tbl_units")
    .select("category")
    .eq("status", "available");
  const categoryCounts = new Map<string, number>();
  for (const row of categoryRows ?? []) {
    const c = (row as { category: string | null }).category;
    if (c) categoryCounts.set(c, (categoryCounts.get(c) ?? 0) + 1);
  }
  const categories = [...categoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const databaseUnits: RentalUnit[] = (units ?? []).map((unit: any) => ({
    ...unit,
    image_url: unit.image_url || resolveUnitImageUrl(unit.unit_name, unit.category),
    avg_rating: typeof unit.avg_rating === "number" ? unit.avg_rating : null,
  }));
  const catalogUnits = unitsError ? [] : databaseUnits;
  const processedUnits = catalogUnits.filter((unit) => {
    const matchesCategory =
      !filters.category || unit.category?.toLowerCase() === filters.category.toLowerCase();
    const matchesSearch =
      !filters.search || unit.unit_name.toLowerCase().includes(filters.search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const hasFilters = Boolean(filters.category || filters.search);

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] text-[#102A4A]" style={{ background: PAGE_BG }}>
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-28 sm:pt-32 lg:px-10">
          {/* HEADER */}
          <header>
            <div>
              <span
                className="mb-4 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#102A4A,#3E7DBB,#A8C5E8)]"
                aria-hidden
              />
              <h1 className="text-[42px] font-semibold leading-[1.02] tracking-[-0.055em] sm:whitespace-nowrap sm:text-[52px]">
                What do you need to rent?
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#173B66]/80">
                Pick a unit, check the dates that work for you, and book it in a few taps.
              </p>
            </div>
          </header>

          <div className="mt-12 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
            {/* SIGNAL: the housing is bare, the only lights are the categories */}
            <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] bg-[#0b1f38] p-5 ring-1 ring-white/10 shadow-[0_30px_60px_-30px_rgba(11,31,56,0.85)]">
                <span className="mx-auto mb-5 block h-1.5 w-12 rounded-full bg-white/10" aria-hidden />

                <form action="/guest/browse" method="get" role="search">
                  {filters.category && (
                    <input type="hidden" name="category" value={filters.category} />
                  )}
                  <div className="relative rounded-full bg-[#0f2a4a] ring-1 ring-cyan-300/50 shadow-[0_0_12px_rgba(34,211,238,0.25)] transition focus-within:ring-cyan-300 focus-within:shadow-[0_0_22px_rgba(34,211,238,0.55)]">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300"
                      aria-hidden
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                    <input
                      type="search"
                      name="search"
                      defaultValue={filters.search ?? ""}
                      placeholder="Search by unit name"
                      aria-label="Search by unit name"
                      className="w-full bg-transparent py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#A8C5E8]/60 focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="sr-only">
                    Search
                  </button>
                </form>

                <nav
                  aria-label="Categories"
                  className="mt-6 grid grid-cols-2 gap-x-2 gap-y-3 lg:grid-cols-1 lg:gap-y-4"
                >
                  {categories.map(([name, count], i) => {
                    const state: LightState = !filters.category
                      ? "steady"
                      : filters.category.toLowerCase() === name.toLowerCase()
                        ? "lit"
                        : "off";
                    return (
                      <NeonLight
                        key={name}
                        href={browseHref(
                          state === "lit" ? undefined : name,
                          filters.search
                        )}
                        title={name}
                        count={count}
                        color={NEON[i % NEON.length]}
                        state={state}
                      />
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* TICKETS */}
            <section className="min-w-0">
              {hasFilters && processedUnits.length > 0 && (
                <p className="mb-5 text-sm text-[#3E7DBB]">
                  Showing {filters.category ? filters.category : "all categories"}
                  {filters.search ? ` matching "${filters.search}"` : ""}.{" "}
                  <Link href="/guest/browse" className="font-semibold text-[#1F5C94] hover:text-[#173B66]">
                    Clear filters
                  </Link>
                </p>
              )}

              {processedUnits.length === 0 ? (
                <Link
                  href="/guest/browse"
                  aria-label="Clear filters and show all units"
                  className="group grid min-h-[240px] grid-cols-[1fr_7rem] overflow-hidden rounded-[26px] border-2 border-dashed border-[#6E9BD3] bg-white/60 transition hover:border-[#1F5C94] hover:bg-[#A8C5E8]/20 sm:grid-cols-[1fr_9rem]"
                >
                  <div className="flex flex-col justify-between gap-6 p-7 sm:p-9">
                    <span className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-dashed border-[#6E9BD3] px-2.5 py-1 text-xs font-bold tracking-[0.2em] text-[#6E9BD3]">
                      RSP ------
                    </span>
                    <div>
                      <p className="text-3xl font-semibold leading-tight tracking-[-0.035em]">
                        No units match that search.
                      </p>
                      <p className="mt-3 max-w-md text-sm leading-6 text-[#3E7DBB]">
                        Try a different keyword or category, or clear your filters to see everything
                        that is available.
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#1F5C94]">Show all units</p>
                  </div>
                  <div className="flex items-center justify-center border-l-2 border-dashed border-[#6E9BD3] text-[#3E7DBB] transition group-hover:border-[#1F5C94]">
                    <ArrowUpRight
                      size={34}
                      className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              ) : (
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {processedUnits.map((unit) => (
                    <li key={unit.unit_id}>
                      <UnitTicket unit={unit} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}