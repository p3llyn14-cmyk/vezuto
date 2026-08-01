"use client";

import { useEffect, useState } from "react";
import { getDictionary } from "@/i18n";
import { formatCzk } from "@/lib/format";
import { estimatePriceAction } from "../actions";
import type { PriceBreakdown } from "@/modules/pricing/calculator";
import type { OrderDraft } from "../wizard-types";

type EstimateResult =
  | { key: string; breakdown: PriceBreakdown; error?: undefined }
  | { key: string; breakdown?: undefined; error: string };

// draft is raw client wizard state (strings from inputs, possibly "" for
// not-yet-chosen selects) — estimatePriceAction takes `unknown` and runs
// the real Zod schema server-side, so there's no fake type safety to keep
// in sync here.
export function StepRecap({ draft }: { draft: OrderDraft }) {
  const t = getDictionary().orders.steps.recap;
  const draftKey = JSON.stringify(draft);
  const [result, setResult] = useState<EstimateResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    estimatePriceAction(draft).then((estimate) => {
      if (cancelled) return;
      setResult(
        "error" in estimate
          ? { key: draftKey, error: estimate.error }
          : { key: draftKey, breakdown: estimate },
      );
    });

    return () => {
      cancelled = true;
    };
    // draftKey is the real dependency (derived from draft); draft itself is
    // a fresh object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Ignore a stale result left over from the previous draft while the new
  // estimate is still in flight, instead of resetting state synchronously
  // in the effect above.
  const current = result?.key === draftKey ? result : null;
  const breakdown = current?.breakdown ?? null;
  const error = current?.error ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium">{t.route}</h3>
        <p className="text-muted-foreground text-sm">
          {draft.pickup.fullAddress} → {draft.destination.fullAddress}
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!error && !breakdown && (
        <p className="text-muted-foreground text-sm">{t.estimating}</p>
      )}

      {breakdown && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t.priceBreakdown}</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label={t.base} value={breakdown.baseCzk} />
            <Row
              label={`${t.distanceFee} (${breakdown.distanceKm} km)`}
              value={breakdown.distanceFeeCzk}
            />
            <Row
              label={`${t.durationFee} (${breakdown.durationMin} min)`}
              value={breakdown.durationFeeCzk}
            />
            {breakdown.vehicleSurchargeCzk > 0 && (
              <Row label={t.vehicleSurcharge} value={breakdown.vehicleSurchargeCzk} />
            )}
            {breakdown.assistanceSurchargeCzk > 0 && (
              <Row
                label={t.assistanceSurcharge}
                value={breakdown.assistanceSurchargeCzk}
              />
            )}
            {breakdown.floorSurchargeCzk > 0 && (
              <Row label={t.floorSurcharge} value={breakdown.floorSurchargeCzk} />
            )}
            {breakdown.expressSurchargeCzk > 0 && (
              <Row label={t.expressSurcharge} value={breakdown.expressSurchargeCzk} />
            )}
          </dl>
          {breakdown.minimumApplied && (
            <p className="text-muted-foreground text-xs">{t.minimumNote}</p>
          )}
          <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
            <span>{t.total}</span>
            <span className="font-mono tabular-nums">
              {formatCzk(breakdown.customerPriceCzk)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-muted-foreground flex justify-between">
      <dt>{label}</dt>
      <dd className="font-mono tabular-nums">{formatCzk(value)}</dd>
    </div>
  );
}
