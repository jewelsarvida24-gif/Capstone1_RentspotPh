import Link from 'next/link';

const categories = ['Camera', 'Smartphone', 'Vehicle'];

export function BrowseFilters({ currentCategory }: { currentCategory?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">
        Categories
      </p>

      <div className="mt-4 space-y-2">
        <Link
          href="/guest/browse"
          className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
            !currentCategory
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          All units
        </Link>

        {categories.map((category) => {
          const isActive = currentCategory === category;

          return (
            <Link
              key={category}
              href={
                isActive
                  ? '/guest/browse'
                  : `/guest/browse?category=${encodeURIComponent(category)}`
              }
              className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {category}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
