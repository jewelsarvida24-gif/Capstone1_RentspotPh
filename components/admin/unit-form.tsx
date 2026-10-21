type UnitFormValues = {
  unit_name?: string | null;
  description?: string | null;
  category?: string | null;
  daily_rate?: number | string | null;
  price_per_day?: number | string | null;
};

const fieldClassName =
  "mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[#3E7DBB] focus:ring-2 focus:ring-[#3E7DBB]/20";

export default function UnitForm({
  title,
  values = {},
}: {
  title: string;
  values?: UnitFormValues;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <p className="text-sm font-medium text-[#1F5C94]">Unit Management</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#2C3E50]">{title}</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Enter the rental unit details.
        </p>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Unit name
            <input
              type="text"
              name="unit_name"
              defaultValue={values.unit_name ?? ""}
              placeholder="Enter unit name"
              className={fieldClassName}
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Category
            <select
              name="category"
              defaultValue={values.category ?? ""}
              className={fieldClassName}
            >
              <option value="">Select a category</option>
              <option value="Camera">Camera</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Add-on">Add-on</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Price per day (PHP)
            <input
              type="text"
              name="daily_rate"
              defaultValue={values.daily_rate ?? values.price_per_day ?? ""}
              placeholder="e.g. 950"
              className={fieldClassName}
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
            Description
            <textarea
              name="description"
              rows={4}
              defaultValue={values.description ?? ""}
              placeholder="Describe the rental unit"
              className={fieldClassName}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
