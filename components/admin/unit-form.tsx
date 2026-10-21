"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveUnit } from "@/app/admin/dashboard/units/actions";

type UnitFormValues = {
  unit_id?: string;
  unit_name?: string | null;
  description?: string | null;
  category?: string | null;
  daily_rate?: number | string | null;
  price_per_day?: number | string | null;
  image_url?: string | null;
  status?: string | null;
};

type UnitField = "unit_name" | "category" | "description" | "daily_rate";
type UnitFieldErrors = Partial<Record<UnitField, string>>;

const fieldClassName =
  "mt-1.5 w-full rounded-lg border border-[#A8C5E8]/70 bg-[#fbfdff] px-3.5 py-3 text-sm text-[#102A4A] outline-none transition placeholder:text-slate-400 hover:border-[#6E9BD3] focus:border-[#3E7DBB] focus:ring-2 focus:ring-[#3E7DBB]/20";
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
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    values.image_url ?? null
  );
  const [fieldErrors, setFieldErrors] = useState<UnitFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
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
    return { errors, formData };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const { errors, formData } = validateForm(event.currentTarget);
    if (Object.keys(errors).length > 0) return;

    const imageUrl = imageInput.current?.files?.length
      ? values.image_url ?? null
      : previewUrl;
    const unit = {
      unit_name: String(formData.get("unit_name")).trim(),
      category: String(formData.get("category")),
      description: String(formData.get("description")).trim(),
      daily_rate: Number(formData.get("daily_rate")),
      status: values.unit_id ? values.status ?? "available" : "available",
      image_url: imageUrl?.startsWith("blob:") ? values.image_url ?? null : imageUrl,
    };

    setSaveError("");
    setSaveSuccess("");
    setSaving(true);
    try {
      const result = await saveUnit({
        ...unit,
        unitId: values.unit_id,
      });

      if ("error" in result) {
        setSaveError(`Unable to save rental unit: ${result.error}`);
        setSaving(false);
        return;
      }

      setSaveSuccess(
        values.unit_id
          ? "Rental unit updated successfully."
          : "Rental unit added successfully."
      );
    } catch (error) {
      console.error("[UNIT FORM] Failed to save rental unit:", error);
      setSaveError(
        `Unable to save rental unit: ${
          error instanceof Error ? error.message : "An unexpected error occurred."
        }`
      );
      setSaving(false);
      return;
    }

    setSaving(false);
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
        <p className="text-sm font-semibold tracking-wide text-[#1F5C94]">
          Unit Management
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#2C3E50]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the rental unit details.
        </p>
      </section>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-[#A8C5E8]/70 border-t-4 border-t-[#3E7DBB] bg-white p-5 shadow-[0_18px_36px_-18px_rgba(16,42,74,0.3)] sm:p-7"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#A8C5E8]/50 pb-4">
          <div>
            <h2 className="text-base font-semibold text-[#102A4A]">
              Unit details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add the information renters will see in the listing.
            </p>
          </div>
          <span className="rounded-full bg-[#A8C5E8]/25 px-3 py-1 text-xs font-semibold text-[#1F5C94]">
            {values.unit_id ? "Edit unit" : "New unit"}
          </span>
        </div>
        {saveError && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {saveSuccess}
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#102A4A]">
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

          <label className="block text-sm font-semibold text-[#102A4A]">
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

          <label className="block text-sm font-semibold text-[#102A4A]">
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

          <label className="block text-sm font-semibold text-[#102A4A] sm:col-span-2">
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
              className="block text-sm font-semibold text-[#102A4A]"
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
              className={`${fieldClassName} file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#A8C5E8]/35 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#1F5C94]`}
            />

            {previewUrl && (
              <div className="flex flex-col gap-3 rounded-xl border border-[#A8C5E8]/60 bg-[#fbfdff] p-3 sm:flex-row sm:items-start">
                <div className="h-40 w-full overflow-hidden rounded-lg bg-[#A8C5E8]/20 sm:w-56 sm:shrink-0">
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
                  className="inline-flex w-fit items-center justify-center rounded-lg border border-[#A8C5E8] px-3 py-2 text-sm font-semibold text-[#1F5C94] transition hover:border-rose-300 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7DBB]"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#A8C5E8]/50 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="inline-flex items-center justify-center rounded-lg border border-[#A8C5E8] px-5 py-2.5 text-sm font-semibold text-[#1F5C94] transition hover:bg-[#A8C5E8]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7DBB]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-[#1F5C94] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102A4A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E7DBB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
