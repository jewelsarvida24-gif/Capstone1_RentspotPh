"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Laptop,
  PackagePlus,
  Search,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

type Category = [string, number];
type AddOn = { unit_id: string; unit_name: string };
type LightState = "lit" | "steady" | "off";

// Toned down, professional accent colors
const ACCENTS = ["#ef4444", "#eab308", "#22c55e", "#0ea5e9"];

const isAddOnsCategory = (category?: string | null) => {
  const normalized = (category ?? "").toLowerCase().replace(/[^a-z]/g, "");
  return normalized === "addon" || normalized === "addons";
};

const isCameraCategory = (category: string) =>
  category.toLowerCase().startsWith("camera");

const browseHref = (category?: string, search?: string) => {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  const query = params.toString();
  return query ? `/guest/browse?${query}` : "/guest/browse";
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const normalized = name.toLowerCase();
  let Icon: LucideIcon = Grid2X2;

  if (normalized.includes("camera")) Icon = Camera;
  else if (/(car|vehicle|van|suv|auto)/.test(normalized)) Icon = CarFront;
  else if (/(phone|mobile)/.test(normalized)) Icon = Smartphone;
  else if (/(laptop|computer|tablet|pc)/.test(normalized)) Icon = Laptop;
  else if (isAddOnsCategory(name)) Icon = PackagePlus;

  return <Icon size={20} strokeWidth={2} className={className} aria-hidden="true" />;
}

