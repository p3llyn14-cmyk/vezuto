import type { Coordinates, DistanceEstimate, MapsProvider } from "./provider.interface";

// Prague's approximate center — mock coordinates jitter around this, they
// are never claimed to be a real geocode of the input address.
const PRAGUE_CENTER: Coordinates = { lat: 50.0755, lng: 14.4378 };

/**
 * Flat, Prague-sized placeholder used until GOOGLE_MAPS_API_KEY is set.
 * Deliberately not trying to look real — pricing built on top of it is
 * clearly an estimate, not a claim of computed accuracy.
 */
export class MockMapsProvider implements MapsProvider {
  async distanceAndDuration(): Promise<DistanceEstimate> {
    return { distanceKm: 8, durationMin: 25 };
  }

  async geocode(address: string): Promise<Coordinates | null> {
    // Deterministic (same address always lands in the same spot, so
    // distance sorting stays stable across requests) but explicitly not a
    // real geocode — just a small hash-derived jitter within ~5km of
    // central Prague.
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = (hash * 31 + address.charCodeAt(i)) % 100000;
    }
    const jitterLat = ((hash % 200) - 100) / 2000;
    const jitterLng = (((hash / 200) % 200) - 100) / 1500;
    return { lat: PRAGUE_CENTER.lat + jitterLat, lng: PRAGUE_CENTER.lng + jitterLng };
  }
}
