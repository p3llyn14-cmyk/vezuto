import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

export async function getMessages(orderId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data;
}
