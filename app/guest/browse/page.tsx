import Link from "next/link";
import { redirect } from "next/navigation";
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
  searchParams: Promise<{ category?: string; search?: string; page?: string }>;
}

const PAGE_SIZE = 24;

const browseHref = (category?: string, search?: string, page?: number) => {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/guest/browse?${query}` : "/guest/browse";
};

const NEON = ["#ff5d73", "#ffc233", "#39f08e", "#38d6ff"];

const isAddOnsCategory = (category?: string | null) => {
  const normalized = (category ?? "").toLowerCase().replace(/[^a-z]/g, "");
  return normalized === "addon" || normalized === "addons";
};
const isCameraCategory = (category: string) =>
  category.toLowerCase().startsWith("camera");

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

function AddOnDropdown({
  items,
  color,
  defaultOpen,
}: {
  items: { unit_id: string; unit_name: string }[];
  color: string;
  defaultOpen: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group absolute right-1 top-1/2 z-30 -translate-y-1/2"
    >
      <summary
        aria-label={`Show ${items.length} camera add-ons`}
        title="Show camera add-ons"
        className="flex h-8 cursor-pointer list-none items-center justify-center gap-1 rounded-full bg-[#0f2a4a]/90 px-2 text-[10px] font-semibold text-cyan-200 transition hover:bg-[#173b66] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 [&::-webkit-details-marker]:hidden"
      >
        <span>Add-ons</span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-cyan-300/20 bg-[#0f2a4a] p-2 shadow-[0_16px_36px_rgba(0,0,0,0.45)]">
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <li key={item.unit_id}>
              <span className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-white/75">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="truncate">{item.unit_name}</span>
                <span className="ml-auto shrink-0 text-[10px] text-white/40">
                  View
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
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
  const parsedPage = Number(filters.page ?? "1");
  const currentPage =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const showAllUnits = !filters.category;

  let query = supabase
    .from("tbl_units")
    .select("*", { count: showAllUnits ? "exact" : undefined })
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .order("unit_id", { ascending: true });
  if (showAllUnits) {
    const from = (currentPage - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);
  }
  const selectedIsCamera = Boolean(
    filters.category && isCameraCategory(filters.category)
  );
  const selectedIsAddOns = isAddOnsCategory(filters.category);
  if (filters.category && !selectedIsCamera && !selectedIsAddOns) {
    query = query.eq("category", filters.category);
  }
  if (filters.search) query = query.ilike("unit_name", `%${filters.search}%`);

  const { data: units, error: unitsError, count } = await query;

  // Add-ons are nested under Camera rather than listed as a category.
  const { data: categoryRows } = await supabase
    .from("tbl_units")
    .select("unit_id, unit_name, category")
    .eq("status", "available");
  const categoryCounts = new Map<string, number>();
  const cameraAddOns: { unit_id: string; unit_name: string }[] = [];
  for (const row of (categoryRows ?? []) as {
    unit_id: string | number;
    unit_name: string;
    category: string | null;
  }[]) {
    if (!row.category) continue;
    if (isAddOnsCategory(row.category)) {
      cameraAddOns.push({
        unit_id: String(row.unit_id),
        unit_name: row.unit_name,
      });
      continue;
    }
    categoryCounts.set(
      row.category,
      (categoryCounts.get(row.category) ?? 0) + 1
    );
  }
  const categories = [...categoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const databaseUnits: RentalUnit[] = (units ?? []).map((unit: any) => ({
    ...unit,
    image_url: unit.image_url || resolveUnitImageUrl(unit.unit_name, unit.category),
    avg_rating: typeof unit.avg_rating === "number" ? unit.avg_rating : null,
  }));
  const catalogUnits = unitsError ? [] : databaseUnits;
  const processedUnits = catalogUnits.filter((unit) => {
    const sameCategory =
      unit.category?.toLowerCase() === filters.category?.toLowerCase();
    const matchesCategory = !filters.category
      ? true
      : selectedIsCamera
        ? isCameraCategory(unit.category ?? "") ||
          isAddOnsCategory(unit.category)
        : selectedIsAddOns
          ? isAddOnsCategory(unit.category)
          : sameCategory;
    const matchesSearch =
      !filters.search || unit.unit_name.toLowerCase().includes(filters.search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const totalPages = showAllUnits
    ? Math.max(1, Math.ceil((count ?? processedUnits.length) / PAGE_SIZE))
    : 1;
  if (showAllUnits && currentPage > totalPages) {
    redirect(browseHref(undefined, filters.search, totalPages));
  }
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => {
      const start = Math.max(
        1,
        Math.min(currentPage - 2, totalPages - 4)
      );
      return start + index;
    }
  );

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
                    const color = NEON[i % NEON.length];
                    return (
                      <div key={name} className="relative min-w-0">
                        <NeonLight
                          href={browseHref(
                            state === "lit" ? undefined : name,
                            filters.search
                          )}
                          title={name}
                          count={count}
                          color={color}
                          state={state}
                        />
                        {isCameraCategory(name) && cameraAddOns.length > 0 && (
                          <AddOnDropdown
                            items={cameraAddOns}
                            color={color}
                            defaultOpen={state === "lit"}
                          />
                        )}
                      </div>
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
                <>
                  <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {processedUnits.map((unit) => (
                      <li key={unit.unit_id}>
                        <UnitTicket unit={unit} />
                      </li>
                    ))}
                  </ul>
                  {showAllUnits && totalPages > 1 && (
                    <nav
                      aria-label="Unit pages"
                      className="mt-8 flex flex-wrap items-center justify-center gap-2"
                    >
                      <Link
                        href={browseHref(undefined, filters.search, currentPage - 1)}
                        aria-disabled={currentPage === 1}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                          currentPage === 1
                            ? "pointer-events-none border-slate-200 text-slate-300"
                            : "border-[#A8C5E8] text-[#1F5C94] hover:bg-[#A8C5E8]/20"
                        }`}
                      >
                        Previous
                      </Link>
                      {pageNumbers.map((pageNumber) => (
                        <Link
                          key={pageNumber}
                          href={browseHref(undefined, filters.search, pageNumber)}
                          aria-current={pageNumber === currentPage ? "page" : undefined}
                          className={`min-w-10 rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                            pageNumber === currentPage
                              ? "border-[#102A4A] bg-[#102A4A] text-white"
                              : "border-[#A8C5E8] text-[#1F5C94] hover:bg-[#A8C5E8]/20"
                          }`}
                        >
                          {pageNumber}
                        </Link>
                      ))}
                      <Link
                        href={browseHref(undefined, filters.search, currentPage + 1)}
                        aria-disabled={currentPage === totalPages}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                          currentPage === totalPages
                            ? "pointer-events-none border-slate-200 text-slate-300"
                            : "border-[#A8C5E8] text-[#1F5C94] hover:bg-[#A8C5E8]/20"
                        }`}
                      >
                        Next
                      </Link>
                    </nav>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}