import type { ReactNode } from 'react';

export function BrowseResults({ children, title = 'Rental results' }: { children?: ReactNode; title?: string }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  );
}