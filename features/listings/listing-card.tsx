"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Listing } from "@/lib/types";
import { useCart } from "@/features/cart/cart-context";
import { useI18n } from "@/lib/i18n/context";
import { getProduceImageUrl } from "@/lib/appwrite/client";
import { MapPin, Plus, Check, Sprout, ShoppingBag } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
  showDistance?: boolean;
}

export function ListingCard({ listing, showDistance = true }: ListingCardProps) {
  const { addToCart, items } = useCart();
  const { t } = useI18n();
  const [isJustAdded, setIsJustAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(() => getProduceImageUrl(listing.photoIds[0], 500, 75));

  const cartItem = items.find((i) => i.listingId === listing.$id);
  const isInCart = !!cartItem;
  const isSoldOut = listing.status === "sold_out" || listing.quantityAvailable <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;

    addToCart({
      listingId: listing.$id,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName || "Local Farm",
      title: listing.title,
      unitPrice: listing.price,
      unit: listing.unit,
      maxAvailable: listing.quantityAvailable,
      photoId: listing.photoIds[0],
      areaName: listing.areaName,
    });

    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1200);
  };

  return (
    <div className="group relative rounded-xl border border-hairline bg-white overflow-hidden shadow-subtle hover:shadow-card transition-all flex flex-col justify-between w-full min-w-0 max-w-full">
      <div>
        {/* Produce Photography */}
        <Link href={`/listings/${listing.$id}`} className="block relative w-full aspect-[4/3] bg-parchment-soft overflow-hidden">
          <Image
            src={imgSrc}
            alt={listing.title}
            fill
            unoptimized={imgSrc.endsWith(".svg")}
            onError={() => setImgSrc("/images/produce/placeholder.svg")}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            {/* Distance badge (rounded, coordinates hidden) */}
            {showDistance && listing.distanceFormatted ? (
              <span className="px-2.5 py-1 rounded-full bg-parchment/95 backdrop-blur-md text-[11px] font-bold text-forest shadow-sm flex items-center gap-1 border border-hairline/60">
                <MapPin className="w-3 h-3 text-terracotta" />
                <span>{listing.distanceFormatted}</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-parchment/95 backdrop-blur-md text-[10px] font-semibold text-charcoal-muted shadow-sm border border-hairline/60">
                {listing.areaName || "Fresh Farm"}
              </span>
            )}

            {isSoldOut && (
              <span className="px-2.5 py-1 rounded-full bg-charcoal/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Sold Out
              </span>
            )}
          </div>
        </Link>

        {/* Content Body */}
        <div className="p-4">
          <div className="flex items-center gap-1 text-[11px] font-medium text-forest mb-1">
            <Sprout className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{listing.sellerName || "Direct from Grower"}</span>
          </div>

          <Link href={`/listings/${listing.$id}`} className="block group-hover:text-forest transition-colors">
            <h3 className="font-serif text-lg font-bold text-charcoal leading-snug line-clamp-1">
              {listing.title}
            </h3>
          </Link>

          <p className="text-xs text-charcoal-muted mt-1 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        </div>
      </div>

      {/* Footer Price & Cart CTA */}
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-hairline flex items-center justify-between">
          <div>
            <p className="font-serif text-xl font-bold text-forest">
              ₦{listing.price.toLocaleString()}
            </p>
            <p className="text-[11px] text-charcoal-muted font-normal -mt-0.5">
              per {listing.unit} • {listing.quantityAvailable} left
            </p>
          </div>

          <button
            type="button"
            disabled={isSoldOut}
            onClick={handleAdd}
            className={`touch-target px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-subtle ${
              isSoldOut
                ? "bg-parchment-soft text-charcoal-subtle cursor-not-allowed border border-hairline"
                : isJustAdded
                ? "bg-emerald-700 text-white"
                : isInCart
                ? "bg-forest-light text-forest border border-forest/30 hover:bg-forest hover:text-white"
                : "bg-forest hover:bg-forest-hover text-parchment"
            }`}
            aria-label={`Add ${listing.title} to basket`}
          >
            {isJustAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : isInCart ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>In Basket ({cartItem?.qty})</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="rounded-xl border border-hairline bg-white overflow-hidden shadow-subtle animate-pulse">
      <div className="w-full aspect-[4/3] bg-parchment-soft" />
      <div className="p-4 space-y-2">
        <div className="w-24 h-3 bg-parchment-soft rounded" />
        <div className="w-4/5 h-5 bg-parchment-soft rounded" />
        <div className="w-full h-3 bg-parchment-soft rounded" />
      </div>
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-hairline flex justify-between items-center">
          <div className="w-20 h-6 bg-parchment-soft rounded" />
          <div className="w-16 h-8 bg-parchment-soft rounded-lg" />
        </div>
      </div>
    </div>
  );
}
