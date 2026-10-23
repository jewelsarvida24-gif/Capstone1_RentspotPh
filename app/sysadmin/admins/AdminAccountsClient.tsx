"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteAdmin, resendInvite } from "./actions";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function InviteAdminForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "sysadmin">("admin");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSentTo("");

    startTransition(async () => {
      const result = await inviteAdmin({ fullName, email, role });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setSentTo(email.trim().toLowerCase());
      setFullName("");
      setEmail("");
      setRole("admin");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(50,50,93,0.08)]"
    >
      <h2 className="text-lg font-semibold text-[#2C3E50]">Invite admin</h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {sentTo && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Invite sent to {sentTo}.
        </div>
      )}

      <div>
        <label
          htmlFor="invite-name"
          className="mb-2 block text-sm font-semibold text-neutral-700"
        >
          Full name
        </label>
        <input
          id="invite-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          placeholder="Juan Dela Cruz"
        />
      </div>

      <div>
        <label
          htmlFor="invite-email"
          className="mb-2 block text-sm font-semibold text-neutral-700"
        >
          Email address
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="name@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="invite-role"
          className="mb-2 block text-sm font-semibold text-neutral-700"
        >
          Role
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "sysadmin")}
          className={inputClass}
        >
          <option value="admin">Admin</option>
          <option value="sysadmin">SysAdmin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-lg bg-brand-500 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending invite..." : "Send invite"}
      </button>
    </form>
  );
}

export function ResendInviteButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function onClick() {
    setMessage("");
    startTransition(async () => {
      const result = await resendInvite(userId);
      setMessage("error" in result ? result.error : "Invite resent.");
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Resend invite"}
      </button>
      {message && <span className="text-xs text-neutral-500">{message}</span>}
    </div>
  );
}