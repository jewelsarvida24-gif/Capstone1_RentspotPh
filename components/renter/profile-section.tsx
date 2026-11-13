import type { ReactNode } from "react";

/* =========================================================
   Glass card: the surface used on the forgot-password page.
   No hooks, so it works in server and client components.
========================================================= */

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-white/70 bg-white/30 shadow-[0_20px_60px_rgba(50,50,93,0.12)] backdrop-blur-xl ${className}`}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
      />
      <div className="absolute inset-0 bg-white/60" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** One category of the profile in its own card: title, short description, content. */
export default function ProfileSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-7">
      <GlassCard>
        <div className="px-7 py-8 sm:px-9">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id={`${id}-title`}
                className="text-xl font-semibold tracking-[-0.02em] text-[#2C3E50]"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#697386]">{description}</p>
              )}
            </div>
            {action}
          </div>

          <div className="mt-7">{children}</div>
        </div>
      </GlassCard>
    </section>
  );
}