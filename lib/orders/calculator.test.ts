import { describe, it, expect } from "vitest";
import {
  splitCartBySeller,
  computeCartGrandTotal,
  validateFirstTimePodLimit,
} from "./calculator";
import { CartItem } from "@/lib/types";

describe("splitCartBySeller", () => {
  const sampleItems: CartItem[] = [
    {
      listingId: "listing_1",
      sellerId: "farmer_ade",
      sellerName: "Ade Farm Fresh",
      title: "Fresh Epe Tomatoes (Basket)",
      unitPrice: 7500,
      unit: "crate",
      qty: 2,
      maxAvailable: 10,
    },
    {
      listingId: "listing_2",
      sellerId: "farmer_ade",
      sellerName: "Ade Farm Fresh",
      title: "Rodo Habanero Peppers",
      unitPrice: 2000,
      unit: "bag",
      qty: 1,
      maxAvailable: 5,
    },
    {
      listingId: "listing_3",
      sellerId: "farmer_bello",
      sellerName: "Bello Organic Yams",
      title: "Abakaliki Yams (5 Tubers)",
      unitPrice: 9000,
      unit: "piece",
      qty: 1,
      maxAvailable: 8,
    },
  ];

  it("splits a multi-seller cart into exact per-farmer orders", () => {
    const split = splitCartBySeller(sampleItems);
    expect(split).toHaveLength(2);

    const adeOrder = split.find((s) => s.sellerId === "farmer_ade");
    expect(adeOrder).toBeDefined();
    expect(adeOrder?.items).toHaveLength(2);
    // (7500 * 2) + (2000 * 1) = 17000
    expect(adeOrder?.orderTotal).toBe(17000);

    const belloOrder = split.find((s) => s.sellerId === "farmer_bello");
    expect(belloOrder).toBeDefined();
    expect(belloOrder?.items).toHaveLength(1);
    expect(belloOrder?.orderTotal).toBe(9000);
  });

  it("calculates accurate grand total across all split orders", () => {
    const split = splitCartBySeller(sampleItems);
    const grandTotal = computeCartGrandTotal(split);
    // 17000 + 9000 = 26000
    expect(grandTotal).toBe(26000);
  });

  it("enforces first-time pay-on-delivery order caps", () => {
    // 25,000 is under 30,000 cap
    expect(validateFirstTimePodLimit(25000, 30000).allowed).toBe(true);
    // 35,000 exceeds 30,000 cap
    const check = validateFirstTimePodLimit(35000, 30000);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("capped at ₦30,000");
  });
});
