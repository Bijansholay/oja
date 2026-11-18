/**
 * Base32 character set used in standard Geohashing (excludes a, i, l, o to avoid confusion)
 */
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Neighbor mapping tables for standard Geohash calculation
 */
const NEIGHBORS: Record<string, { top: string; bottom: string; right: string; left: string }> = {
  even: {
    top: "238967debc0145fhjkmnpqrstuvwxyz",
    bottom: "14365h7k9dcfeswzxvutyqpr8b02",
    right: "bc01fg45238967deuvhjyznpkmstqrwx",
    left: "238967debc0145fhuwzxvutyqpr8b02",
  },
  odd: {
    top: "bc01fg45238967deuvhjyznpkmstqrwx",
    bottom: "238967debc0145fhjkmnpqrstuvwxyz",
    right: "238967debc0145fhjkmnpqrstuvwxyz",
    left: "14365h7k9dcfeswzxvutyqpr8b02",
  },
};

const BORDERS: Record<string, { top: string; bottom: string; right: string; left: string }> = {
  even: {
    top: "prxz",
    bottom: "028b",
    right: "bcfguvyz",
    left: "0145hjnp",
  },
  odd: {
    top: "bcfguvyz",
    bottom: "0145hjnp",
    right: "prxz",
    left: "028b",
  },
};

/**
 * Encodes latitude and longitude into a geohash string.
 * Precision 6 gives approximately ~1.2 km x 0.6 km cells.
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 6): string {
  let isEven = true;
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  let geohash = "";
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        ch |= 1 << (4 - bit);
        lngMin = mid;
      } else {
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Calculates the adjacent neighbor cell in a given cardinal direction.
 */
export function getAdjacent(hash: string, direction: "top" | "bottom" | "right" | "left"): string {
  if (!hash) return "";
  const lowerHash = hash.toLowerCase();
  const lastCh = lowerHash.charAt(lowerHash.length - 1);
  const type = lowerHash.length % 2 === 0 ? "even" : "odd";
  let parent = lowerHash.substring(0, lowerHash.length - 1);

  if (BORDERS[type][direction].indexOf(lastCh) !== -1 && parent.length > 0) {
    parent = getAdjacent(parent, direction);
  }

  const neighborIdx = NEIGHBORS[type][direction].indexOf(lastCh);
  if (neighborIdx === -1) {
    return lowerHash;
  }
  return parent + BASE32[neighborIdx];
}

/**
 * Returns the 8 adjacent neighbor geohash strings for a given cell.
 */
export function getGeohashNeighbors(hash: string): {
  n: string;
  ne: string;
  e: string;
  se: string;
  s: string;
  sw: string;
  w: string;
  nw: string;
} {
  const n = getAdjacent(hash, "top");
  const s = getAdjacent(hash, "bottom");
  const e = getAdjacent(hash, "right");
  const w = getAdjacent(hash, "left");

  const ne = getAdjacent(n, "right");
  const nw = getAdjacent(n, "left");
  const se = getAdjacent(s, "right");
  const sw = getAdjacent(s, "left");

  return { n, ne, e, se, s, sw, w, nw };
}

/**
 * Returns the target cell plus all 8 surrounding neighbor cells.
 * Useful for Appwrite queries where items might be in adjacent bounding boxes.
 */
export function getGeohashCellsWithNeighbors(lat: number, lng: number, precision: number = 6): string[] {
  const center = encodeGeohash(lat, lng, precision);
  const neighbors = getGeohashNeighbors(center);
  return [
    center,
    neighbors.n,
    neighbors.ne,
    neighbors.e,
    neighbors.se,
    neighbors.s,
    neighbors.sw,
    neighbors.w,
    neighbors.nw,
  ];
}

/**
 * Determines appropriate geohash precision based on requested radius in km.
 * Precision 6: ~1.2 km
 * Precision 5: ~4.9 km
 * Precision 4: ~39 km
 * Precision 3: ~156 km
 */
export function precisionForRadius(radiusKm: number): number {
  if (radiusKm <= 3) return 6;
  if (radiusKm <= 15) return 5;
  if (radiusKm <= 60) return 4;
  return 3;
}
