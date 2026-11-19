"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { AuthModal } from "@/components/auth/auth-modal";
import { Order } from "@/lib/types";
import { DEMO_ORDERS } from "@/lib/demo/store";
import { useAuth } from "@/features/auth/auth-context";
import { databases } from "@/lib/appwrite/client";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/constants";
import { Query } from "appwrite";
import {
  PackageCheck,
  Clock,
  CheckCircle,
  Truck,
  ChevronRight,
  Sprout,
  ArrowLeft,
  XCircle,
} from "lucide-react";

export default function MyOrdersPage() {
  const { user, isDemoMode } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const buyerId = user?.$id;

  useEffect(() => {
    async function loadOrders() {
      if (!buyerId) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        if (isDemoMode) {
          const userOrders = DEMO_ORDERS.filter((o) => o.buyerId === buyerId);
          setOrders(userOrders);
          setIsLoading(false);
          return;
        }

        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ORDERS,
          [Query.equal("buyerId", buyerId), Query.orderDesc("createdAt")]
        );
        const orderDocs = res.documents as unknown as Order[];
        const enriched = await Promise.all(
          orderDocs.map(async (ord) => {
            if (ord.sellerId) {
              try {
                const sellerDoc = await databases.getDocument(
                  DATABASE_ID,
                  COLLECTIONS.PROFILES,
                  ord.sellerId
                );
                return {
                  ...ord,
                  seller: {
                    name: (sellerDoc as any).name || "Local Farmer",
                    phone: (sellerDoc as any).phone || "",
                  },
                };
              } catch {
                return ord;
              }
            }
            return ord;
          })
        );
        setOrders(enriched);
      } catch (err) {
        console.error("Failed loading orders from Appwrite:", err);
        setOrders(isDemoMode ? DEMO_ORDERS.filter((o) => o.buyerId === buyerId) : []);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [buyerId, isDemoMode]);

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="p-8 rounded-2xl border border-hairline bg-white shadow-subtle space-y-4">
            <div className="w-14 h-14 rounded-full bg-forest-light text-forest mx-auto flex items-center justify-center">
              <PackageCheck className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-forest">
              Track Your Harvest Orders
            </h2>
            <p className="text-xs text-charcoal-muted leading-relaxed max-w-md mx-auto">
              Sign in with your phone or email to view past orders, track farm deliveries in realtime, and communicate with your farmers.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-3 rounded-xl bg-forest hover:bg-forest-hover text-parchment font-semibold text-xs transition-all shadow-subtle"
              >
                Sign In to View Orders
              </button>
            </div>
          </div>
        </main>
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          defaultRole="buyer"
        />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Marketplace</span>
          </Link>
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold text-forest">My Harvest Orders</h1>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Track live preparation and doorstep delivery by your local farmers.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-parchment-soft rounded-xl border border-hairline" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-hairline bg-white shadow-subtle space-y-3">
            <PackageCheck className="w-12 h-12 text-charcoal-muted mx-auto opacity-40" />
            <h3 className="font-serif text-lg font-bold text-forest">No orders placed yet</h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
              You haven&apos;t ordered fresh produce yet. Discover produce harvested today by farmers near your neighbourhood.
            </p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-lg bg-forest text-parchment text-xs font-semibold shadow-subtle"
            >
              Browse Fresh Harvests
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusColor =
                order.status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.status === "out_for_delivery"
                  ? "bg-blue-100 text-blue-800"
                  : order.status === "accepted"
                  ? "bg-forest-light text-forest"
                  : order.status === "declined" || order.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800";

              return (
                <Link
                  key={order.$id}
                  href={`/orders/${order.$id}`}
                  className="block p-5 rounded-2xl border border-hairline bg-white shadow-subtle hover:shadow-card transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-hairline">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-forest">
                          #{order.$id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="font-serif text-base font-bold text-charcoal flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-forest" />
                        <span>{order.seller?.name || "Local Farmer"}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="font-serif text-xl font-bold text-forest">
                        ₦{order.total.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-charcoal-muted">
                        {order.paymentMethod === "online" ? "Paid Online" : "Pay on Delivery"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between text-xs text-charcoal-muted">
                    <span className="line-clamp-1 max-w-[280px]">
                      {order.items?.map((it) => `${it.qty}x ${it.titleSnapshot}`).join(", ") ||
                        "Fresh Farm Produce"}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-forest">
                      Track Live Status
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
