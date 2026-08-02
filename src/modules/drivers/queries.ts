import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type AvailableJob = Database["public"]["Functions"]["available_jobs"]["Returns"][number];

export async function listAvailableJobs(): Promise<AvailableJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("available_jobs");
  if (error) return [];
  return data;
}

export async function getAvailableJob(orderId: string): Promise<AvailableJob | null> {
  const jobs = await listAvailableJobs();
  return jobs.find((job) => job.order_id === orderId) ?? null;
}

export async function getDriverLocationStatus(
  driverProfileId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("driver_profiles")
    .select("location_updated_at")
    .eq("profile_id", driverProfileId)
    .maybeSingle();
  return data?.location_updated_at ?? null;
}

export async function listDriverOrders(driverProfileId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("assigned_driver_profile_id", driverProfileId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}
