import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

/**
 * Service-role client — bypasses RLS entirely. Use ONLY for tables that
 * deliberately have no client-reachable write policy at all (see rls
 * migration): audit_logs, payments, payouts. Every actual admin mutation
 * on orders/profiles/etc. (assign driver, change price, suspend a user,
 * ...) goes through the regular per-request client instead, so it's still
 * bound by the admin's own session and subject to RLS — this client must
 * never be used for anything a normal authenticated call could do.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function logAdminAction(params: {
  actorProfileId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from("audit_logs").insert({
      actor_profile_id: params.actorProfileId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      // Plain JSON-safe object (status strings, ids, numbers) — same gap as
      // PriceBreakdown in modules/orders/actions.ts: missing an index
      // signature, not actually unsafe data.
      metadata: (params.metadata as Json) ?? null,
    });
  } catch {
    // Auditing must never block the actual admin action from succeeding.
  }
}
