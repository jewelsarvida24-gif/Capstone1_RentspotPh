"use client";

import { useEffect, useRef, useState } from "react";

type UnitFormValues = {
  unit_name?: string | null;
  description?: string | null;
  category?: string | null;
  daily_rate?: number | string | null;
  price_per_day?: number | string | null;
  image_url?: string | null;
};

type UnitField = "unit_name" | "category" | "description" | "daily_rate";
type UnitFieldErrors = Partial<Record<UnitField, string>>;

const fieldClassName =
  "mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[#3E7DBB] focus:ring-2 focus:ring-[#3E7DBB]/20";
const invalidFieldClassName = "border-red-500 focus:border-red-500 focus:ring-red-100";

function validateField(field: UnitField, value: string) {
  if (!value.trim()) {
    const fieldNames: Record<UnitField, string> = {
      unit_name: "Unit name",
      category: "Category",
      description: "Description",
      daily_rate: "Price per day",
    };
    return `${fieldNames[field]} is required.`;
  }

  if (field === "daily_rate") {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      return "Price per day must be a valid number greater than zero.";
    }
  }

  return "";
}

export default function UnitForm({
  title,
  values = {},
}: {
  title: string;
  values?: UnitFormValues;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    values.image_url ?? null
  );
  const [fieldErrors, setFieldErrors] = useState<UnitFieldErrors>({});
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewUrl?.startsWith("blob:")) return;

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeImage() {
    setPreviewUrl(null);
    if (imageInput.current) imageInput.current.value = "";
  }

  function validateForm(form: HTMLFormElement) {
    const formData = new FormData(form);
    const fields: UnitField[] = [
      "unit_name",
      "category",
      "description",
      "daily_rate",
    ];
    const errors: UnitFieldErrors = {};

    for (const field of fields) {
      const value = String(formData.get(field) ?? "");
      const error = validateField(field, value);
      if (error) errors[field] = error;
    }

    setFieldErrors(errors);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    validateForm(event.currentTarget);
  }

  function handleFieldBlur(
    event: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: UnitField
  ) {
    const error = validateField(field, event.currentTarget.value);
    setFieldErrors((current) => ({ ...current, [field]: error || undefined }));
  }

  function fieldClasses(field: UnitField) {
    return `${fieldClassName} ${fieldErrors[field] ? invalidFieldClassName : ""}`;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <p className="text-sm font-medium text-[#1F5C94]">Unit Management</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#2C3E50]">{title}</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Enter the rental unit details.
        </p>
      </section>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Unit name
            <input
              type="text"
              name="unit_name"
              defaultValue={values.unit_name ?? ""}
              aria-invalid={Boolean(fieldErrors.unit_name)}
              aria-describedby={fieldErrors.unit_name ? "unit-name-error" : undefined}
              onBlur={(event) => handleFieldBlur(event, "unit_name")}
              placeholder="Enter unit name"
              className={fieldClasses("unit_name")}
            />
            {fieldErrors.unit_name && (
              <span id="unit-name-error" className="mt-1 block text-xs text-red-600">
                {fieldErrors.unit_name}
              </span>
            )}
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Category
            <select
              name="category"
              defaultValue={values.category ?? ""}
              aria-invalid={Boolean(fieldErrors.category)}
              aria-describedby={fieldErrors.category ? "category-error" : undefined}
              onBlur={(event) => handleFieldBlur(event, "category")}
              className={fieldClasses("category")}
            >
              <option value="">Select a category</option>
              <option value="Camera">Camera</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Add-on">Add-on</option>
            </select>
            {fieldErrors.category && (
              <span id="category-error" className="mt-1 block text-xs text-red-600">
                {fieldErrors.category}
              </span>
            )}
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Price per day (PHP)
            <input
              type="text"
              name="daily_rate"
              defaultValue={values.daily_rate ?? values.price_per_day ?? ""}
              inputMode="decimal"
              aria-invalid={Boolean(fieldErrors.daily_rate)}
              aria-describedby={fieldErrors.daily_rate ? "daily-rate-error" : undefined}
              onBlur={(event) => handleFieldBlur(event, "daily_rate")}
              placeholder="e.g. 950"
              className={fieldClasses("daily_rate")}
            />
            {fieldErrors.daily_rate && (
              <span id="daily-rate-error" className="mt-1 block text-xs text-red-600">
                {fieldErrors.daily_rate}
              </span>
            )}
          </label>

          <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
            Description
            <textarea
              name="description"
              rows={4}
              defaultValue={values.description ?? ""}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? "description-error" : undefined}
              onBlur={(event) => handleFieldBlur(event, "description")}
              placeholder="Describe the rental unit"
              className={fieldClasses("description")}
            />
            {fieldErrors.description && (
              <span id="description-error" className="mt-1 block text-xs text-red-600">
                {fieldErrors.description}
              </span>
            )}
          </label>

          <div className="space-y-3 sm:col-span-2">
            <label
              htmlFor="unit-image"
              className="block text-sm font-medium text-neutral-700"
            >
              Unit image
            </label>
            <input
              id="unit-image"
              name="image"
              type="file"
              accept="image/*"
              ref={imageInput}
              onChange={handleImageChange}
              className={`${fieldClassName} file:mr-3 file:rounded-md file:border-0 file:bg-[#A8C5E8]/40 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#1F5C94]`}
            />

            {previewUrl && (
              <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-start">
                <div className="h-40 w-full overflow-hidden rounded-md bg-neutral-100 sm:w-56 sm:shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Unit image preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="inline-flex w-fit items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-rose-300 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7DBB]"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
