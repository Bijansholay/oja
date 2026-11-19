"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { AuthModal } from "@/components/auth/auth-modal";
import { useCart } from "@/features/cart/cart-context";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { PaymentMethod } from "@/lib/types";
import { APP_CONFIG } from "@/lib/config";
import { normalizePhoneNumber } from "@/lib/validation/schemas";
import {
  MapPin,
  Phone,
  ShieldCheck,
  CreditCard,
  Banknote,
  ArrowRight,
  ArrowLeft,
  Sprout,
  AlertCircle,
  Truck,
  CheckCircle2,
  LogIn,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, splitOrders, grandTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { t } = useI18n();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check if Paystack is configured
  const isPaystackConfigured =
    Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY && process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.startsWith("pk_"));

  // Form State
  const [deliveryAddress, setDeliveryAddress] = useState(
    profile?.areaName ? `${profile.areaName}` : ""
  );
  const [buyerName, setBuyerName] = useState(user?.name || profile?.name || "");
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || profile?.phone || "");
  const [buyerNote, setBuyerNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    isPaystackConfigured ? "online" : "pay_on_delivery"
  );

  const [deliveryLat, setDeliveryLat] = useState(
    profile?.lat || APP_CONFIG.geo.defaultLat
  );
  const [deliveryLng, setDeliveryLng] = useState(
    profile?.lng || APP_CONFIG.geo.defaultLng
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-sync profile details when session is available
  useEffect(() => {
    if (profile?.areaName && !deliveryAddress) {
      setDeliveryAddress(profile.areaName);
    }
    if ((profile?.name || user?.name) && !buyerName) {
      setBuyerName(profile?.name || user?.name || "");
    }
    if ((profile?.phone || user?.phone) && !buyerPhone) {
      setBuyerPhone(profile?.phone || user?.phone || "");
    }
  }, [user, profile, deliveryAddress, buyerName, buyerPhone]);

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold text-forest">Your basket is empty</h2>
          <p className="text-xs text-charcoal-muted">
            Add fresh harvests to your basket before proceeding to checkout.
          </p>
          <Link
            href="/"
            className="inline-flex px-5 py-2.5 rounded-lg bg-forest text-parchment font-semibold text-xs shadow-subtle"
          >
            Browse Fresh Harvests
          </Link>
        </main>
      </>
    );
  }

  // Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Require authentication before placing order
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedBuyerPhone = normalizePhoneNumber(buyerPhone.trim());
      const payload = {
        items: items.map((i) => ({ listingId: i.listingId, qty: i.qty })),
        paymentMethod,
        deliveryAddress: deliveryAddress.trim(),
        deliveryLat,
        deliveryLng,
        buyerNote: buyerNote.trim() || undefined,
        buyerId: user.$id,
        buyerName: buyerName.trim(),
        buyerPhone: normalizedBuyerPhone,
      };

      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order. Please review your details.");
      }

      // Order created successfully!
      clearCart();

      // If online payment with Paystack authorization URL
      if (paymentMethod === "online" && data.paymentAuthUrl) {
        window.location.href = data.paymentAuthUrl;
        return;
      }

      // If Pay on delivery or direct mock
      const firstOrderId = data.orders?.[0]?.$id;
      if (firstOrderId) {
        router.push(`/orders/${firstOrderId}`);
      } else {
        router.push("/orders");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to place order");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold text-forest">Order Checkout</h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Produce is freshly harvested and delivered directly by each grower to your address.
          </p>
        </div>

        {!user && (
          <div className="p-4 rounded-xl bg-forest-light/60 border border-forest/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-forest text-parchment flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-forest">Sign in with Phone for 1-Click Checkout</p>
                <p className="text-[11px] text-charcoal-muted">
                  Auto-fill your delivery details and receive live order updates from the grower.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-forest hover:bg-forest-hover text-parchment font-semibold text-xs transition-colors shadow-subtle flex-shrink-0 flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Phone</span>
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Columns: Delivery Details & Payment */}
          <div className="md:col-span-2 space-y-6">
            {/* Delivery Contact & Address */}
            <div className="p-5 rounded-2xl bg-white border border-hairline shadow-subtle space-y-4">
              <h2 className="font-serif text-lg font-bold text-forest flex items-center gap-2">
                <MapPin className="w-4 h-4 text-forest" />
                <span>Delivery Location</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">
                    Street Address / Landmark <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. 14 Adeola Odeku St, near Zenith Bank, Victoria Island"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-parchment-soft/50 text-sm text-charcoal focus:border-forest outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1">
                      Your Full Name <span className="text-terracotta">*</span>
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Tunde Bakare"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-parchment-soft/50 text-sm text-charcoal focus:border-forest outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1">
                      Phone Number (for Farmer SMS / WhatsApp) <span className="text-terracotta">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-charcoal-muted absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="+2348012345678"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-hairline bg-parchment-soft/50 text-sm text-charcoal focus:border-forest outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">
                    Farmer Delivery Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={buyerNote}
                    onChange={(e) => setBuyerNote(e.target.value)}
                    placeholder="e.g. Call my gate security on arrival, please handle eggs with care"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-parchment-soft/50 text-sm text-charcoal focus:border-forest outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-5 rounded-2xl bg-white border border-hairline shadow-subtle space-y-4">
              <h2 className="font-serif text-lg font-bold text-forest flex items-center gap-2">
                <Banknote className="w-4 h-4 text-forest" />
                <span>Payment Preference</span>
              </h2>

              <div className="space-y-3">
                {/* Pay on Delivery Option */}
                <label
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "pay_on_delivery"
                      ? "border-forest bg-forest-light/40 shadow-sm"
                      : "border-hairline bg-white hover:bg-parchment-soft"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pay_on_delivery"
                      checked={paymentMethod === "pay_on_delivery"}
                      onChange={() => setPaymentMethod("pay_on_delivery")}
                      className="mt-1 text-forest focus:ring-forest"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-charcoal">
                          Pay on Delivery (Cash or Bank Transfer to Farmer)
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Most Popular
                        </span>
                      </div>
                      <p className="text-[11px] text-charcoal-muted mt-0.5">
                        Inspect produce freshness on delivery, then hand cash or do an instant transfer directly to the farmer.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Online Paystack Option (conditionally available / configured) */}
                {isPaystackConfigured ? (
                  <label
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "online"
                        ? "border-forest bg-forest-light/40 shadow-sm"
                        : "border-hairline bg-white hover:bg-parchment-soft"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === "online"}
                        onChange={() => setPaymentMethod("online")}
                        className="mt-1 text-forest focus:ring-forest"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-forest" />
                            <span>Pay Now (Paystack Debit Card, Bank Transfer, USSD)</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-charcoal-muted mt-0.5">
                          Secured by Paystack webhook verification. Held until farmer confirms order.
                        </p>
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="p-3 rounded-lg bg-parchment-soft border border-hairline text-[11px] text-charcoal-muted">
                    ℹ️ Online card payment will activate when Paystack keys are set in environment. Pay on Delivery is currently available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Split Summary */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-hairline shadow-subtle space-y-4">
              <h2 className="font-serif text-lg font-bold text-forest">Cart Summary</h2>

              {/* Grouped orders per farmer */}
              <div className="space-y-4">
                {splitOrders.map((split, idx) => (
                  <div
                    key={split.sellerId}
                    className="p-3.5 rounded-xl bg-parchment-soft/70 border border-hairline space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-forest pb-1.5 border-b border-hairline">
                      <span className="flex items-center gap-1.5">
                        <Sprout className="w-3.5 h-3.5 text-forest" />
                        <span>Order #{idx + 1}: {split.sellerName}</span>
                      </span>
                      <span>₦{split.orderTotal.toLocaleString()}</span>
                    </div>

                    <div className="space-y-1 text-charcoal-muted">
                      {split.items.map((it) => (
                        <div key={it.listingId} className="flex justify-between text-[11px]">
                          <span>
                            {it.qty}x {it.titleSnapshot}
                          </span>
                          <span className="font-semibold text-charcoal">
                            ₦{it.subtotal.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-hairline flex items-center justify-between">
                <div>
                  <span className="text-xs text-charcoal-muted">Total Due:</span>
                  <p className="font-serif text-2xl font-bold text-forest">
                    ₦{grandTotal.toLocaleString()}
                  </p>
                </div>
                <span className="text-[11px] text-charcoal-muted">
                  {splitOrders.length} {splitOrders.length === 1 ? "Farmer Delivery" : "Farmer Deliveries"}
                </span>
              </div>

              {/* Pay on Delivery Threshold Warning */}
              {paymentMethod === "pay_on_delivery" &&
                grandTotal > APP_CONFIG.orders.maxFirstTimePodLimitNaira && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      <span>
                        Pay on Delivery Limit: {APP_CONFIG.currency.symbol}
                        {APP_CONFIG.orders.maxFirstTimePodLimitNaira.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      First-time Pay on Delivery orders are capped at {APP_CONFIG.currency.symbol}
                      {APP_CONFIG.orders.maxFirstTimePodLimitNaira.toLocaleString()} to prevent fake or failed deliveries.
                      Your current cart total is {APP_CONFIG.currency.symbol}{grandTotal.toLocaleString()}. Please reduce basket items or choose online payment to place this order.
                    </p>
                  </div>
                )}

              {/* Error Message near button */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Place Order CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-forest hover:bg-forest-hover text-parchment font-semibold text-sm transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Splitting & Dispatching Orders...</span>
                ) : (
                  <>
                    <span>Place Order (₦{grandTotal.toLocaleString()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-charcoal-muted leading-tight">
                By placing this order, each farmer is notified immediately to harvest and pack your produce.
              </p>
            </div>
          </div>
        </form>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole="buyer"
      />
    </>
  );
}
