import { describe, it, expect } from "vitest";
import { haversineDistance, formatDistance } from "./haversine";

describe("haversineDistance", () => {
  it("calculates accurate distance between Lagos Island and Ikeja (~18.2 km)", () => {
    // Lagos Island: ~6.4549, 3.4246
    // Ikeja: ~6.6018, 3.3515
    const distance = haversineDistance(6.4549, 3.4246, 6.6018, 3.3515);
    expect(distance).toBeGreaterThan(15);
    expect(distance).toBeLessThan(20);
  });

  it("returns 0 for identical coordinates", () => {
    const distance = haversineDistance(6.5244, 3.3792, 6.5244, 3.3792);
    expect(distance).toBe(0);
  });

  it("formats distance safely without exposing exact coordinates", () => {
    expect(formatDistance(0.2)).toBe("Nearby (< 500 m)");
    expect(formatDistance(0.85)).toBe("850 m away");
    expect(formatDistance(2.43)).toBe("2.4 km away");
    expect(formatDistance(12.78)).toBe("12.8 km away");
  });
});
