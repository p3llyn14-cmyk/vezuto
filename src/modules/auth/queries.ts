import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Current user's profile row, or null if signed out. Memoized per request
 * (React.cache) so pages, layouts, and components can all call this
 * without duplicating the Supabase round-trip.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    return profile;
  } catch {
    // No Supabase project configured yet, or it's unreachable — treat as
    // signed-out rather than crashing every page that renders the header.
    return null;
  }
});

/**
 * Use in Server Components/pages that require a signed-in user. Redirects
 * to login (preserving the original path) rather than rendering anything
 * for a logged-out visitor — the Proxy already does this optimistically,
 * this is the real (DB-backed) check close to the data.
 */
export async function requireProfile(currentPath: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/prihlaseni?pokracovat=${encodeURIComponent(currentPath)}`);
  }
  return profile;
}

/**
 * Same as requireProfile, but also redirects a signed-in non-customer
 * (e.g. a driver) away — order creation is customer-only in the MVP.
 */
export async function requireCustomerProfile(currentPath: string): Promise<Profile> {
  const profile = await requireProfile(currentPath);
  if (profile.role !== "customer") {
    redirect("/ucet");
  }
  return profile;
}

/** Same as requireCustomerProfile, but for the driver-only section. */
export async function requireDriverProfile(currentPath: string): Promise<Profile> {
  const profile = await requireProfile(currentPath);
  if (profile.role !== "driver") {
    redirect("/ucet");
  }
  return profile;
}

/** Same as requireCustomerProfile, but for the admin-only section. */
export async function requireAdminProfile(currentPath: string): Promise<Profile> {
  const profile = await requireProfile(currentPath);
  if (profile.role !== "admin") {
    redirect("/ucet");
  }
  return profile;
}
