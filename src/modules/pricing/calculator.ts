import type { AssistanceLevel, VehicleType } from "@/types/database.types";
import { PRICING_CONFIG } from "./config";

export interface PriceInput {
  distanceKm: number;
  durationMin: number;
  vehicleType: VehicleType;
  assistanceLevel: AssistanceLevel;
  /** Floor number at each location that lacks an elevator (0 = no charge). */
  floorsWithoutElevator: number[];
  isExpress: boolean;
}

export interface PriceBreakdown {
  baseCzk: number;
  distanceKm: number;
  distanceFeeCzk: number;
  durationMin: number;
  durationFeeCzk: number;
  vehicleSurchargeCzk: number;
  assistanceSurchargeCzk: number;
  floorSurchargeCzk: number;
  expressSurchargeCzk: number;
  subtotalCzk: number;
  minimumApplied: boolean;
  customerPriceCzk: number;
  platformFeeCzk: number;
  driverPayoutCzk: number;
}

/**
 * Pure and deterministic on purpose — same input always gives the same
 * output, no DB/network access, so it can be unit tested directly (Fáze 9)
 * and re-run server-side at order submission without trusting a
 * client-supplied price.
 */
export function calculatePrice(input: PriceInput): PriceBreakdown {
  const cfg = PRICING_CONFIG;

  const distanceFeeCzk = round2(input.distanceKm * cfg.perKmCzk);
  const durationFeeCzk = round2(input.durationMin * cfg.perMinCzk);
  const vehicleSurchargeCzk = cfg.vehicleSurchargeCzk[input.vehicleType];
  const assistanceSurchargeCzk = cfg.assistanceSurchargeCzk[input.assistanceLevel];
  const floorSurchargeCzk = input.floorsWithoutElevator.reduce(
    (sum, floor) => sum + Math.max(0, floor) * cfg.floorNoElevatorPerFloorCzk,
    0,
  );
  const expressSurchargeCzk = input.isExpress ? cfg.expressSurchargeCzk : 0;

  const subtotalCzk = round2(
    cfg.baseCzk +
      distanceFeeCzk +
      durationFeeCzk +
      vehicleSurchargeCzk +
      assistanceSurchargeCzk +
      floorSurchargeCzk +
      expressSurchargeCzk,
  );

  const minimumApplied = subtotalCzk < cfg.minimumPriceCzk;
  const customerPriceCzk = minimumApplied ? cfg.minimumPriceCzk : subtotalCzk;
  const platformFeeCzk = round2(customerPriceCzk * (cfg.platformFeePct / 100));
  const driverPayoutCzk = round2(customerPriceCzk - platformFeeCzk);

  return {
    baseCzk: cfg.baseCzk,
    distanceKm: input.distanceKm,
    distanceFeeCzk,
    durationMin: input.durationMin,
    durationFeeCzk,
    vehicleSurchargeCzk,
    assistanceSurchargeCzk,
    floorSurchargeCzk,
    expressSurchargeCzk,
    subtotalCzk,
    minimumApplied,
    customerPriceCzk,
    platformFeeCzk,
    driverPayoutCzk,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
