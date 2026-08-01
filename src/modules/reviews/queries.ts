import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Rating = Database["public"]["Tables"]["ratings"]["Row"];

export async function getRatingForOrder(orderId: string): Promise<Rating | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ratings")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  return data ?? null;
}
