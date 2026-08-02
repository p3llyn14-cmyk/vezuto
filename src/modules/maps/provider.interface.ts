export interface DistanceEstimate {
  distanceKm: number;
  durationMin: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapsProvider {
  distanceAndDuration(
    originAddress: string,
    destinationAddress: string,
  ): Promise<DistanceEstimate>;

  /** Returns null rather than throwing when an address can't be located. */
  geocode(address: string): Promise<Coordinates | null>;
}
