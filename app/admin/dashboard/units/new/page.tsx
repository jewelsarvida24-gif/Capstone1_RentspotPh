const fieldClassName =
  "mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[#3E7DBB] focus:ring-2 focus:ring-[#3E7DBB]/20";

export default function AddUnitPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <p className="text-sm font-medium text-[#1F5C94]">Unit Management</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#2C3E50]">
          Add rental unit
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Enter the rental unit details.
        </p>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2"></div>
      </section>
    </div>
  );
}
