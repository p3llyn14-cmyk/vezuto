"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  assignDriverAction,
  changeOrderStatusAction,
  changePriceAction,
  refundOrderAction,
} from "../actions";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export function AdminOrderActions({
  orderId,
  currentPriceCzk,
}: {
  orderId: string;
  currentPriceCzk: number | null;
}) {
  const dict = getDictionary();
  const t = dict.admin.actions;
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState<OrderStatus>("driver_assigned");
  const [price, setPrice] = useState(currentPriceCzk?.toString() ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ message?: string } | undefined>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result?.message ?? null);
    });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-sm font-medium">{t.title}</h3>

      <div className="space-y-1">
        <Label className="text-xs">{t.assignDriver}</Label>
        <div className="flex gap-2">
          <Input
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            placeholder={t.assignDriverPlaceholder}
          />
          <Button
            size="sm"
            disabled={isPending || !driverId}
            onClick={() => run(() => assignDriverAction(orderId, driverId))}
          >
            {t.assign}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t.changeStatus}</Label>
        <div className="flex gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.orders.statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => changeOrderStatusAction(orderId, status))}
          >
            {t.change}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t.changePrice}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Button
            size="sm"
            disabled={isPending || !price}
            onClick={() => run(() => changePriceAction(orderId, Number(price)))}
          >
            {t.change}
          </Button>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          if (confirm(t.refundConfirm)) run(() => refundOrderAction(orderId));
        }}
      >
        {t.refund}
      </Button>

      {message && <p className="text-destructive text-xs">{message}</p>}
    </div>
  );
}
