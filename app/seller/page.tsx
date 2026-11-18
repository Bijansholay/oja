"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { Listing, Order, OrderStatus } from "@/lib/types";
import { getSellerListings, updateProduceListing } from "@/features/listings/listing-actions";
import { DEMO_ORDERS } from "@/lib/demo/store";
import { getProduceImageUrl } from "@/lib/appwrite/client";
import { Navbar } from "@/components/layout/navbar";
import { AuthModal } from "@/components/auth/auth-modal";
import { APP_CONFIG } from "@/lib/config";
import { createWhatsAppChatUrl } from "@/lib/notifications/channel";
import {
  Sprout,
  Plus,
  PackageCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  MessageCircle,
  Phone,
  MapPin,
  ChevronRight,
  AlertCircle,
  XCircle,
} from "lucide-react";

export default function SellerDashboardPage() {
  const { user, profile, isDemoMode, loginAsDemoUser } = useAuth();
  const { t } = useI18n();

  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "listings">("orders");

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const effectiveSellerId = user?.$id;

  useEffect(() => {
    async function loadData() {
      if (!effectiveSellerId) {
        setListings([]);
        setOrders([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const myProducts = await getSellerListings(effectiveSellerId);
        setListings(myProducts);

        // Filter orders strictly for this farmer
        const myOrders = DEMO_ORDERS.filter(
          (o) => o.sellerId === effectiveSellerId
        );
        setOrders(myOrders);
      } catch (err) {
        console.error("Failed to load seller data", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [effectiveSellerId]);

  // Order status actions
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.$id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // Toggle listing status (active <-> sold_out)
  const handleToggleListingStatus = async (listingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "sold_out" : "active";
    await updateProduceListing(listingId, { status: nextStatus as any });
    setListings((prev) =>
      prev.map((l) => (l.$id === listingId ? { ...l, status: nextStatus as any } : l))
    );
  };

  // Metrics calculation
  const totalRevenue = orders
    .filter((o) => o.status === "completed" || o.status === "accepted" || o.status === "out_for_delivery")
    .reduce((acc, o) => acc + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === "pending");

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="p-8 rounded-2xl border border-hairline bg-white shadow-subtle space-y-4">
            <div className="w-14 h-14 rounded-full bg-forest-light text-forest mx-auto flex items-center justify-center">
              <Sprout className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-forest">
              Farmer Operations Dashboard
            </h2>
            <p className="text-xs text-charcoal-muted leading-relaxed max-w-md mx-auto">
              Sign in to manage your farm produce listings, accept customer orders, and track direct doorstep deliveries across your local market area.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-3 rounded-xl bg-forest hover:bg-forest-hover text-parchment font-semibold text-xs transition-all shadow-subtle"
              >
                Sign In to Farm Dashboard
              </button>
            </div>
          </div>
        </main>
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          defaultRole="seller"
        />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Farmer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-light text-forest text-xs font-semibold mb-2">
              <Sprout className="w-3.5 h-3.5" />
              <span>Grower Operations</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-forest">
              {profile?.name || user?.name || "Farmer Dashboard"}
            </h1>
            <p className="text-xs text-charcoal-muted mt-0.5">
              {profile?.areaName || APP_CONFIG.geo.defaultAreaName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/seller/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-forest hover:bg-forest-hover text-parchment font-semibold text-xs shadow-subtle transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Harvest</span>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl border border-hairline bg-white shadow-subtle">
            <div className="flex items-center justify-between text-charcoal-muted mb-1">
              <span className="text-xs font-medium">Orders Volume (Sales)</span>
              <TrendingUp className="w-4 h-4 text-forest" />
            </div>
            <p className="font-serif text-2xl font-bold text-forest">
              ₦{totalRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-charcoal-muted mt-1">Across all confirmed customer orders</p>
          </div>

          <div className="p-4 rounded-xl border border-hairline bg-white shadow-subtle">
            <div className="flex items-center justify-between text-charcoal-muted mb-1">
              <span className="text-xs font-medium">Awaiting Acceptance</span>
              <Clock className="w-4 h-4 text-ochre" />
            </div>
            <p className="font-serif text-2xl font-bold text-charcoal">
              {pendingOrders.length} {pendingOrders.length === 1 ? "Order" : "Orders"}
            </p>
            <p className="text-[11px] text-charcoal-muted mt-1">Ready for packing and delivery</p>
          </div>

          <div className="p-4 rounded-xl border border-hairline bg-white shadow-subtle">
            <div className="flex items-center justify-between text-charcoal-muted mb-1">
              <span className="text-xs font-medium">Active Harvests Listed</span>
              <Sprout className="w-4 h-4 text-forest" />
            </div>
            <p className="font-serif text-2xl font-bold text-charcoal">
              {listings.filter((l) => l.status === "active").length} Produce Types
            </p>
            <p className="text-[11px] text-charcoal-muted mt-1">Discoverable by nearby buyers</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-hairline mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "orders"
                ? "border-forest text-forest"
                : "border-transparent text-charcoal-muted hover:text-charcoal"
            }`}
          >
            <span>Customer Orders</span>
            <span className="px-2 py-0.5 rounded-full bg-parchment-soft text-xs text-charcoal font-semibold">
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "listings"
                ? "border-forest text-forest"
                : "border-transparent text-charcoal-muted hover:text-charcoal"
            }`}
          >
            <span>My Farm Inventory</span>
            <span className="px-2 py-0.5 rounded-full bg-parchment-soft text-xs text-charcoal font-semibold">
              {listings.length}
            </span>
          </button>
        </div>

        {/* Orders Tab Content */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-hairline bg-white">
                <PackageCheck className="w-12 h-12 text-charcoal-muted mx-auto mb-3 opacity-40" />
                <h3 className="font-serif text-lg font-bold text-forest">No orders received yet</h3>
                <p className="text-xs text-charcoal-muted mt-1">
                  When nearby buyers add your produce to their cart and checkout, their orders will appear here in realtime.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const buyerPhoneDigits = (order.buyer?.phone || "").replace(/[^0-9]/g, "");
                const whatsappUrl = buyerPhoneDigits
                  ? `https://wa.me/${buyerPhoneDigits}?text=${encodeURIComponent(
                      `Hello ${order.buyer?.name || "Customer"}, this is your farmer from Ọjà regarding your order #${order.$id.slice(-6)}. We are preparing your fresh produce!`
                    )}`
                  : null;

                return (
                  <div
                    key={order.$id}
                    className="p-5 rounded-xl border border-hairline bg-white shadow-subtle space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-hairline">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-forest">
                            #{order.$id.slice(-6).toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              order.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.status === "out_for_delivery"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "accepted"
                                ? "bg-forest-light text-forest"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-charcoal-muted">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h4 className="font-serif text-lg font-bold text-charcoal mt-1">
                          Buyer: {order.buyer?.name || "Verified Customer"}
                        </h4>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-charcoal-muted">Total Order Value</p>
                        <p className="font-serif text-xl font-bold text-forest">
                          ₦{order.total.toLocaleString()}
                        </p>
                        <span className="text-[11px] text-charcoal-muted font-medium">
                          {order.paymentMethod === "online" ? "Paid Online (Paystack)" : "Pay on Delivery"}
                        </span>
                      </div>
                    </div>

                    {/* Delivery & Buyer Note */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-parchment-soft p-3 rounded-lg border border-hairline">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-charcoal">Delivery Address:</p>
                          <p className="text-charcoal-muted">{order.deliveryAddress}</p>
                        </div>
                      </div>

                      {order.buyerNote && (
                        <div>
                          <p className="font-bold text-charcoal">Customer Note:</p>
                          <p className="text-charcoal-muted italic">&ldquo;{order.buyerNote}&rdquo;</p>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-charcoal">Ordered Produce:</p>
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs py-1 border-b border-hairline/60 last:border-0"
                        >
                          <span className="font-medium text-charcoal">
                            {item.qty}x {item.titleSnapshot}
                          </span>
                          <span className="font-semibold text-charcoal">
                            ₦{(item.unitPriceSnapshot * item.qty).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat on WhatsApp</span>
                          </a>
                        )}

                        {order.buyer?.phone && (
                          <a
                            href={`tel:${order.buyer.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-hairline bg-white hover:bg-parchment-soft text-charcoal text-xs font-semibold transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-forest" />
                            <span>Call Buyer</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {order.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(order.$id, "accepted")}
                              className="px-4 py-2 rounded-lg bg-forest hover:bg-forest-hover text-parchment text-xs font-semibold shadow-subtle transition-colors"
                            >
                              Accept Order
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(order.$id, "declined")}
                              className="px-3 py-2 rounded-lg border border-hairline bg-white hover:bg-red-50 text-red-700 text-xs font-semibold transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {order.status === "accepted" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.$id, "out_for_delivery")}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-subtle transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Mark Out for Delivery</span>
                          </button>
                        )}

                        {order.status === "out_for_delivery" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.$id, "completed")}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-subtle transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirm Delivery Complete</span>
                          </button>
                        )}

                        {order.status === "completed" && (
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Delivered & Closed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Listings Tab Content */}
        {activeTab === "listings" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((item) => {
              const imgUrl = getProduceImageUrl(item.photoIds[0], 400, 75);
              return (
                <div
                  key={item.$id}
                  className="rounded-xl border border-hairline bg-white overflow-hidden shadow-subtle flex flex-col"
                >
                  <div className="relative w-full h-44 bg-parchment-soft">
                    <Image
                      src={imgUrl}
                      alt={item.title}
                      fill
                      unoptimized={imgUrl.endsWith(".svg")}
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "active"
                          ? "bg-forest text-parchment"
                          : "bg-charcoal/80 text-parchment"
                      }`}
                    >
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-forest line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="font-semibold text-sm text-charcoal mt-0.5">
                      ₦{item.price.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-charcoal-muted">/ {item.unit}</span>
                    </p>
                    <p className="text-xs text-charcoal-muted mt-1">
                      Available Stock: <span className="font-bold text-charcoal">{item.quantityAvailable}</span> {item.unit}s
                    </p>
                  </div>

                  <div className="pt-2 border-t border-hairline flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleListingStatus(item.$id, item.status)}
                      className="text-xs font-semibold text-forest hover:underline"
                    >
                      {item.status === "active" ? "Mark as Sold Out" : "Mark as Active"}
                    </button>

                    <Link
                      href={`/listings/${item.$id}`}
                      className="text-xs text-charcoal-muted hover:text-charcoal flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </main>
    </>
  );
}
