"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/modules/auth/queries";
import { createClient } from "@/lib/supabase/server";

export type ChatActionState = { message?: string } | undefined;

export async function sendMessageAction(
  _prevState: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  const orderId = formData.get("orderId");
  const content = formData.get("content");

  if (typeof orderId !== "string" || typeof content !== "string" || !content.trim()) {
    return { message: "Zpráva nemůže být prázdná." };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return { message: "Nejste přihlášeni." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    order_id: orderId,
    sender_profile_id: profile.id,
    message_type: "text",
    content: content.trim().slice(0, 2000),
  });

  if (error) {
    return { message: "Zprávu se nepodařilo odeslat." };
  }

  revalidatePath(`/objednavky/${orderId}`);
  return undefined;
}
