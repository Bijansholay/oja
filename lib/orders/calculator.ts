import { CartItem, OrderItem } from "@/lib/types";
import { APP_CONFIG } from "@/lib/config";

export interface SplitOrderDraft {
  sellerId: string;
  sellerName?: string;
  items: Array<{
    listingId: string;
    titleSnapshot: string;
    qty: number;
    unitPriceSnapshot: number;
    subtotal: number;
  }>;
  orderTotal: number;
}

/**
 * Splits a unified shopping cart into separate order groups partitioned by sellerId.
 * Each farmer receives an independent order containing only their produce.
 */
export function splitCartBySeller(cartItems: CartItem[]): SplitOrderDraft[] {
  if (!cartItems || cartItems.length === 0) {
    return [];
  }

  const sellerGroups = new Map<string, SplitOrderDraft>();

  for (const item of cartItems) {
    if (!item.sellerId) {
      throw new Error(`Cart item ${item.listingId} is missing sellerId`);
    }
    if (item.qty <= 0) {
      throw new Error(`Quantity for ${item.title} must be at least 1`);
    }

    const subtotal = item.unitPrice * item.qty;

    if (!sellerGroups.has(item.sellerId)) {
      sellerGroups.set(item.sellerId, {
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        items: [],
        orderTotal: 0,
      });
    }

    const group = sellerGroups.get(item.sellerId)!;
    group.items.push({
      listingId: item.listingId,
      titleSnapshot: item.title,
      qty: item.qty,
      unitPriceSnapshot: item.unitPrice,
      subtotal,
    });
    group.orderTotal += subtotal;
  }

  return Array.from(sellerGroups.values());
}

/**
 * Computes grand total across all split orders in cart.
 */
export function computeCartGrandTotal(drafts: SplitOrderDraft[]): number {
  return drafts.reduce((acc, draft) => acc + draft.orderTotal, 0);
}

/**
 * Verifies if buyer order limit is exceeded (e.g. For new buyers using pay_on_delivery).
 */
export function validateFirstTimePodLimit(
  totalNaira: number,
  maxLimitNaira: number = APP_CONFIG.orders.maxFirstTimePodLimitNaira
): { allowed: boolean; reason?: string } {
  if (totalNaira > maxLimitNaira) {
    return {
      allowed: false,
      reason: `First-time Pay on Delivery orders are capped at ${APP_CONFIG.currency.symbol}${maxLimitNaira.toLocaleString()} to prevent uncollected farm produce. Please choose 'Pay now' or adjust your cart quantity.`,
    };
  }
  return { allowed: true };
}
