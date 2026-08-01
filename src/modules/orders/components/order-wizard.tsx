"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import {
  assistanceStepSchema,
  itemStepSchema,
  pickupStepSchema,
  destinationStepSchema,
  scheduleStepSchema,
} from "../schemas";
import { emptyOrderDraft, STEP_LABELS, type OrderDraft } from "../wizard-types";
import { createOrderAction, type OrderActionState } from "../actions";
import { StepItem } from "./step-item";
import { StepLocation } from "./step-location";
import { StepSchedule } from "./step-schedule";
import { StepAssistance } from "./step-assistance";
import { StepRecap } from "./step-recap";

function zodFieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    errors[key] = [...(errors[key] ?? []), issue.message];
  }
  return errors;
}

export function OrderWizard() {
  const dict = getDictionary().orders;
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OrderDraft>(emptyOrderDraft);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitState, setSubmitState] = useState<OrderActionState>(undefined);
  const [isPending, startTransition] = useTransition();

  function patch(p: Partial<OrderDraft>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  function patchPickup(p: Partial<OrderDraft["pickup"]>) {
    setDraft((d) => ({ ...d, pickup: { ...d.pickup, ...p } }));
  }
  function patchDestination(p: Partial<OrderDraft["destination"]>) {
    setDraft((d) => ({ ...d, destination: { ...d.destination, ...p } }));
  }

  function validateStep(current: number): boolean {
    const result =
      current === 1
        ? itemStepSchema.safeParse(draft)
        : current === 2
          ? pickupStepSchema.safeParse(draft.pickup)
          : current === 3
            ? destinationStepSchema.safeParse(draft.destination)
            : current === 4
              ? scheduleStepSchema.safeParse(draft)
              : current === 5
                ? assistanceStepSchema.safeParse(draft)
                : { success: true as const, data: draft };

    if (!result.success) {
      setErrors(zodFieldErrors(result.error));
      return false;
    }
    setErrors({});
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(6, s + 1));
  }

  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("orderData", JSON.stringify(draft));
    for (const photo of photos) formData.append("photos", photo);

    startTransition(async () => {
      const result = await createOrderAction(undefined, formData);
      setSubmitState(result);
    });
  }

  return (
    <div className="space-y-8">
      <ol className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          return (
            <li
              key={label}
              className={`flex items-center gap-1.5 ${
                n === step
                  ? "text-foreground font-medium"
                  : n < step
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] tabular-nums ${
                  n <= step ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {n}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      <div>
        {step === 1 && (
          <StepItem
            draft={draft}
            onChange={patch}
            photos={photos}
            onPhotosChange={setPhotos}
            errors={errors}
          />
        )}
        {step === 2 && (
          <StepLocation
            title={dict.steps.pickupTitle}
            location={draft.pickup}
            onChange={patchPickup}
            errors={errors}
          />
        )}
        {step === 3 && (
          <StepLocation
            title={dict.steps.destinationTitle}
            location={draft.destination}
            onChange={patchDestination}
            errors={errors}
          />
        )}
        {step === 4 && <StepSchedule draft={draft} onChange={patch} errors={errors} />}
        {step === 5 && <StepAssistance draft={draft} onChange={patch} errors={errors} />}
        {step === 6 && <StepRecap draft={draft} />}
      </div>

      {submitState?.message && (
        <p className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {submitState.message}
        </p>
      )}

      <div className="flex items-center justify-between border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || isPending}
        >
          {dict.back}
        </Button>
        {step < 6 ? (
          <Button type="button" onClick={handleNext}>
            {dict.next}
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {dict.steps.recap.confirm}
          </Button>
        )}
      </div>
    </div>
  );
}
