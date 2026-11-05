"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Circle, Eye, EyeOff, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase_client";

/* =========================================================
   PASSWORD FIELD
========================================================= */

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled: boolean;
  autoFocus?: boolean;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  autoFocus,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#334155]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          required
          className="input-field"
          style={{ paddingRight: "2.75rem" }}
        />
        <button
          type="button"
          onClick={() => setShow((visible) => !visible)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function Rule({ met, children }: { met: boolean; children: string }) {
  return (
    <li className={`flex items-center gap-2 ${met ? "text-emerald-600" : "text-[#697386]"}`}>
      {met ? <CheckCircle2 size={14} className="shrink-0" /> : <Circle size={14} className="shrink-0" />}
      {children}
    </li>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-700 backdrop-blur-sm"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/* =========================================================
   PASSWORD BOX (heading + description come from the parent)
========================================================= */

export default function ChangePasswordForm({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const longEnough = next.length >= 8;
  const hasCapital = /[A-Z]/.test(next);
  const hasNumber = /\d/.test(next);
  const hasSpecial = /[^A-Za-z0-9\s]/.test(next);
  const different = next.length > 0 && next !== current;
  const matches = confirm.length > 0 && next === confirm;
  const canSubmit =
    !saving &&
    current.length > 0 &&
    longEnough &&
    hasCapital &&
    hasNumber &&
    hasSpecial &&
    different &&
    matches;

  function resetForm() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
  }

  function openForm() {
    resetForm();
    setSuccess(false);
    setOpen(true);
  }

  function closeForm() {
    if (saving) return;
    resetForm();
    setOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setError("Could not connect. Please try again.");
      setSaving(false);
      return;
    }

    try {
      // 1. Confirm the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signInError) {
        setError(
          signInError.status === 429
            ? "Too many attempts. Please wait a moment and try again."
            : "Your current password is incorrect."
        );
        return;
      }

      // 2. Set the new password
      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) {
        setError(updateError.message || "Could not update your password.");
        return;
      }

      // 3. Sign out every other device; this one stays signed in
      try {
        await supabase.auth.signOut({ scope: "others" });
      } catch {
        /* the password is already changed; ignore */
      }

      resetForm();
      setOpen(false);
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 px-6 py-5">
      {success && !open && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <CheckCircle2 size={16} />
          Your password was updated. Your other devices have been signed out.
        </p>
      )}

      {!open ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Current password
            </p>
            <p className="mt-2 text-base font-semibold tracking-[0.3em] text-slate-900">
              ••••••••••
            </p>
          </div>
          <button
            type="button"
            onClick={openForm}
            aria-expanded={open}
            className="flex w-fit shrink-0 items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <KeyRound size={16} />
            Change password
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && <ErrorBanner message={error} />}

          <PasswordField
            id="current-password"
            label="Current password"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
            disabled={saving}
            autoFocus
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField
              id="new-password"
              label="New password"
              value={next}
              onChange={setNext}
              autoComplete="new-password"
              disabled={saving}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              disabled={saving}
            />
          </div>

          <ul className="grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
            <Rule met={longEnough}>At least 8 characters</Rule>
            <Rule met={hasCapital}>At least 1 capital letter</Rule>
            <Rule met={hasNumber}>Contains a number</Rule>
            <Rule met={hasSpecial}>Contains a special character (like ! @ # $)</Rule>
            <Rule met={different}>Different from your current password</Rule>
            <Rule met={matches}>New passwords match</Rule>
          </ul>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex min-w-[180px] items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all duration-200 ${
                canSubmit
                  ? "bg-blue-600 text-white shadow-md hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-lg"
                  : "cursor-not-allowed bg-blue-200 text-white opacity-60"
              }`}
            >
              <KeyRound className="h-4 w-4" />
              {saving ? "Updating..." : "Update password"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}