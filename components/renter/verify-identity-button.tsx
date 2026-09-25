"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";

export default function VerifyIdentityButton({ isDeclined }: { isDeclined: boolean }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setLoading(false);
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/verification/create-session", { method: "POST" });

      if (!res.ok) {
        const text = await res.text();
        console.error("Create session failed:", res.status, text);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="group inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60"
    >
      {loading ? "Starting…" : isDeclined ? "Try verification again" : "Verify my identity"}
      <ArrowUpRight size={17} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </button>
  );
}