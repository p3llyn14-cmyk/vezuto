"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { claimOrderAction } from "../actions";

export function AcceptJobButton({ orderId }: { orderId: string }) {
  const dict = getDictionary().drivers;
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await claimOrderAction(orderId);
      if (result?.message) {
        setMessage(result.message);
      } else {
        router.push(`/objednavky/${orderId}`);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleAccept} disabled={isPending} className="w-full">
        {dict.accept}
      </Button>
      {message && <p className="text-destructive text-sm">{message}</p>}
    </div>
  );
}
