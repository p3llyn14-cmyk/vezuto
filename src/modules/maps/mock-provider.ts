import type { DistanceEstimate, MapsProvider } from "./provider.interface";

/**
 * Flat, Prague-sized placeholder used until GOOGLE_MAPS_API_KEY is set.
 * Deliberately not trying to look real — pricing built on top of it is
 * clearly an estimate, not a claim of computed accuracy.
 */
export class MockMapsProvider implements MapsProvider {
  async distanceAndDuration(): Promise<DistanceEstimate> {
    return { distanceKm: 8, durationMin: 25 };
  }
}
