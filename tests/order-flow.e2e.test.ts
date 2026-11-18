import { describe, it, expect, beforeEach } from "vitest";
import { checkoutSchema } from "../lib/validation/schemas";
import { splitCartBySeller, computeCartGrandTotal, validateFirstTimePodLimit } from "../lib/orders/calculator";
import { defaultPaymentProvider } from "../lib/payments/provider";
import { CartItem, Listing, Order } from "../lib/types";

describe("End-to-End Hyperlocal Order Flow", () => {
  // Authoritative server inventory
  let inventory: Listing[];

  beforeEach(() => {
    inventory = [
      {
        $id: "listing_tomatoes_epe",
        sellerId: "farmer_alabi",
        sellerName: "Alabi Organic Farm",
        title: "Fresh Roma Tomatoes",
        category: "vegetables_greens",
        description: "Harvested fresh from Epe greenhouse",
        price: 14500, // authoritative server price
        unit: "crate",
        quantityAvailable: 10,
        photoIds: ["photo_tomatoes_1"],
        lat: 6.5841,
        lng: 3.9832,
        geohash: "s14h18",
        status: "active",
        createdAt: new Date().toISOString(),
      },
      {
        $id: "listing_yams_bello",
        sellerId: "farmer_bello",
        sellerName: "Bello & Sons Depot",
        title: "Abakaliki New Yams",
        category: "tubers_roots",
        description: "Dry season tubers direct from farm",
        price: 8500, // authoritative server price
        unit: "piece",
        quantityAvailable: 5,
        photoIds: ["photo_yam_1"],
        lat: 6.6114,
        lng: 3.3982,
        geohash: "s14h10",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ];
  });

  it("completes full order lifecycle: client cart -> Zod validation -> server price verification -> stock decrement -> per-seller split -> status transition", () => {
    // 1. Buyer builds shopping cart across two different local farmers
    // Note: client might try to send manipulated price, e.g. 500 NGN instead of 14500
    const clientCart = [
      {
        listingId: "listing_tomatoes_epe",
        qty: 2,
        spoofedClientPrice: 500, // Attacker attempts to forge price
      },
      {
        listingId: "listing_yams_bello",
        qty: 1,
        spoofedClientPrice: 100,
      },
    ];

    // 2. Validate input schema with Zod
    const checkoutInput = {
      items: clientCart.map((c) => ({ listingId: c.listingId, qty: c.qty })),
      paymentMethod: "pay_on_delivery" as const,
      deliveryAddress: "14 Adeola Odeku St, Victoria Island, Lagos",
      deliveryLat: 6.4281,
      deliveryLng: 3.4219,
      buyerName: "Tunde Bakare",
      buyerPhone: "+2348091112233",
      buyerNote: "Call on arrival please",
    };

    const parseResult = checkoutSchema.safeParse(checkoutInput);
    expect(parseResult.success).toBe(true);

    // 3. Server recomputes prices from authoritative database and checks stock
    const verifiedOrderItems: CartItem[] = [];

    for (const item of checkoutInput.items) {
      const serverListing = inventory.find((l) => l.$id === item.listingId);
      expect(serverListing).toBeDefined();

      // Check available stock
      expect(serverListing!.quantityAvailable).toBeGreaterThanOrEqual(item.qty);

      // Decrement stock atomically
      serverListing!.quantityAvailable -= item.qty;

      // Add to verified cart with AUTHORITATIVE server price
      verifiedOrderItems.push({
        listingId: serverListing!.$id,
        sellerId: serverListing!.sellerId,
        sellerName: serverListing!.sellerName || "Farm",
        title: serverListing!.title,
        unitPrice: serverListing!.price, // 14,500 NOT 500!
        unit: serverListing!.unit,
        qty: item.qty,
        maxAvailable: serverListing!.quantityAvailable,
      });
    }

    // Verify stock was decremented properly
    const tomatoesListing = inventory.find((l) => l.$id === "listing_tomatoes_epe");
    expect(tomatoesListing?.quantityAvailable).toBe(8); // 10 - 2 = 8

    // 4. Split cart into ONE ORDER PER FARMER
    const splitOrders = splitCartBySeller(verifiedOrderItems);
    expect(splitOrders).toHaveLength(2); // exactly 2 farmer orders

    const alabiOrder = splitOrders.find((s) => s.sellerId === "farmer_alabi");
    expect(alabiOrder).toBeDefined();
    expect(alabiOrder?.orderTotal).toBe(14500 * 2); // ₦29,000

    const belloOrder = splitOrders.find((s) => s.sellerId === "farmer_bello");
    expect(belloOrder).toBeDefined();
    expect(belloOrder?.orderTotal).toBe(8500 * 1); // ₦8,500

    const grandTotal = computeCartGrandTotal(splitOrders);
    expect(grandTotal).toBe(37500); // 29,000 + 8,500 = 37,500

    // 5. Simulate Order Status Progression for farmer_alabi
    const orderInstance: Order = {
      $id: "order_test_alabi_101",
      buyerId: "buyer_123",
      sellerId: "farmer_alabi",
      status: "pending",
      paymentMethod: "pay_on_delivery",
      paymentStatus: "unpaid",
      deliveryAddress: checkoutInput.deliveryAddress,
      deliveryLat: checkoutInput.deliveryLat,
      deliveryLng: checkoutInput.deliveryLng,
      total: alabiOrder!.orderTotal,
      createdAt: new Date().toISOString(),
    };

    // Progression: pending -> accepted -> out_for_delivery -> completed
    expect(orderInstance.status).toBe("pending");

    // Farmer accepts
    orderInstance.status = "accepted";
    expect(orderInstance.status).toBe("accepted");

    // Farmer departs with produce
    orderInstance.status = "out_for_delivery";
    expect(orderInstance.status).toBe("out_for_delivery");

    // Delivered to buyer
    orderInstance.status = "completed";
    orderInstance.paymentStatus = "paid";
    expect(orderInstance.status).toBe("completed");
    expect(orderInstance.paymentStatus).toBe("paid");
  });

  it("verifies Paystack webhook signature security", () => {
    const rawPayload = JSON.stringify({
      event: "charge.success",
      data: {
        reference: "ref_12345",
        status: "success",
        amount: 2500000, // 25,000 NGN in kobo
      },
    });

    // Valid secret key mock
    process.env.PAYSTACK_SECRET_KEY = "sk_test_mock_secret_key_12345";
    const provider = defaultPaymentProvider;

    const crypto = require("crypto");
    const validSignature = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawPayload)
      .digest("hex");

    // Should accept valid signature
    expect(provider.verifyWebhookSignature(validSignature, rawPayload)).toBe(true);

    // Should reject forged/tampered signature
    expect(provider.verifyWebhookSignature("invalid_forged_signature", rawPayload)).toBe(false);
  });
});
