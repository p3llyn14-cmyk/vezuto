"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/modules/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { getNextDriverStatus, isCancellableByDriver } from "./status-transitions";

type ImageType = Database["public"]["Enums"]["image_type"];

export type DriverActionState = { message?: string } | undefined;

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * First come, first served — the actual race protection lives in the DB
 * (orders_update RLS USING clause + row lock, see supabase/migrations and
 * supabase/testing/rls_smoke_test.sql). This just performs the UPDATE and
 * reports whether it actually landed: 0 rows back means someone else beat
 * this driver to it, not an error.
 */
export async function claimOrderAction(orderId: string): Promise<DriverActionState> {
  if (!isSupabaseConfigured()) {
    return {
      message: "Přijímání zakázek zatím není nastavené — chybí připojení k Supabase.",
    };
  }

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "driver") {
    return { message: "Pro přijetí zakázky musíte být přihlášeni jako řidič." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ assigned_driver_profile_id: profile.id, status: "driver_assigned" })
    .eq("id", orderId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { message: "Zakázku se nepodařilo přijmout. Zkuste to prosím znovu." };
  }
  if (!data) {
    return { message: "Tuto zakázku už mezitím přijal jiný řidič." };
  }

  await supabase.from("messages").insert({
    order_id: orderId,
    sender_profile_id: profile.id,
    message_type: "system",
    content: `Řidič ${profile.first_name} přijal zakázku.`,
  });

  revalidatePath("/zakazky");
  revalidatePath(`/objednavky/${orderId}`);
  return undefined;
}

export async function advanceOrderStatusAction(
  orderId: string,
): Promise<DriverActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "driver") {
    return { message: "Pro změnu stavu musíte být přihlášeni jako řidič." };
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  const nextStatus = order ? getNextDriverStatus(order.status) : undefined;
  if (!nextStatus) {
    return { message: "Tuto zakázku už nelze v tomto stavu posunout." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId);
  if (error) {
    return { message: "Stav se nepodařilo změnit." };
  }

  revalidatePath(`/objednavky/${orderId}`);
  return undefined;
}

export async function cancelOrderAsDriverAction(
  orderId: string,
): Promise<DriverActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "driver") {
    return { message: "Pro zrušení zakázky musíte být přihlášeni jako řidič." };
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (!order || !isCancellableByDriver(order.status)) {
    return { message: "Tuto zakázku už nelze zrušit." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled_by_driver" })
    .eq("id", orderId);

  if (error) {
    return { message: "Zakázku se nepodařilo zrušit." };
  }

  revalidatePath(`/objednavky/${orderId}`);
  return undefined;
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

export async function uploadOrderPhotoAction(
  _prevState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const orderId = formData.get("orderId");
  const imageType = formData.get("imageType") as ImageType | null;
  const photo = formData.get("photo");

  if (
    typeof orderId !== "string" ||
    !imageType ||
    !(photo instanceof File) ||
    photo.size === 0
  ) {
    return { message: "Vyberte prosím fotografii." };
  }
  if (photo.size > MAX_PHOTO_BYTES || !ALLOWED_PHOTO_TYPES.has(photo.type)) {
    return { message: "Fotografie musí být JPEG, PNG, WEBP nebo HEIC do 8 MB." };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return { message: "Nejste přihlášeni." };
  }

  const supabase = await createClient();
  const path = `${orderId}/${crypto.randomUUID()}-${sanitizeFileName(photo.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("order-images")
    .upload(path, photo, { contentType: photo.type });

  if (uploadError) {
    return { message: "Fotografii se nepodařilo nahrát." };
  }

  const { error: insertError } = await supabase.from("order_images").insert({
    order_id: orderId,
    uploaded_by_profile_id: profile.id,
    image_type: imageType,
    storage_path: path,
  });

  if (insertError) {
    return { message: "Fotografie se nahrála, ale záznam se nepodařilo uložit." };
  }

  revalidatePath(`/objednavky/${orderId}`);
  return undefined;
}
