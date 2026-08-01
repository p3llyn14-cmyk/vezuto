export interface CheckoutSession {
  url: string;
  providerSessionId: string;
}

export interface PaymentProvider {
  createCheckoutSession(params: {
    orderId: string;
    amountCzk: number;
    description: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;

  refund(providerPaymentId: string): Promise<void>;
}
