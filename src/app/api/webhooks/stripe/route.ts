import "server-only";
import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Route Handlers give the raw, unparsed request body (req.text()) — unlike
 * the old Pages API, App Router never needs `bodyParser: false` to keep the
 * bytes intact for Stripe's signature check.
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    if (orderId) {
      const supabase = createServiceClient();
      await supabase
        .from("payments")
        .update({
          status: "paid",
          // Swap the checkout session id for the payment intent id — refunds
          // are issued against the payment intent, not the session.
          provider_payment_id: paymentIntentId ?? session.id,
        })
        .eq("order_id", orderId)
        .eq("provider", "stripe");

      await supabase.from("orders").update({ payment_status: "paid" }).eq("id", orderId);
    }
  }

  return NextResponse.json({ received: true });
}
