"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Order, OrderItem, OrderStatus } from "@/lib/types";
import { DEMO_ORDERS } from "@/lib/demo/store";
import { useAuth } from "@/features/auth/auth-context";
import { client, databases } from "@/lib/appwrite/client";
import { DATABASE_ID, COLLECTIONS, APPWRITE_PROJECT_ID } from "@/lib/appwrite/constants";
import { ID, Query } from "appwrite";
import { APP_CONFIG } from "@/lib/config";
import { createWhatsAppChatUrl } from "@/lib/notifications/channel";
import {
  PackageCheck,
  Clock,
  CheckCircle,
  Truck,
  MessageCircle,
  Phone,
  MapPin,
  ArrowLeft,
  Sprout,
  ShieldCheck,
  Star,
  Check,
  XCircle,
} from "lucide-react";

const TIMELINE_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  {
    status: "pending",
    label: "Order Placed",
    desc: "Awaiting confirmation from the grower",
  },
  {
    status: "accepted",
    label: "Accepted & Harvesting",
    desc: "Produce is being packed fresh at the farm",
  },
  {
    status: "out_for_delivery",
    label: "Out for Delivery",
    desc: "The farmer is in transit to your doorstep",
  },
  {
    status: "completed",
    label: "Delivered",
    desc: "Safely delivered directly to your hands",
  },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { user, isDemoMode } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Review modal state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  // Load Order and setup Realtime subscription
  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      try {
        if (isDemoMode) {
          const found = DEMO_ORDERS.find((o) => o.$id === orderId);
          setOrder(found || DEMO_ORDERS[0]);
          setIsLoading(false);
          return;
        }

        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId);
        const orderData = doc as unknown as Order;

        // Fetch order items for this order
        try {
          const itemsRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ORDER_ITEMS,
            [Query.equal("orderId", orderId)]
          );
          orderData.items = itemsRes.documents as unknown as OrderItem[];
        } catch (itemErr) {
          console.warn("Could not load order items:", itemErr);
        }

        // Fetch seller profile for name and phone
        if (orderData.sellerId) {
          try {
            const sellerDoc = await databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.PROFILES,
              orderData.sellerId
            );
            orderData.seller = {
              name: (sellerDoc as any).name || "Local Farmer",
              phone: (sellerDoc as any).phone || "",
            };
          } catch (sellerErr) {
            console.warn("Could not load seller profile:", sellerErr);
          }
        }

        setOrder(orderData);
      } catch (err) {
        if (isDemoMode) {
          const found = DEMO_ORDERS.find((o) => o.$id === orderId);
          setOrder(found || DEMO_ORDERS[0]);
        } else {
          setOrder(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();

    // Appwrite Realtime live subscription for live status changes
    if (!isDemoMode && APPWRITE_PROJECT_ID) {
      try {
        const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.ORDERS}.documents.${orderId}`;
        const unsubscribe = client.subscribe(channel, (response: any) => {
          if (response.payload) {
            setOrder((prev) => (prev ? { ...prev, ...response.payload } : response.payload));
          }
        });
        return () => {
          unsubscribe();
        };
      } catch (e) {
        console.warn("Realtime subscription fallback", e);
      }
    }
  }, [orderId, isDemoMode]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
          <div className="w-32 h-4 bg-parchment-soft rounded" />
          <div className="h-64 bg-parchment-soft rounded-2xl" />
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold text-forest">Order Not Found</h2>
          <Link
            href="/orders"
            className="inline-flex px-5 py-2.5 rounded-lg bg-forest text-parchment text-xs font-semibold"
          >
            Return to My Orders
          </Link>
        </main>
      </>
    );
  }

  // Calculate current step index
  const statusOrder: OrderStatus[] = ["pending", "accepted", "out_for_delivery", "completed"];
  const currentStepIndex = statusOrder.indexOf(order.status);

  // WhatsApp deep-link
  const farmerPhone = order.seller?.phone;
  const whatsappUrl = farmerPhone
    ? createWhatsAppChatUrl(
        farmerPhone,
        `Hello ${order.seller?.name || "Farmer"}, I am checking in on my order #${order.$id.slice(-6).toUpperCase()} on Ọjà.`
      )
    : null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      if (!isDemoMode && APPWRITE_PROJECT_ID) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.REVIEWS,
          ID.unique(),
          {
            orderId: order.$id,
            sellerId: order.sellerId,
            buyerId: order.buyerId,
            buyerName: order.buyer?.name || "Verified Buyer",
            rating: reviewRating,
            comment: reviewComment.trim(),
            createdAt: new Date().toISOString(),
          }
        );
      }
      setIsReviewSubmitted(true);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setIsReviewSubmitted(true);
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All My Orders</span>
          </Link>
        </div>

        {/* Order Header */}
        <div className="p-6 rounded-2xl bg-white border border-hairline shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-hairline">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-forest">
                  ORDER #{order.$id.slice(-6).toUpperCase()}
                </span>
                <span className="text-xs text-charcoal-muted">
                  • {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-forest mt-1">
                Harvest Delivery Status
              </h1>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-charcoal-muted">Total Due</span>
              <p className="font-serif text-2xl font-bold text-forest">
                ₦{order.total.toLocaleString()}
              </p>
              <span className="text-[11px] text-charcoal-muted font-medium">
                {order.paymentMethod === "online" ? "Paid Online (Paystack)" : "Pay on Delivery (Cash/Transfer)"}
              </span>
            </div>
          </div>

          {/* Live Timeline */}
          <div className="py-4">
            <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-6">
              Live Progress
            </h3>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-hairline space-y-8 ml-3">
              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.status} className="relative">
                    {/* Step Indicator Dot */}
                    <span
                      className={`absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isPassed
                          ? "bg-forest text-parchment"
                          : "bg-parchment-soft border border-hairline text-charcoal-subtle"
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </span>

                    <div>
                      <h4
                        className={`text-sm font-bold leading-tight ${
                          isCurrent
                            ? "text-forest font-serif text-base"
                            : isPassed
                            ? "text-charcoal"
                            : "text-charcoal-subtle"
                        }`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-forest-light text-forest font-semibold uppercase">
                            Active
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-charcoal-muted mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Farmer Direct Contact Card */}
        <div className="p-5 rounded-2xl bg-white border border-hairline shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-forest-light text-forest flex items-center justify-center font-bold text-sm">
              <Sprout className="w-6 h-6 text-forest" />
            </div>
            <div>
              <p className="text-xs text-charcoal-muted">Your Farmer / Dispatcher</p>
              <h4 className="font-serif text-lg font-bold text-forest">
                {order.seller?.name || "Local Farmer"}
              </h4>
              <p className="text-xs text-charcoal-muted">
                {order.seller?.areaName || APP_CONFIG.geo.defaultAreaName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-subtle"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            )}

            {farmerPhone && (
              <a
                href={`tel:${farmerPhone}`}
                className="touch-target px-3 py-2 rounded-lg border border-hairline bg-white hover:bg-parchment-soft text-charcoal text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4 text-forest" />
                <span>Call</span>
              </a>
            )}
          </div>
        </div>

        {/* Delivery Destination */}
        <div className="p-5 rounded-2xl bg-white border border-hairline shadow-subtle space-y-2">
          <h3 className="font-serif text-base font-bold text-forest flex items-center gap-2">
            <MapPin className="w-4 h-4 text-forest" />
            <span>Delivery Destination</span>
          </h3>
          <p className="text-xs text-charcoal font-medium">{order.deliveryAddress}</p>
          {order.buyerNote && (
            <p className="text-xs text-charcoal-muted italic">Note: &ldquo;{order.buyerNote}&rdquo;</p>
          )}
        </div>

        {/* Itemized Harvest Receipt */}
        <div className="p-5 rounded-2xl bg-white border border-hairline shadow-subtle space-y-3">
          <h3 className="font-serif text-base font-bold text-forest">Items in this Delivery</h3>
          <div className="divide-y divide-hairline">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-charcoal">
                    {item.qty}x {item.titleSnapshot}
                  </p>
                  <p className="text-[11px] text-charcoal-muted">
                    ₦{item.unitPriceSnapshot.toLocaleString()} each
                  </p>
                </div>
                <span className="font-bold text-charcoal">
                  ₦{(item.unitPriceSnapshot * item.qty).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs font-bold text-forest">
            <span>Order Subtotal</span>
            <span className="text-sm">₦{order.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Review Submission Section (if completed or user wants to review) */}
        {order.status === "completed" && (
          <div className="p-5 rounded-2xl bg-parchment-soft border border-hairline shadow-subtle space-y-3">
            <h3 className="font-serif text-lg font-bold text-forest flex items-center gap-2">
              <Star className="w-5 h-5 text-ochre fill-ochre" />
              <span>Rate this Farmer&apos;s Harvest</span>
            </h3>

            {isReviewSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Thank you! Your verified review helps local growers grow their community trust.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-charcoal">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating
                              ? "text-ochre fill-ochre"
                              : "text-charcoal-subtle"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the produce freshness and delivery promptness?"
                  required
                  className="w-full p-2.5 rounded-lg border border-hairline bg-white text-xs text-charcoal focus:border-forest outline-none"
                />

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-forest hover:bg-forest-hover text-parchment font-semibold text-xs shadow-subtle transition-colors"
                >
                  Submit Farmer Review
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </>
  );
}
