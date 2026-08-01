import "server-only";
import { GoogleMapsProvider } from "./google-maps-provider";
import { MockMapsProvider } from "./mock-provider";
import type { MapsProvider } from "./provider.interface";

export type { DistanceEstimate, MapsProvider } from "./provider.interface";

export function getMapsProvider(): MapsProvider {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  return apiKey ? new GoogleMapsProvider(apiKey) : new MockMapsProvider();
}
