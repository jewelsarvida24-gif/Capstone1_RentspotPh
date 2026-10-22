"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin_guard";
import { createAdminClient } from "@/lib/supabase_admin";
import { isBookingBlockingUnit } from "@/lib/unit-booking-rules";

type UnitInput = {
  unitId?: string;
  unit_name: string;
  category: string;
  description: string;
  daily_rate: number;
  status: string;
  image_url: string | null;
};

type SaveUnitResult =
  | { success: true; image_url: string | null }
  | { error: string };

const categories = ["Camera", "Smartphone", "Vehicle", "Add-on"];
const unitImageBucket = "unit-images";
const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;
const maxImageSize = 10 * 1024 * 1024;

function isSupportedImageType(type: string) {
  return Object.prototype.hasOwnProperty.call(imageTypes, type);
}

export async function saveUnit(
  input: UnitInput,
  imageUpload: FormData
): Promise<SaveUnitResult> {
  await requireStaff(["admin"]);

  const unitName = input.unit_name.trim();
  const inclusions = input.description
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const dailyRate = Number(input.daily_rate);

  if (!unitName || inclusions.length === 0 || !categories.includes(input.category)) {
    return {
      error: "Unit name, category, and at least one inclusion are required.",
    };
  }

  if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
    return { error: "Price per day must be a valid number greater than zero." };
  }

  const allowedStatuses = input.unitId
    ? ["available", "unavailable", "Archived"]
    : ["available", "unavailable"];
  if (!allowedStatuses.includes(input.status)) {
    return { error: "Invalid unit status." };
  }

  const uploadedFile = imageUpload.get("unitImage");
  if (uploadedFile !== null && !(uploadedFile instanceof File)) {
    return { error: "The selected unit image could not be read. Please select it again." };
  }
  const imageFile = uploadedFile instanceof File ? uploadedFile : null;
  if (imageFile) {
    if (!isSupportedImageType(imageFile.type)) {
      return { error: "Choose a JPEG, PNG, WebP, or GIF image." };
    }
    if (imageFile.size > maxImageSize) {
      return { error: "Unit images must be 10 MB or smaller." };
    }
  } else if (input.image_url?.startsWith("blob:")) {
    return { error: "The selected image could not be uploaded. Please select it again." };
  }

  const supabase = createAdminClient();
  if (input.unitId) {
    const { data: bookings, error: bookingsError } = await supabase
      .from("tbl_bookings")
      .select("status, created_at")
      .eq("unit_id", input.unitId);

    if (bookingsError) {
      console.error("[UNIT FORM] Failed to verify active bookings before editing:", bookingsError);
      return { error: bookingsError.message };
    }
    if (
      (bookings ?? []).some((booking) =>
        isBookingBlockingUnit(booking.status, booking.created_at)
      )
    ) {
      return {
        error: "This rental unit cannot be edited while it has an active booking.",
      };
    }
  }

  let uploadedImagePath: string | null = null;
  let imageUrl = input.image_url;
  if (imageFile) {
    const extension = imageTypes[imageFile.type];
    uploadedImagePath = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(unitImageBucket)
      .upload(uploadedImagePath, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[UNIT FORM] Failed to upload rental unit image:", uploadError);
      return { error: `Unable to upload unit image: ${uploadError.message}` };
    }

    imageUrl = supabase.storage
      .from(unitImageBucket)
      .getPublicUrl(uploadedImagePath).data.publicUrl;
  }

  const unit = {
    unit_name: unitName,
    category: input.category,
    description: inclusions.join("\n"),
    daily_rate: dailyRate,
    status: input.status,
    image_url: imageUrl,
  };

  let saveError: string | null = null;
  if (input.unitId) {
    const { data, error } = await supabase
      .from("tbl_units")
      .update(unit)
      .eq("unit_id", input.unitId)
      .select("unit_id")
      .maybeSingle();

    if (error) {
      console.error("[UNIT FORM] Failed to update rental unit:", error);
      saveError = error.message;
    } else if (!data) {
      saveError = "The rental unit could not be found.";
    }
  } else {
    const { error } = await supabase.from("tbl_units").insert(unit);
    if (error) {
      console.error("[UNIT FORM] Failed to add rental unit:", error);
      saveError = error.message;
    }
  }

  if (saveError) {
    if (uploadedImagePath) {
      const { error: cleanupError } = await supabase.storage
        .from(unitImageBucket)
        .remove([uploadedImagePath]);
      if (cleanupError) {
        console.error("[UNIT FORM] Failed to remove unreferenced uploaded image:", cleanupError);
      }
    }
    return { error: saveError };
  }

  revalidatePath("/guest/browse");
  revalidatePath("/guest/browse/[unitId]", "page");
  return { success: true, image_url: imageUrl };
}
