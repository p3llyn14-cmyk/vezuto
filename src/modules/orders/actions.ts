"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/auth/queries";
import { getMapsProvider } from "@/modules/maps";
import { calculatePrice, type PriceBreakdown } from "@/modules/pricing/calculator";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";
import { orderWizardSchema, type OrderWizardInput } from "./schemas";

export type OrderActionState =
  | {
      errors?: Record<string, string[]>;
      message?: string;
    }
  | undefined;

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

async function estimateForDraft(draft: OrderWizardInput): Promise<PriceBreakdown> {
  const isExpress = draft.timing === "asap";
  let distanceKm = 8;
  let durationMin = 25;

  try {
    const estimate = await getMapsProvider().distanceAndDuration(
      draft.pickup.fullAddress,
      draft.destination.fullAddress,
    );
    distanceKm = estimate.distanceKm;
    durationMin = estimate.durationMin;
  } catch {
    // Maps unavailable/misconfigured — fall back to the flat placeholder
    // rather than blocking the whole wizard on a third-party outage.
  }

  return calculatePrice({
    distanceKm,
    durationMin,
    vehicleType: draft.requestedVehicleType,
    assistanceLevel: draft.assistanceLevel,
    floorsWithoutElevator: [
      draft.pickup.hasElevator ? 0 : draft.pickup.floor,
      draft.destination.hasElevator ? 0 : draft.destination.floor,
    ],
    isExpress,
  });
}

/**
 * Called by the wizard when it reaches the recap step (Krok 6). Takes
 * `unknown`, not OrderWizardInput — this is client state crossing into a
 * Server Action, so it's only as trustworthy as any other user input until
 * orderWizardSchema actually validates it below.
 */
export async function estimatePriceAction(
  draft: unknown,
): Promise<PriceBreakdown | { error: string }> {
  const parsed = orderWizardSchema.safeParse(draft);
  if (!parsed.success) {
    return { error: "Formulář obsahuje chyby — vraťte se a opravte je." };
  }
  return estimateForDraft(parsed.data);
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-]/g, "_").slice(-80);
}

/** Final wizard submit — recomputes price server-side, never trusts the client. */
export async function createOrderAction(
  _prevState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Vytváření objednávek zatím není nastavené — chybí připojení k Supabase.",
    };
  }

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") {
    return { message: "Pro vytvoření objednávky musíte být přihlášeni jako zákazník." };
  }

  const rawDraft = formData.get("orderData");
  if (typeof rawDraft !== "string") {
    return { message: "Chybí data objednávky." };
  }

  let draftJson: unknown;
  try {
    draftJson = JSON.parse(rawDraft);
  } catch {
    return { message: "Data objednávky se nepodařilo přečíst." };
  }

  const parsed = orderWizardSchema.safeParse(draftJson);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const draft = parsed.data;

  const breakdown = await estimateForDraft(draft);
  const supabase = await createClient();

  // Best-effort — a failed/misconfigured geocode just means the order has
  // no coordinates yet, so it falls back to newest-first in available_jobs()
  // instead of blocking order creation on a third-party outage.
  const mapsProvider = getMapsProvider();
  const [pickupCoords, destinationCoords] = await Promise.all([
    mapsProvider.geocode(draft.pickup.fullAddress).catch(() => null),
    mapsProvider.geocode(draft.destination.fullAddress).catch(() => null),
  ]);

  const { data: orderId, error: rpcError } = await supabase.rpc("create_order", {
    p_item_title: draft.itemTitle,
    p_item_category: draft.itemCategory,
    p_item_description: draft.itemDescription || null,
    p_external_listing_url: draft.externalListingUrl || null,
    p_item_count: draft.itemCount,
    p_estimated_weight_kg: draft.estimatedWeightKg ?? null,
    p_length_cm: draft.lengthCm ?? null,
    p_width_cm: draft.widthCm ?? null,
    p_height_cm: draft.heightCm ?? null,
    p_requested_vehicle_type: draft.requestedVehicleType,
    p_assistance_level: draft.assistanceLevel,
    p_disassembly_required: draft.disassemblyRequired,
    p_assembly_required: draft.assemblyRequired,
    p_requested_date:
      draft.timing === "specific_date" ? draft.requestedDate || null : null,
    p_requested_time_from: draft.requestedTimeFrom || null,
    p_requested_time_to: draft.requestedTimeTo || null,
    p_is_flexible: draft.timing === "flexible",
    p_customer_price_czk: breakdown.customerPriceCzk,
    p_driver_payout_czk: breakdown.driverPayoutCzk,
    p_platform_fee_czk: breakdown.platformFeeCzk,
    // PriceBreakdown is a plain object of numbers/booleans — genuinely
    // JSON-safe, just missing the index signature Json's type demands.
    p_pricing_breakdown: breakdown as unknown as Json,
    p_pickup: { ...draft.pickup, lat: pickupCoords?.lat, lng: pickupCoords?.lng },
    p_destination: {
      ...draft.destination,
      lat: destinationCoords?.lat,
      lng: destinationCoords?.lng,
    },
  });

  if (rpcError || !orderId) {
    return { message: "Objednávku se nepodařilo vytvořit. Zkuste to prosím znovu." };
  }

  const photos = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  for (const photo of photos.slice(0, 8)) {
    if (photo.size > MAX_PHOTO_BYTES || !ALLOWED_PHOTO_TYPES.has(photo.type)) continue;

    const path = `${orderId}/${crypto.randomUUID()}-${sanitizeFileName(photo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("order-images")
      .upload(path, photo, { contentType: photo.type });

    if (!uploadError) {
      await supabase.from("order_images").insert({
        order_id: orderId as string,
        uploaded_by_profile_id: profile.id,
        image_type: "item_reference",
        storage_path: path,
      });
    }
    // A failed photo upload doesn't fail the whole order — it already
    // exists and is in the driver pool at this point.
  }

  redirect(`/objednavky/${orderId}`);
}
