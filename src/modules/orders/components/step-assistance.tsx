"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDictionary } from "@/i18n";
import type { OrderDraft } from "../wizard-types";

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  errors?: Record<string, string[]>;
}

export function StepAssistance({ draft, onChange, errors }: Props) {
  const dict = getDictionary().orders;
  const t = dict.steps.assistance;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="requestedVehicleType">{t.vehicleType}</Label>
        <Select
          value={draft.requestedVehicleType}
          onValueChange={(value) =>
            onChange({
              requestedVehicleType: value as OrderDraft["requestedVehicleType"],
            })
          }
        >
          <SelectTrigger id="requestedVehicleType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(dict.vehicleTypes).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError messages={errors?.requestedVehicleType} />
      </div>

      <div className="space-y-2">
        <Label>{t.assistanceLevel}</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(dict.assistanceLevels).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                onChange({ assistanceLevel: value as OrderDraft["assistanceLevel"] })
              }
              className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                draft.assistanceLevel === value
                  ? "border-primary bg-accent"
                  : "hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <FieldError messages={errors?.assistanceLevel} />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox
            checked={draft.disassemblyRequired}
            onCheckedChange={(checked) =>
              onChange({ disassemblyRequired: checked === true })
            }
          />
          {t.disassembly}
        </Label>
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox
            checked={draft.assemblyRequired}
            onCheckedChange={(checked) =>
              onChange({ assemblyRequired: checked === true })
            }
          />
          {t.assembly}
        </Label>
      </div>
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-destructive text-xs">{messages[0]}</p>;
}
