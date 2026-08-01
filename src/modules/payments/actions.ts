"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/modules/auth/queries";
import { getPaymentProvider } from "./index";

export type PaymentActionState = { message?: string } | undefined;

const NOT_CONFIGURED_MESSAGE =
  "Platby zatím nejsou nastavené — chybí napojení na Stripe. Zkuste to prosím později.";

/**
 * Creates a Stripe Checkout session for the order's current price and
 * redirects the customer to it. The payments row is written via the
 * service role because payments has no client-reachable INSERT policy
 * (see rls migration) — the customer's own session can only ever SELECT it.
 */
export async function createCheckoutSessionAction(
  orderId: string,
): Promise<PaymentActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { message: "Vyžaduje přihlášení." };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, item_title, customer_profile_id, customer_price_czk, payment_status")
    .eq("id", orderId)
    .single();

  if (!order || order.customer_profile_id !== profile.id) {
    return { message: "Objednávka nebyla nalezena." };
  }
  if (!order.customer_price_czk) {
    return { message: "Objednávka zatím nemá stanovenou cenu." };
  }
  if (order.payment_status === "paid") {
    return { message: "Objednávka už je zaplacená." };
  }

  const provider = getPaymentProvider();
  if (!provider) return { message: NOT_CONFIGURED_MESSAGE };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await provider.createCheckoutSession({
    orderId: order.id,
    amountCzk: order.customer_price_czk,
    description: order.item_title,
    successUrl: `${baseUrl}/objednavky/${order.id}?platba=uspech`,
    cancelUrl: `${baseUrl}/objednavky/${order.id}?platba=zruseno`,
  });

  const serviceClient = createServiceClient();
  await serviceClient.from("payments").insert({
    order_id: order.id,
    provider: "stripe",
    provider_payment_id: session.providerSessionId,
    amount_czk: order.customer_price_czk,
    status: "pending",
  });

  redirect(session.url);
}
