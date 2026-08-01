export interface DistanceEstimate {
  distanceKm: number;
  durationMin: number;
}

export interface MapsProvider {
  distanceAndDuration(
    originAddress: string,
    destinationAddress: string,
  ): Promise<DistanceEstimate>;
}
