"use client";

import { MapPin } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateDriverLocationAction } from "../actions";

export function ShareLocationButton({ lastSharedAt }: { lastSharedAt: string | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleShare() {
    setMessage(null);
    if (!("geolocation" in navigator)) {
      setMessage("Tento prohlížeč neumí zjistit polohu.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          const result = await updateDriverLocationAction(
            position.coords.latitude,
            position.coords.longitude,
          );
          if (result?.message) setMessage(result.message);
        });
      },
      () => setMessage("Přístup k poloze byl odmítnut."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={isPending}
        className="gap-1.5"
      >
        <MapPin className="h-4 w-4" />
        {isPending ? "Zjišťuji polohu…" : "Sdílet polohu"}
      </Button>
      <p className="text-muted-foreground text-xs">
        {message ??
          (lastSharedAt
            ? `Naposledy sdíleno ${new Date(lastSharedAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}`
            : "Zakázky budou seřazené podle vzdálenosti, jakmile sdílíte polohu.")}
      </p>
    </div>
  );
}
