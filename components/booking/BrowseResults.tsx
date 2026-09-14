type BrowseResultsProps = {
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function BrowseResults({
  title = 'Rental results',
  emptyTitle = 'No units found',
  emptyDescription = 'Try a different category or search term.',
}: BrowseResultsProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      </div>

      <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden pr-1">
        <div className="grid min-h-[320px] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="col-span-full flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center">
            <div>
              <p className="text-lg font-medium text-neutral-700">{emptyTitle}</p>
              <p className="mt-1 text-sm text-neutral-500">{emptyDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
