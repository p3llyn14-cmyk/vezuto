import "server-only";
import { StripePaymentProvider } from "./stripe-provider";
import type { PaymentProvider } from "./provider.interface";

export type { CheckoutSession, PaymentProvider } from "./provider.interface";

/**
 * Unlike MapsProvider, there's no mock fallback here: a "mock" that marks
 * real money as paid without a real charge would be actively misleading
 * data, not a harmless placeholder. Without a configured key, payment
 * actions show "not configured yet" instead of pretending to work — same
 * pattern as isSupabaseConfigured() in modules/auth/actions.ts.
 */
export function getPaymentProvider(): PaymentProvider | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new StripePaymentProvider(key) : null;
}
