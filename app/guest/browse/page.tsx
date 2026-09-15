import { Suspense } from 'react';
import { BrowseFilters } from '@/components/booking/BrowseFilters';
import { BrowseResults } from '@/components/booking/BrowseResults';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

interface Props {
  searchParams: { category?: string; search?: string };
}

export default async function BrowsePage({ searchParams }: Props) {
  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Browse Rentals</h1>
          <p className="mt-2 text-sm text-neutral-600 sm:text-base">
            Find the perfect rental for your next project, trip, or adventure.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full lg:w-60 lg:shrink-0">
            <Suspense fallback={<div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">Loading filters...</div>}>
              <BrowseFilters currentCategory={searchParams.category} />
            </Suspense>
          </aside>

          <div className="min-w-0 flex-1">
            <BrowseResults />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
