"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase_client";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
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
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      <LogOut className="h-5 w-5" />

      <span>
        {isLoggingOut ? "Logging out..." : "Log out"}
      </span>
    </button>
  );
}