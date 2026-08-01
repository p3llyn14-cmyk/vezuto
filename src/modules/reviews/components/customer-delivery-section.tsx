"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDictionary } from "@/i18n";
import type { Database } from "@/types/database.types";
import {
  confirmDeliveryAction,
  submitRatingAction,
  type ReviewActionState,
} from "../actions";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Rating = Database["public"]["Tables"]["ratings"]["Row"];

export function CustomerDeliverySection({
  order,
  existingRating,
}: {
  order: Order;
  existingRating: Rating | null;
}) {
  const dict = getDictionary().reviews;
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [ratingState, ratingAction, ratingPending] = useActionState<
    ReviewActionState,
    FormData
  >(submitRatingAction, undefined);

  if (order.status === "delivered") {
    return (
      <div className="space-y-2">
        <Button
          onClick={() =>
            startTransition(async () => {
              const result = await confirmDeliveryAction(order.id);
              setMessage(result?.message ?? null);
            })
          }
          disabled={isPending}
          className="w-full"
        >
          {dict.confirmDelivery}
        </Button>
        {message && <p className="text-destructive text-sm">{message}</p>}
      </div>
    );
  }

  if (order.status !== "completed" || !order.assigned_driver_profile_id) return null;

  if (existingRating) {
    return (
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{dict.yourRating}</h3>
        <p className="text-sm">
          {"★".repeat(existingRating.rating)}
          {"☆".repeat(5 - existingRating.rating)}
        </p>
        {existingRating.comment && (
          <p className="text-muted-foreground text-sm">{existingRating.comment}</p>
        )}
      </div>
    );
  }

  return (
    <form action={ratingAction} className="space-y-3">
      <input type="hidden" name="orderId" value={order.id} />
      <input
        type="hidden"
        name="reviewedProfileId"
        value={order.assigned_driver_profile_id}
      />
      <input type="hidden" name="rating" value={rating} />
      <h3 className="text-sm font-medium">{dict.rateTitle}</h3>
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} hvězdiček`}
            className={n <= rating ? "text-primary" : "text-muted-foreground/40"}
          >
            ★
          </button>
        ))}
      </div>
      <Textarea
        name="comment"
        placeholder={dict.commentPlaceholder}
        rows={2}
        maxLength={1000}
      />
      <Button type="submit" disabled={ratingPending} className="w-full">
        {dict.submit}
      </Button>
      {ratingState?.message && (
        <p className="text-destructive text-sm">{ratingState.message}</p>
      )}
    </form>
  );
}
