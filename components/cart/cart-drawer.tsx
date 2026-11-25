"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/features/cart/cart-context";
import { useI18n } from "@/lib/i18n/context";
import { getProduceImageUrl } from "@/lib/appwrite/client";
import { X, Plus, Minus, Trash2, Sprout, ArrowRight, ShoppingBag } from "lucide-react";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQty, removeFromCart, grandTotal, splitOrders } = useCart();
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-parchment h-full shadow-2xl flex flex-col border-l border-hairline overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between bg-parchment/90">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-forest" />
            <h2 className="font-serif text-xl font-bold text-forest">
              {t.basket} ({items.reduce((acc, i) => acc + i.qty, 0)})
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="p-2 text-charcoal-muted hover:text-charcoal rounded-full hover:bg-parchment-soft transition-colors"
            aria-label="Close basket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-forest-light text-forest flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="font-serif text-lg font-bold text-forest mb-1">
                Your basket is empty
              </h3>
              <p className="text-xs text-charcoal-muted max-w-xs mb-6">
                Fresh harvests from local growers are waiting. Browse nearby produce and support local agriculture.
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-forest text-parchment font-semibold text-xs hover:bg-forest-hover transition-colors shadow-subtle"
              >
                Browse Fresh Harvests
              </button>
            </div>
          ) : (
            <>
              {/* Grouped by Farmer */}
              {splitOrders.map((split) => (
                <div
                  key={split.sellerId}
                  className="rounded-xl border border-hairline bg-white p-4 shadow-subtle space-y-3"
                >
                  {/* Farmer Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-hairline">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-forest" />
                      <span className="text-xs font-bold text-forest">
                        {split.sellerName || "Local Farm"}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-charcoal">
                      ₦{split.orderTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Items for this farmer */}
                  <div className="space-y-3">
                    {split.items.map((item) => {
                      const cartItem = items.find((i) => i.listingId === item.listingId);
                      const imgUrl = getProduceImageUrl(cartItem?.photoId, 120, 70);
                      return (
                        <div key={item.listingId} className="flex gap-3 items-center">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-parchment-soft flex-shrink-0 border border-hairline">
                            <Image
                              src={imgUrl}
                              alt={item.titleSnapshot}
                              fill
                              unoptimized={imgUrl.endsWith(".svg")}
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-charcoal truncate">
                              {item.titleSnapshot}
                            </h4>
                            <p className="text-[11px] text-charcoal-muted">
                              ₦{item.unitPriceSnapshot.toLocaleString()} / {cartItem?.unit || "unit"}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5">
                              {/* Quantity controls */}
                              <div className="inline-flex items-center border border-hairline rounded-md bg-parchment-soft">
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.listingId, item.qty - 1)}
                                  className="w-6 h-6 flex items-center justify-center text-charcoal-muted hover:text-charcoal"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-charcoal">
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.listingId, item.qty + 1)}
                                  className="w-6 h-6 flex items-center justify-center text-charcoal-muted hover:text-charcoal"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item.listingId)}
                                className="p-1 text-charcoal-muted hover:text-red-700 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-charcoal">
                              ₦{item.subtotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="p-3 rounded-lg bg-parchment-soft border border-hairline text-[11px] text-charcoal-muted leading-relaxed">
                💡 Each farmer packs and delivers their own harvest directly to your location. Your order is split per farmer at checkout.
              </div>
            </>
          )}
        </div>

        {/* Footer with Checkout CTA */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-hairline bg-parchment/95 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-charcoal-muted">{t.total} ({items.length} items)</p>
                <p className="font-serif text-2xl font-bold text-forest">
                  ₦{grandTotal.toLocaleString()}
                </p>
              </div>
              <span className="text-[11px] text-charcoal-muted bg-parchment-deep px-2.5 py-1 rounded-md font-medium">
                {splitOrders.length} {splitOrders.length === 1 ? "Farmer Order" : "Farmer Orders"}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="w-full py-3.5 rounded-lg bg-forest hover:bg-forest-hover text-parchment font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-subtle"
            >
              <span>{t.checkout}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
