"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createCheckoutSessionAction,
  type PaymentActionState,
} from "@/modules/payments/actions";

const initialState: PaymentActionState = undefined;

export function PayButton({ orderId, label }: { orderId: string; label: string }) {
  const [state, formAction, pending] = useActionState(
    () => createCheckoutSessionAction(orderId),
    initialState,
  );

  return (
    <form action={formAction}>
      <Button type="submit" disabled={pending} className="w-full">
        {label}
      </Button>
      {state?.message && <p className="text-destructive mt-2 text-sm">{state.message}</p>}
    </form>
  );
}
