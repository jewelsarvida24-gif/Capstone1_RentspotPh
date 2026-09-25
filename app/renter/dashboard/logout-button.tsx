"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase_client";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      return;
    }

    router.replace("/auth/login");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="
          flex
          w-full
          items-center
          gap-3
          rounded-lg
          px-4
          py-2.5
          text-sm
          font-medium
          text-red-600
          transition-colors
          hover:bg-red-50
          hover:text-red-700
        "
      >
        <LogOut className="h-5 w-5" />
        <span>Log out</span>
      </button>

      {/* CONFIRMATION OVERLAY */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
          <div className="card w-full max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <LogOut className="h-7 w-7 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-neutral-800">
              Log out?
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              You'll need to sign in again to access your account.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                className="btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}