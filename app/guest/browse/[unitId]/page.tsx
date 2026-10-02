import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';
import { getListingById } from '@/lib/listing-catalog';

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  maximumFractionDigits: 0,
});

export default async function ListingDetailsPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const unit = getListingById(unitId);

  if (!unit) {
    notFound();
  }

  const isAvailable = unit.status === 'available';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/guest/browse"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            &larr; Back to listings
          </Link>

          <article className="mt-5 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
            <div className="relative min-h-72 bg-slate-100 sm:min-h-[28rem]">
              {unit.imageUrl ? (
                <Image
                  src={unit.imageUrl}
                  alt={unit.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-6"
                />
              ) : (
                <div className="flex h-full min-h-72 items-center justify-center text-slate-500">
                  Photo coming soon
                </div>
              )}
            </div>

            <div className="flex flex-col p-6 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                {unit.category}
              </p>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                  {unit.name}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    isAvailable
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {unit.description ? (
                <p className="mt-5 leading-7 text-slate-600">
                  {unit.description}
                </p>
              ) : null}

              {unit.includedItems?.length ? (
                <div className="mt-7">
                  <h2 className="font-bold text-slate-900">Included items</h2>
                  <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
                    {unit.includedItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-auto pt-8">
                <p className="text-sm text-slate-500">Rental rate</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-950">
                  {unit.pricePerDay !== undefined
                    ? `₱${pesoFormatter.format(unit.pricePerDay)}`
                    : 'Daily rate coming soon'}
                  {unit.pricePerDay !== undefined ? (
                    <span className="ml-1 text-base font-medium text-slate-500">
                      / day
                    </span>
                  ) : null}
                </p>
                {isAvailable ? (
                  <Link
                    href="/auth/login"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white transition hover:bg-blue-800 sm:w-auto"
                  >
                    Book Now
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-label={`${unit.name} is unavailable for booking`}
                    className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-200 px-5 py-3 text-base font-bold text-slate-500 sm:w-auto"
                  >
                    Unavailable
                  </button>
                )}
              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