function AddOnDropdown({
  items,
  color,
  defaultOpen,
}: {
  items: AddOn[];
  color: string;
  defaultOpen: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group/addons absolute right-2 top-1/2 z-30 -translate-y-1/2"
    >
      <summary
        aria-label={`Show ${items.length} camera add-ons`}
        title="Show camera add-ons"
        className="flex h-7 cursor-pointer list-none items-center justify-center gap-1 rounded-md bg-white/5 px-2 text-[11px] font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 [&::-webkit-details-marker]:hidden"
      >
        <span>Add-ons</span>
        <ChevronRight
          size={14}
          className="transition-transform duration-200 group-open/addons:rotate-90"
          aria-hidden="true"
        />
      </summary>
      <div className="absolute right-0 top-full z-[100] mt-2 w-56 rounded-xl border border-white/10 bg-[#0f172a] p-1.5 shadow-2xl backdrop-blur-md">
        <ul className="max-h-60 space-y-0.5 overflow-y-auto pr-1 custom-scrollbar">
          {items.map((item) => (
            <li key={item.unit_id}>
              <Link
                href={`/guest/browse/${item.unit_id}`}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:outline-none"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="truncate font-medium">{item.unit_name}</span>
                <span className="ml-auto shrink-0 text-[10px] text-slate-500">
                  View
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export default function BrowseSidebar({
  categories,
  category,
  search,
  cameraAddOns,
}: {
  categories: Category[];
  category?: string;
  search?: string;
  cameraAddOns: AddOn[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearchOnExpand = useRef(false);

  useEffect(() => {
    if (isExpanded && focusSearchOnExpand.current) {
      searchInputRef.current?.focus();
      focusSearchOnExpand.current = false;
    }
  }, [isExpanded]);

  return (
    <aside
      className={`relative z-30 min-w-0 shrink-0 self-start transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        isExpanded ? "w-full lg:w-[17rem]" : "w-[4.5rem]"
      } lg:sticky lg:top-28`}
    >
      <div
        className={`flex flex-col rounded-3xl border border-slate-400/30 bg-gradient-to-br from-slate-700 via-blue-800 to-indigo-800 shadow-xl shadow-slate-950/20 transition-all duration-300 ${
          isExpanded ? "p-4" : "p-2.5"
        }`}
      >
        {/* Header & Toggle */}
        <div className={`mb-5 flex min-h-[40px] items-center ${isExpanded ? "justify-between px-1" : "justify-center"}`}>
          <div
            className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ${
              isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
            }`}
            aria-hidden={!isExpanded}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100/80">
              Discover
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">
              Categories
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? "Collapse categories" : "Expand categories"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {isExpanded ? (
              <ChevronLeft size={18} aria-hidden="true" />
            ) : (
              <ChevronRight size={18} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Search Form */}
        <form
          action="/guest/browse"
          method="get"
          role="search"
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? "mb-2 max-h-12 opacity-100" : "pointer-events-none max-h-0 opacity-0"
          }`}
          aria-hidden={!isExpanded}
        >
          {category && <input type="hidden" name="category" value={category} />}
          <div className="relative group">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70 transition-colors group-focus-within:text-white"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              name="search"
              defaultValue={search ?? ""}
              placeholder="Search by unit name"
              tabIndex={isExpanded ? 0 : -1}
              className="w-full rounded-xl border border-white/25 bg-white/15 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-blue-100/75 transition-all focus:border-white/60 focus:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/15"
            />
          </div>
        </form>

        {!isExpanded && (
          <button
            type="button"
            onClick={() => {
              focusSearchOnExpand.current = true;
              setIsExpanded(true);
            }}
            aria-label="Expand categories and search units"
            title="Search units"
            className="mb-2 flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <Search size={20} aria-hidden="true" />
          </button>
        )}

        {/* Navigation Grid */}
        <nav
          id="browse-category-navigation"
          aria-label="Categories"
          className={`flex flex-col gap-1.5 ${!isExpanded && "items-center"}`}
        >
          {categories.map(([name, count], index) => {
            const state: LightState = !category
              ? "steady"
              : category.toLowerCase() === name.toLowerCase()
                ? "lit"
                : "off";
            const color = ACCENTS[index % ACCENTS.length];
            const href = browseHref(state === "lit" ? undefined : name, search);
            const isActive = state === "lit";

            return (
              <div key={name} className="group/category relative w-full min-w-0">
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex min-h-[44px] items-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
                    isExpanded ? "w-full gap-3 px-2 py-2" : "w-11 justify-center p-2"
                  } ${
                    isActive
                      ? "bg-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                      : "hover:bg-white/10"
                  } ${state === "off" ? "opacity-75 hover:opacity-100" : "opacity-100"}`}
                >
                  {/* Icon Container */}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover/category:scale-105 ${
                      isActive ? "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : ""
                    }`}
                    style={{
                      color,
                      backgroundColor: `${color}${isActive ? "24" : "12"}`,
                    }}
                    aria-hidden="true"
                  >
                    <CategoryIcon name={name} />
                  </span>

                  {/* Text Container (Expanded Only) */}
                  <span
                    className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ${
                      isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
                    }`}
                    aria-hidden={!isExpanded}
                  >
                    <span
                      className={`block truncate text-sm font-medium transition-colors ${
                        isActive ? "text-white" : "text-blue-50 group-hover/category:text-white"
                      }`}
                    >
                      {name}
                    </span>
                    <span className="block text-[11px] font-medium text-blue-100/75">
                      {count} {count === 1 ? "unit" : "units"}
                    </span>
                  </span>
                </Link>

                {/* Floating Tooltip (Collapsed Only) */}
                {!isExpanded && (
                  <Link
                    href={href}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="pointer-events-none absolute left-full top-1/2 z-[100] ml-3 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-md border border-white/10 bg-[#0f172a] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover/category:pointer-events-auto group-hover/category:visible group-hover/category:translate-x-0 group-hover/category:opacity-100"
                  >
                    {name}
                  </Link>
                )}

                {/* Camera Add-ons (Only renders if category matches and items exist) */}
                {isExpanded && isCameraCategory(name) && cameraAddOns.length > 0 && (
                  <AddOnDropdown
                    items={cameraAddOns}
                    color={color}
                    defaultOpen={isActive}
                  />
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}