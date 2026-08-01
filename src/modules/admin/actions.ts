"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/modules/auth/queries";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient, logAdminAction } from "@/lib/supabase/service";
import { getPaymentProvider } from "@/modules/payments";
import type { Database } from "@/types/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type VerificationStatus = Database["public"]["Enums"]["verification_status"];

export type AdminActionState = { message?: string } | undefined;

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return null;
  }
  return profile;
}

/**
 * Every mutation below runs through the requesting admin's own session
 * (RLS still applies — the orders_before_update trigger's admin branch is
 * what actually grants the extra latitude, e.g. bypassing the price-field
 * lock). Only the audit_logs write uses the service role, since that
 * table has no client-reachable INSERT policy at all — see
 * src/lib/supabase/service.ts.
 */
export async function assignDriverAction(
  orderId: string,
  driverProfileId: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) return { message: "Vyžaduje administrátorská práva." };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  const nextStatus: OrderStatus =
    order && ["submitted", "awaiting_driver"].includes(order.status)
      ? "driver_assigned"
      : (order?.status ?? "driver_assigned");

  const { error } = await supabase
    .from("orders")
    .update({ assigned_driver_profile_id: driverProfileId, status: nextStatus })
    .eq("id", orderId);

  if (error) return { message: "Řidiče se nepodařilo přiřadit." };

  await logAdminAction({
    actorProfileId: admin.id,
    action: "assign_driver",
    entityType: "order",
    entityId: orderId,
    metadata: { driverProfileId },
  });
  revalidatePath(`/objednavky/${orderId}`);
  revalidatePath("/admin/objednavky");
  return undefined;
}

export async function changeOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) return { message: "Vyžaduje administrátorská práva." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);
  if (error)
    return {
      message: "Stav se nepodařilo změnit — zkontrolujte, zda je přechod platný.",
    };

  await logAdminAction({
    actorProfileId: admin.id,
    action: "change_status",
    entityType: "order",
    entityId: orderId,
    metadata: { newStatus },
  });
  revalidatePath(`/objednavky/${orderId}`);
  revalidatePath("/admin/objednavky");
  return undefined;
}

export async function changePriceAction(
  orderId: string,
  newCustomerPriceCzk: number,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) return { message: "Vyžaduje administrátorská práva." };
  if (!Number.isFinite(newCustomerPriceCzk) || newCustomerPriceCzk < 0) {
    return { message: "Neplatná cena." };
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("platform_fee_czk, customer_price_czk")
    .eq("id", orderId)
    .single();

  const feePct =
    order?.platform_fee_czk && order.customer_price_czk
      ? order.platform_fee_czk / order.customer_price_czk
      : 0.2;
  const newPlatformFee = Math.round(newCustomerPriceCzk * feePct * 100) / 100;
  const newDriverPayout = Math.round((newCustomerPriceCzk - newPlatformFee) * 100) / 100;

  const { error } = await supabase
    .from("orders")
    .update({
      customer_price_czk: newCustomerPriceCzk,
      platform_fee_czk: newPlatformFee,
      driver_payout_czk: newDriverPayout,
    })
    .eq("id", orderId);

  if (error) return { message: "Cenu se nepodařilo změnit." };

  await logAdminAction({
    actorProfileId: admin.id,
    action: "change_price",
    entityType: "order",
    entityId: orderId,
    metadata: { newCustomerPriceCzk, newPlatformFee, newDriverPayout },
  });
  revalidatePath(`/objednavky/${orderId}`);
  return undefined;
}

export async function refundOrderAction(orderId: string): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) return { message: "Vyžaduje administrátorská práva." };

  // The admin's own session can only SELECT payments (see rls migration),
  // so both reading the paid row and writing the refund back go through
  // the service role — same reasoning as the payments insert in
  // modules/payments/actions.ts.
  const serviceClient = createServiceClient();
  const { data: payment } = await serviceClient
    .from("payments")
    .select("provider, provider_payment_id")
    .eq("order_id", orderId)
    .eq("status", "paid")
    .maybeSingle();

  if (payment?.provider === "stripe") {
    if (!payment.provider_payment_id) {
      return { message: "Platbu se nepodařilo vrátit — chybí ID platby u Stripe." };
    }
    const provider = getPaymentProvider();
    if (!provider) {
      return { message: "Platby nejsou nastavené — chybí napojení na Stripe." };
    }
    try {
      await provider.refund(payment.provider_payment_id);
    } catch {
      return { message: "Stripe refundaci odmítl." };
    }
    await serviceClient
      .from("payments")
      .update({ status: "refunded" })
      .eq("order_id", orderId);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "refunded" })
    .eq("id", orderId);

  if (error) return { message: "Platbu se nepodařilo vrátit." };

  await logAdminAction({
    actorProfileId: admin.id,
    action: "refund",
    entityType: "order",
    entityId: orderId,
  });
  revalidatePath(`/objednavky/${orderId}`);
  return undefined;
}

export async function suspendUserAction(profileId: string): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) return { message: "Vyžaduje administrátorská práva." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ account_status: "suspended" })
    .eq("id", profileId);

  if (error) return { message: "Uživatele se nepodařilo zablokovat." };

  await logAdminAction({
    actorProfileId: admin.id,
    action: "suspend_user",
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/admin/ridici");
  return undefined;
}

export async function verifyDriverAction(
  driverProfileId: string,
  status: VerificationStatus,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) return { message: "Vyžaduje administrátorská práva." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("driver_profiles")
    .update({ verification_status: status })
    .eq("id", driverProfileId);

  if (error) return { message: "Stav ověření se nepodařilo změnit." };

  await logAdminAction({
    actorProfileId: admin.id,
    action: "verify_driver",
    entityType: "driver_profile",
    entityId: driverProfileId,
    metadata: { status },
  });
  revalidatePath("/admin/ridici");
  return undefined;
}

export async function reviewDocumentAction(
  documentId: string,
  status: VerificationStatus,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!admin) return { message: "Vyžaduje administrátorská práva." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("driver_documents")
    .update({
      verification_status: status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) return { message: "Dokument se nepodařilo zpracovat." };

  await logAdminAction({
    actorProfileId: admin.id,
    action: "review_document",
    entityType: "driver_document",
    entityId: documentId,
    metadata: { status },
  });
  revalidatePath("/admin/ridici");
  return undefined;
}
