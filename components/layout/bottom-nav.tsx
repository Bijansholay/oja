"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/features/cart/cart-context";
import { useI18n } from "@/lib/i18n/context";
import { Store, PackageCheck, ShoppingBag, Sprout } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { totalItemsCount, setIsOpen } = useCart();
  const { t } = useI18n();

  const isHome = pathname === "/";
  const isOrders = pathname.startsWith("/orders");
  const isSeller = pathname.startsWith("/seller");

  // On produce detail pages, hide BottomNav so it doesn't conflict with product action bar
  if (pathname.startsWith("/listings/")) {
    return null;
  }

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-parchment/95 backdrop-blur-md border-t border-hairline pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] px-3 shadow-dropdown">
      <div className="flex items-center justify-around">
        {/* Marketplace */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center touch-target px-3 py-1 text-xs transition-colors ${
            isHome ? "text-forest font-bold" : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span>{t.appName}</span>
        </Link>

        {/* My Orders */}
        <Link
          href="/orders"
          className={`flex flex-col items-center justify-center touch-target px-3 py-1 text-xs transition-colors ${
            isOrders ? "text-forest font-bold" : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          <PackageCheck className="w-5 h-5 mb-0.5" />
          <span>{t.myOrders}</span>
        </Link>

        {/* Cart Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center touch-target px-3 py-1 text-xs text-charcoal-muted hover:text-charcoal relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span>{t.basket}</span>
        </button>

        {/* Farmer Dashboard / Sell */}
        <Link
          href="/seller"
          className={`flex flex-col items-center justify-center touch-target px-3 py-1 text-xs transition-colors ${
            isSeller ? "text-forest font-bold" : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          <Sprout className="w-5 h-5 mb-0.5" />
          <span>{t.farmer}</span>
        </Link>
      </div>
    </nav>
  );
}
