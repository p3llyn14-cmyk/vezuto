"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getDictionary } from "@/i18n";
import type { OrderDraft } from "../wizard-types";

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  errors?: Record<string, string[]>;
}

export function StepSchedule({ draft, onChange, errors }: Props) {
  const dict = getDictionary().orders;
  const t = dict.steps.schedule;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t.timing}</Label>
        <RadioGroup
          value={draft.timing}
          onValueChange={(value) => onChange({ timing: value as OrderDraft["timing"] })}
          className="space-y-2"
        >
          {Object.entries(dict.timingOptions).map(([value, label]) => (
            <Label
              key={value}
              htmlFor={`timing-${value}`}
              className="has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent flex cursor-pointer items-center gap-2 rounded-lg border p-3 font-normal"
            >
              <RadioGroupItem value={value} id={`timing-${value}`} />
              {label}
            </Label>
          ))}
        </RadioGroup>
      </div>

      {draft.timing === "specific_date" && (
        <div className="space-y-2">
          <Label htmlFor="requestedDate">{t.date}</Label>
          <Input
            id="requestedDate"
            type="date"
            value={draft.requestedDate}
            onChange={(e) => onChange({ requestedDate: e.target.value })}
            className="max-w-48"
          />
          <FieldError messages={errors?.requestedDate} />
        </div>
      )}

      {draft.timing !== "asap" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="requestedTimeFrom">{t.timeFrom}</Label>
            <Input
              id="requestedTimeFrom"
              type="time"
              value={draft.requestedTimeFrom}
              onChange={(e) => onChange({ requestedTimeFrom: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requestedTimeTo">{t.timeTo}</Label>
            <Input
              id="requestedTimeTo"
              type="time"
              value={draft.requestedTimeTo}
              onChange={(e) => onChange({ requestedTimeTo: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-destructive text-xs">{messages[0]}</p>;
}
