"use client";

import { useState } from "react";

export default function AdminHeader({
  title,
}: {
  title: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-5 md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          Menu
        </button>

        <h1 className="text-lg font-semibold text-[#2C3E50]">
          {title}
        </h1>
      </div>

      <span className="hidden text-sm text-neutral-500 sm:block">
        RentSpotPH Management
      </span>

      {menuOpen && (
        <div className="absolute left-0 top-16 w-full border-b border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 md:hidden">
          Use the navigation panel to access your available modules.
        </div>
      )}
    </header>
  );
}