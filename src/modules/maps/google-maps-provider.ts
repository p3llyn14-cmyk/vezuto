import "server-only";
import type { DistanceEstimate, MapsProvider } from "./provider.interface";

interface DistanceMatrixResponse {
  status: string;
  rows: {
    elements: {
      status: string;
      distance?: { value: number };
      duration?: { value: number };
    }[];
  }[];
}

/**
 * Real Google Distance Matrix integration. Untested against a live key —
 * no Google Maps Platform account exists for this project yet — but
 * written directly against Google's documented REST response shape.
 * getMapsProvider() only constructs this when GOOGLE_MAPS_API_KEY is set;
 * otherwise MockMapsProvider is used instead.
 */
export class GoogleMapsProvider implements MapsProvider {
  constructor(private readonly apiKey: string) {}

  async distanceAndDuration(
    originAddress: string,
    destinationAddress: string,
  ): Promise<DistanceEstimate> {
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", originAddress);
    url.searchParams.set("destinations", destinationAddress);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("region", "cz");
    url.searchParams.set("key", this.apiKey);

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Google Distance Matrix API vrátilo chybu ${response.status}`);
    }

    const data = (await response.json()) as DistanceMatrixResponse;
    const element = data.rows?.[0]?.elements?.[0];

    if (
      data.status !== "OK" ||
      !element ||
      element.status !== "OK" ||
      !element.distance
    ) {
      throw new Error(`Nepodařilo se spočítat trasu (${element?.status ?? data.status})`);
    }

    return {
      distanceKm: Math.round((element.distance.value / 1000) * 10) / 10,
      durationMin: Math.round((element.duration?.value ?? 0) / 60),
    };
  }
}
