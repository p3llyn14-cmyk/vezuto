import Stripe from "stripe";
import type { CheckoutSession, PaymentProvider } from "./provider.interface";

export class StripePaymentProvider implements PaymentProvider {
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey);
  }

  async createCheckoutSession(params: {
    orderId: string;
    amountCzk: number;
    description: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "czk",
            // CZK isn't in Stripe's zero-decimal currency list, so the API
            // expects the amount in haléře (smallest unit), same as cents.
            unit_amount: Math.round(params.amountCzk * 100),
            product_data: { name: params.description },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: params.orderId },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) {
      throw new Error("Stripe nevrátil URL platební brány.");
    }
    return { url: session.url, providerSessionId: session.id };
  }

  async refund(providerPaymentId: string): Promise<void> {
    await this.stripe.refunds.create({ payment_intent: providerPaymentId });
  }
}
