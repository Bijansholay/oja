import {
  encodeGeohash,
  getGeohashCellsWithNeighbors,
  precisionForRadius,
} from "./geohash";
import { haversineDistance, formatDistance } from "./haversine";

export * from "./geohash";
export * from "./haversine";

export interface GeoLocation {
  lat: number;
  lng: number;
  geohash?: string;
  areaName?: string;
}

export interface NearbyQueryOptions {
  userLat: number;
  userLng: number;
  radiusKm?: number;
  minResults?: number;
}

export interface NearbyCandidate {
  $id: string;
  lat: number;
  lng: number;
  geohash: string;
  [key: string]: any;
}

export interface NearbyResult<T extends NearbyCandidate> {
  item: T;
  distanceKm: number;
  distanceFormatted: string;
}

/**
 * Filter and sort a candidate collection by distance from user.
 * Discards items exceeding maxRadiusKm and sorts closest first.
 */
export function filterAndSortNearby<T extends NearbyCandidate>(
  candidates: T[],
  userLat: number,
  userLng: number,
  maxRadiusKm?: number
): NearbyResult<T>[] {
  const results: NearbyResult<T>[] = [];

  for (const item of candidates) {
    if (typeof item.lat !== "number" || typeof item.lng !== "number") continue;
    const distanceKm = haversineDistance(userLat, userLng, item.lat, item.lng);

    if (maxRadiusKm && distanceKm > maxRadiusKm) {
      continue;
    }

    results.push({
      item,
      distanceKm,
      distanceFormatted: formatDistance(distanceKm),
    });
  }

  // Sort ascending by exact distance
  results.sort((a, b) => a.distanceKm - b.distanceKm);

  return results;
}

/**
 * Spatial query strategy interface allowing swapping between geohash-based prefix
 * queries and native spatial indexing if available in Appwrite or Postgres.
 */
export interface SpatialQueryStrategy {
  getSearchCells(lat: number, lng: number, radiusKm: number): string[];
}

export class GeohashSpatialStrategy implements SpatialQueryStrategy {
  getSearchCells(lat: number, lng: number, radiusKm: number): string[] {
    const precision = precisionForRadius(radiusKm);
    return getGeohashCellsWithNeighbors(lat, lng, precision);
  }
}

export const defaultSpatialStrategy = new GeohashSpatialStrategy();
