import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type DriverProfile = Database["public"]["Tables"]["driver_profiles"]["Row"];
type DriverDocument = Database["public"]["Tables"]["driver_documents"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const NEW_STATUSES: OrderStatus[] = ["submitted", "awaiting_driver"];
const ACTIVE_STATUSES: OrderStatus[] = [
  "driver_assigned",
  "driver_on_the_way",
  "arrived_at_pickup",
  "item_picked_up",
  "in_transit",
  "arrived_at_destination",
  "delivered",
];
const CANCELLED_STATUSES: OrderStatus[] = [
  "cancelled_by_customer",
  "cancelled_by_driver",
  "cancelled_by_admin",
];

export interface DashboardStats {
  newOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalOrderValueCzk: number;
  platformRevenueCzk: number;
  activeDriverCount: number;
}

const EMPTY_STATS: DashboardStats = {
  newOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  totalOrderValueCzk: 0,
  platformRevenueCzk: 0,
  activeDriverCount: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient();
    const [{ data: orders }, { count: activeDriverCount }] = await Promise.all([
      supabase.from("orders").select("status, customer_price_czk, platform_fee_czk"),
      supabase
        .from("driver_profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_available", true),
    ]);

    const rows = orders ?? [];
    return {
      newOrders: rows.filter((o) => NEW_STATUSES.includes(o.status)).length,
      activeOrders: rows.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
      completedOrders: rows.filter((o) => o.status === "completed").length,
      cancelledOrders: rows.filter((o) => CANCELLED_STATUSES.includes(o.status)).length,
      totalOrderValueCzk: rows.reduce((sum, o) => sum + (o.customer_price_czk ?? 0), 0),
      platformRevenueCzk: rows
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + (o.platform_fee_czk ?? 0), 0),
      activeDriverCount: activeDriverCount ?? 0,
    };
  } catch {
    // No Supabase project configured yet, or it's unreachable.
    return EMPTY_STATS;
  }
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  driverId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function listOrdersForAdmin(filters: OrderFilters): Promise<Order[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
    if (filters.customerId) query = query.eq("customer_profile_id", filters.customerId);
    if (filters.driverId)
      query = query.eq("assigned_driver_profile_id", filters.driverId);
    if (filters.minPrice !== undefined)
      query = query.gte("customer_price_czk", filters.minPrice);
    if (filters.maxPrice !== undefined)
      query = query.lte("customer_price_czk", filters.maxPrice);

    const { data, error } = await query.limit(200);
    if (error) return [];
    return data;
  } catch {
    return [];
  }
}

export async function listDriversForReview(): Promise<
  (DriverProfile & { profile: Profile | null; documents: DriverDocument[] })[]
> {
  try {
    const supabase = await createClient();
    const { data: drivers } = await supabase
      .from("driver_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!drivers?.length) return [];

    const profileIds = drivers.map((d) => d.profile_id);
    const [{ data: profiles }, { data: documents }] = await Promise.all([
      supabase.from("profiles").select("*").in("id", profileIds),
      supabase
        .from("driver_documents")
        .select("*")
        .in(
          "driver_profile_id",
          drivers.map((d) => d.id),
        ),
    ]);

    return drivers.map((driver) => ({
      ...driver,
      profile: profiles?.find((p) => p.id === driver.profile_id) ?? null,
      documents: documents?.filter((d) => d.driver_profile_id === driver.id) ?? [],
    }));
  } catch {
    return [];
  }
}
