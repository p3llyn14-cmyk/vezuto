import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderLocation = Database["public"]["Tables"]["order_locations"]["Row"];
type OrderStatusHistory = Database["public"]["Tables"]["order_status_history"]["Row"];

export async function listCustomerOrders(customerProfileId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_profile_id", customerProfileId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getOrderWithLocations(
  orderId: string,
): Promise<{ order: Order; locations: OrderLocation[] } | null> {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) return null;

  const { data: locations } = await supabase
    .from("order_locations")
    .select("*")
    .eq("order_id", orderId);

  return { order, locations: locations ?? [] };
}

export async function getOrderStatusHistory(
  orderId: string,
): Promise<OrderStatusHistory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

/** First-name map for order.customer_profile_id / assigned_driver_profile_id — used to label chat messages. */
export async function getParticipantNames(order: Order): Promise<Record<string, string>> {
  const ids = [order.customer_profile_id, order.assigned_driver_profile_id].filter(
    (id): id is string => !!id,
  );
  if (ids.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, first_name").in("id", ids);

  return Object.fromEntries((data ?? []).map((p) => [p.id, p.first_name]));
}

export async function getOrderPhotoUrls(orderId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: images } = await supabase
    .from("order_images")
    .select("storage_path")
    .eq("order_id", orderId);

  if (!images?.length) return [];

  const urls = await Promise.all(
    images.map(async ({ storage_path }) => {
      const { data } = await supabase.storage
        .from("order-images")
        .createSignedUrl(storage_path, 60 * 60);
      return data?.signedUrl ?? null;
    }),
  );

  return urls.filter((u): u is string => u !== null);
}
