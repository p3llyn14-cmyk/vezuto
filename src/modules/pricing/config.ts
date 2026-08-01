import type { AssistanceLevel, VehicleType } from "@/types/database.types";

/**
 * Starter values per spec section 13 — deliberately easy to find and change
 * in one place. Not yet backed by a DB table (MVP scope); move there if/when
 * admins need to tune pricing without a deploy.
 */
export const PRICING_CONFIG = {
  baseCzk: 299,
  perKmCzk: 18,
  perMinCzk: 3,
  minimumPriceCzk: 499,
  expressSurchargeCzk: 199,
  floorNoElevatorPerFloorCzk: 80,
  platformFeePct: 20,
  vehicleSurchargeCzk: {
    personal_car: 0,
    estate_car: 0,
    small_van: 100,
    large_van: 250,
  } satisfies Record<VehicleType, number>,
  // "driver_helps" (driver personally carries, no extra person) sits between
  // driver_only and an actual extra helper — it's real added effort/time but
  // not a second person's wage.
  assistanceSurchargeCzk: {
    driver_only: 0,
    driver_helps: 150,
    driver_plus_one: 350,
    driver_plus_two: 700,
  } satisfies Record<AssistanceLevel, number>,
} as const;
