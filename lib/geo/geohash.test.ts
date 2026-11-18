import { describe, it, expect } from "vitest";
import {
  encodeGeohash,
  getGeohashNeighbors,
  getGeohashCellsWithNeighbors,
  precisionForRadius,
} from "./geohash";

describe("geohash utilities", () => {
  it("encodes coordinates to valid 6-char geohash", () => {
    // Lagos coordinates: 6.5244, 3.3792
    const hash = encodeGeohash(6.5244, 3.3792, 6);
    expect(hash).toHaveLength(6);
    expect(typeof hash).toBe("string");
    // Should be valid base32 characters
    expect(hash).toMatch(/^[0123456789bcdefghjkmnpqrstuvwxyz]+$/);
  });

  it("retrieves 8 distinct neighbor cells", () => {
    const hash = encodeGeohash(6.5244, 3.3792, 6);
    const neighbors = getGeohashNeighbors(hash);

    expect(neighbors.n).toBeDefined();
    expect(neighbors.s).toBeDefined();
    expect(neighbors.e).toBeDefined();
    expect(neighbors.w).toBeDefined();
    expect(neighbors.ne).toBeDefined();
    expect(neighbors.nw).toBeDefined();
    expect(neighbors.se).toBeDefined();
    expect(neighbors.sw).toBeDefined();

    const cellsWithNeighbors = getGeohashCellsWithNeighbors(6.5244, 3.3792, 6);
    expect(cellsWithNeighbors).toHaveLength(9);
    expect(cellsWithNeighbors[0]).toBe(hash);
  });

  it("selects appropriate precision for radius in km", () => {
    expect(precisionForRadius(2)).toBe(6);
    expect(precisionForRadius(10)).toBe(5);
    expect(precisionForRadius(30)).toBe(4);
    expect(precisionForRadius(100)).toBe(3);
  });
});
