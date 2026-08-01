"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/modules/auth/queries";
import { createClient } from "@/lib/supabase/server";

export type ReviewActionState = { message?: string } | undefined;

export async function submitRatingAction(
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const orderId = formData.get("orderId");
  const reviewedProfileId = formData.get("reviewedProfileId");
  const ratingRaw = formData.get("rating");
  const comment = formData.get("comment");

  const rating = Number(ratingRaw);
  if (
    typeof orderId !== "string" ||
    typeof reviewedProfileId !== "string" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return { message: "Vyberte hodnocení 1 až 5 hvězdiček." };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return { message: "Nejste přihlášeni." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ratings").insert({
    order_id: orderId,
    reviewer_profile_id: profile.id,
    reviewed_profile_id: reviewedProfileId,
    rating,
    comment:
      typeof comment === "string" && comment.trim()
        ? comment.trim().slice(0, 1000)
        : null,
  });

  if (error) {
    return { message: "Hodnocení se nepodařilo uložit." };
  }

  revalidatePath(`/objednavky/${orderId}`);
  return undefined;
}

export async function confirmDeliveryAction(orderId: string): Promise<ReviewActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") {
    return { message: "Pouze zákazník může potvrdit doručení." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { message: "Doručení se nepodařilo potvrdit." };
  }

  revalidatePath(`/objednavky/${orderId}`);
  return undefined;
}
