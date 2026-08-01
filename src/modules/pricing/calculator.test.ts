import { describe, expect, it } from "vitest";
import { calculatePrice } from "./calculator";
import { PRICING_CONFIG } from "./config";

describe("calculatePrice", () => {
  it("applies the minimum order price when the raw subtotal is too low", () => {
    const result = calculatePrice({
      distanceKm: 1,
      durationMin: 5,
      vehicleType: "personal_car",
      assistanceLevel: "driver_only",
      floorsWithoutElevator: [0, 0],
      isExpress: false,
    });

    expect(result.minimumApplied).toBe(true);
    expect(result.customerPriceCzk).toBe(PRICING_CONFIG.minimumPriceCzk);
  });

  it("does not apply the minimum once the subtotal exceeds it", () => {
    const result = calculatePrice({
      distanceKm: 8,
      durationMin: 25,
      vehicleType: "estate_car",
      assistanceLevel: "driver_plus_one",
      floorsWithoutElevator: [0, 0],
      isExpress: false,
    });

    expect(result.minimumApplied).toBe(false);
    expect(result.customerPriceCzk).toBeGreaterThan(PRICING_CONFIG.minimumPriceCzk);
  });

  it("charges per floor lacking an elevator, summed across both locations", () => {
    const withFloors = calculatePrice({
      distanceKm: 5,
      durationMin: 15,
      vehicleType: "small_van",
      assistanceLevel: "driver_helps",
      floorsWithoutElevator: [3, 2],
      isExpress: false,
    });
    const withoutFloors = calculatePrice({
      distanceKm: 5,
      durationMin: 15,
      vehicleType: "small_van",
      assistanceLevel: "driver_helps",
      floorsWithoutElevator: [0, 0],
      isExpress: false,
    });

    expect(withFloors.floorSurchargeCzk).toBe(
      5 * PRICING_CONFIG.floorNoElevatorPerFloorCzk,
    );
    expect(withFloors.customerPriceCzk - withoutFloors.customerPriceCzk).toBe(
      withFloors.floorSurchargeCzk,
    );
  });

  it("adds the express surcharge only when requested", () => {
    const express = calculatePrice({
      distanceKm: 5,
      durationMin: 15,
      vehicleType: "personal_car",
      assistanceLevel: "driver_only",
      floorsWithoutElevator: [0, 0],
      isExpress: true,
    });
    const normal = calculatePrice({
      distanceKm: 5,
      durationMin: 15,
      vehicleType: "personal_car",
      assistanceLevel: "driver_only",
      floorsWithoutElevator: [0, 0],
      isExpress: false,
    });

    expect(express.expressSurchargeCzk).toBe(PRICING_CONFIG.expressSurchargeCzk);
    expect(normal.expressSurchargeCzk).toBe(0);
  });

  it("keeps driver payout + platform fee exactly equal to the customer price", () => {
    const cases = [
      { distanceKm: 1, durationMin: 5, vehicleType: "personal_car" as const },
      { distanceKm: 8, durationMin: 25, vehicleType: "estate_car" as const },
      { distanceKm: 20, durationMin: 45, vehicleType: "large_van" as const },
    ];

    for (const c of cases) {
      const result = calculatePrice({
        ...c,
        assistanceLevel: "driver_plus_two",
        floorsWithoutElevator: [4, 1],
        isExpress: true,
      });
      expect(result.driverPayoutCzk + result.platformFeeCzk).toBeCloseTo(
        result.customerPriceCzk,
        2,
      );
    }
  });

  it("is deterministic — identical input always produces identical output", () => {
    const input = {
      distanceKm: 12.4,
      durationMin: 33,
      vehicleType: "small_van" as const,
      assistanceLevel: "driver_plus_one" as const,
      floorsWithoutElevator: [2, 0],
      isExpress: false,
    };

    expect(calculatePrice(input)).toEqual(calculatePrice(input));
  });

  it("applies a larger surcharge for a larger vehicle", () => {
    const car = calculatePrice({
      distanceKm: 8,
      durationMin: 25,
      vehicleType: "personal_car",
      assistanceLevel: "driver_only",
      floorsWithoutElevator: [0, 0],
      isExpress: false,
    });
    const van = calculatePrice({
      distanceKm: 8,
      durationMin: 25,
      vehicleType: "large_van",
      assistanceLevel: "driver_only",
      floorsWithoutElevator: [0, 0],
      isExpress: false,
    });

    expect(van.customerPriceCzk).toBeGreaterThan(car.customerPriceCzk);
  });
});
