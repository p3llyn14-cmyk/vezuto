"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDictionary } from "@/i18n";
import type { Database } from "@/types/database.types";
import {
  advanceOrderStatusAction,
  cancelOrderAsDriverAction,
  uploadOrderPhotoAction,
  type DriverActionState,
} from "../actions";
import { isCancellableByDriver } from "../status-transitions";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type ImageType = Database["public"]["Enums"]["image_type"];
// Driver-uploadable subset — "item_reference" is the customer's own photo
// from order creation, not something a driver adds.
const IMAGE_TYPES = [
  "pickup_condition",
  "damage",
  "delivery_condition",
  "proof_of_delivery",
] as const satisfies readonly ImageType[];
type DriverImageType = (typeof IMAGE_TYPES)[number];

export function DriverOrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const dict = getDictionary().drivers;
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadState, uploadAction, uploadPending] = useActionState<
    DriverActionState,
    FormData
  >(uploadOrderPhotoAction, undefined);
  const [imageType, setImageType] = useState<DriverImageType>("pickup_condition");

  const advanceLabel = dict.advanceStatus[status as keyof typeof dict.advanceStatus];

  function handleAdvance() {
    startTransition(async () => {
      const result = await advanceOrderStatusAction(orderId);
      setMessage(result?.message ?? null);
    });
  }

  function handleCancel() {
    if (!confirm(dict.cancelConfirm)) return;
    startTransition(async () => {
      const result = await cancelOrderAsDriverAction(orderId);
      setMessage(result?.message ?? null);
    });
  }

  return (
    <div className="space-y-4">
      {advanceLabel && (
        <Button onClick={handleAdvance} disabled={isPending} className="w-full">
          {advanceLabel}
        </Button>
      )}
      {isCancellableByDriver(status) && (
        <Button
          onClick={handleCancel}
          disabled={isPending}
          variant="outline"
          className="w-full"
        >
          {dict.cancel}
        </Button>
      )}
      {message && <p className="text-destructive text-sm">{message}</p>}

      <div className="space-y-2 border-t pt-4">
        <h3 className="text-sm font-medium">{dict.photoUpload.title}</h3>
        <form action={uploadAction} className="flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="imageType" value={imageType} />
          <Select
            value={imageType}
            onValueChange={(v) => setImageType(v as DriverImageType)}
          >
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {dict.photoUpload.types[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp,image/heic"
            required
            className="text-sm"
          />
          <Button type="submit" size="sm" disabled={uploadPending}>
            {dict.photoUpload.upload}
          </Button>
        </form>
        {uploadState?.message && (
          <p className="text-destructive text-xs">{uploadState.message}</p>
        )}
      </div>
    </div>
  );
}
