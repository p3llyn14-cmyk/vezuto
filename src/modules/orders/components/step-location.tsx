"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDictionary } from "@/i18n";
import type { LocationDraft } from "../wizard-types";

interface Props {
  title: string;
  location: LocationDraft;
  onChange: (patch: Partial<LocationDraft>) => void;
  errors?: Record<string, string[]>;
}

export function StepLocation({ title, location, onChange, errors }: Props) {
  const t = getDictionary().orders.steps.location;

  return (
    <div className="space-y-5">
      <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>

      <div className="space-y-2">
        <Label htmlFor="fullAddress">{t.fullAddress}</Label>
        <Input
          id="fullAddress"
          value={location.fullAddress}
          onChange={(e) => onChange({ fullAddress: e.target.value })}
          placeholder="Ulice a číslo, Praha"
        />
        <FieldError messages={errors?.fullAddress} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="floor">{t.floor}</Label>
          <Input
            id="floor"
            type="number"
            min={0}
            max={50}
            value={location.floor}
            onChange={(e) => onChange({ floor: e.target.value })}
          />
        </div>
        <div className="flex items-end pb-2.5">
          <Label className="flex items-center gap-2 font-normal">
            <Checkbox
              checked={location.hasElevator}
              onCheckedChange={(checked) => onChange({ hasElevator: checked === true })}
            />
            {t.hasElevator}
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parkingNotes">{t.parkingNotes}</Label>
        <Input
          id="parkingNotes"
          value={location.parkingNotes}
          onChange={(e) => onChange({ parkingNotes: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="contactName">{t.contactName}</Label>
          <Input
            id="contactName"
            value={location.contactName}
            onChange={(e) => onChange({ contactName: e.target.value })}
          />
          <FieldError messages={errors?.contactName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">{t.contactPhone}</Label>
          <Input
            id="contactPhone"
            type="tel"
            value={location.contactPhone}
            onChange={(e) => onChange({ contactPhone: e.target.value })}
            placeholder="+420 600 000 000"
          />
          <FieldError messages={errors?.contactPhone} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t.notes}</Label>
        <Input
          id="notes"
          value={location.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-destructive text-xs">{messages[0]}</p>;
}
