"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Listing } from "@/lib/types";
import { getListingById } from "@/features/listings/listing-actions";
import { useCart } from "@/features/cart/cart-context";
import { useI18n } from "@/lib/i18n/context";
import { getProduceImageUrl } from "@/lib/appwrite/client";
import { APP_CONFIG } from "@/lib/config";
import {
  MapPin,
  Sprout,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Truck,
  ShieldCheck,
  MessageCircle,
  Clock,
  Star,
  Check,
} from "lucide-react";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string;

  const { addToCart, setIsOpen } = useCart();
  const { t } = useI18n();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("/images/produce/placeholder.svg");

  useEffect(() => {
    async function fetchDoc() {
      setIsLoading(true);
      if (listingId) {
        const item = await getListingById(listingId);
        setListing(item);
        if (item?.photoIds?.[0]) {
          setImgSrc(getProduceImageUrl(item.photoIds[0], 900, 85));
        }
      }
      setIsLoading(false);
    }
    fetchDoc();
  }, [listingId]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
          <div className="w-32 h-4 bg-parchment-soft rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="w-full aspect-[4/3] bg-parchment-soft rounded-2xl" />
            <div className="space-y-4">
              <div className="w-3/4 h-8 bg-parchment-soft rounded" />
              <div className="w-1/3 h-6 bg-parchment-soft rounded" />
              <div className="w-full h-24 bg-parchment-soft rounded" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold text-forest">Produce Not Found</h2>
          <p className="text-xs text-charcoal-muted">
            This produce listing may have been sold out or archived by the grower.
          </p>
          <Link
            href="/"
            className="inline-flex px-5 py-2.5 rounded-lg bg-forest text-parchment font-semibold text-xs shadow-subtle"
          >
            Return to Marketplace
          </Link>
        </main>
      </>
    );
  }

  const isSoldOut = listing.status === "sold_out" || listing.quantityAvailable <= 0;

  const handleAddToCart = () => {
    if (isSoldOut) return;
    addToCart(
      {
        listingId: listing.$id,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName || "Local Farm",
        title: listing.title,
        unitPrice: listing.price,
        unit: listing.unit,
        maxAvailable: listing.quantityAvailable,
        photoId: listing.photoIds[0],
        areaName: listing.areaName,
      },
      qty
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setIsOpen(true);
  };

  const farmerPhoneDigits = (listing.sellerPhone || "").replace(/[^0-9]/g, "");
  const farmerWhatsapp = farmerPhoneDigits
    ? `https://wa.me/${farmerPhoneDigits}?text=${encodeURIComponent(
        `Hello, I'm inquiring about your fresh ${listing.title} on Ọjà.`
      )}`
    : null;

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to produce feed</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Produce Photography */}
          <div className="space-y-4">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-hairline bg-parchment-soft shadow-subtle">
              <Image
                src={imgSrc}
                alt={listing.title}
                fill
                priority
                unoptimized={imgSrc.endsWith(".svg")}
                onError={() => setImgSrc("/images/produce/placeholder.svg")}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              {isSoldOut && (
                <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center">
                  <span className="px-4 py-2 rounded-full bg-charcoal text-white font-bold text-sm uppercase tracking-wider">
                    Sold Out
                  </span>
                </div>
              )}
            </div>

            {/* Quality & Freshness Guarantee Card */}
            <div className="p-4 rounded-xl bg-white border border-hairline shadow-subtle space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-forest">
                <ShieldCheck className="w-4 h-4 text-forest" />
                <span>Harvest Freshness Guarantee</span>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Picked direct from local soils. Inspected for ripeness and firm texture before packing.
              </p>
              <div className="pt-2 border-t border-hairline flex items-center justify-between text-[11px] text-charcoal-muted">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-ochre" />
                  Direct farmer delivery
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-ochre" />
                  Same-day or next-dawn
                </span>
              </div>
            </div>
          </div>

          {/* Details & Purchase Box */}
          <div className="space-y-6">
            <div>
              {/* Farmer Snippet */}
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-forest-light text-forest flex items-center justify-center font-bold text-xs">
                    <Sprout className="w-5 h-5 text-forest" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-forest">{listing.sellerName || "Local Farm"}</p>
                    <p className="text-[11px] text-charcoal-muted flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-terracotta" />
                      {listing.areaName || APP_CONFIG.geo.defaultAreaName}
                    </p>
                  </div>
                </div>

                {farmerWhatsapp && (
                  <a
                    href={farmerWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Ask Farmer</span>
                  </a>
                )}
              </div>

              {/* Title & Price */}
              <div className="pt-4 space-y-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal leading-snug">
                  {listing.title}
                </h1>

                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-bold text-forest">
                    ₦{listing.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-charcoal-muted">
                    per {listing.unit}
                  </span>
                </div>

                <p className="text-xs text-charcoal-muted">
                  Available in farm storage: <span className="font-bold text-charcoal">{listing.quantityAvailable}</span> {listing.unit}s
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                About this harvest
              </h3>
              <p className="text-sm text-charcoal leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Quantity Selector & Add to Cart */}
            {!isSoldOut && (
              <div className="p-5 rounded-2xl bg-parchment-soft border border-hairline space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal">Select Quantity:</span>
                  <div className="inline-flex items-center border border-hairline rounded-lg bg-white shadow-subtle">
                    <button
                      type="button"
                      disabled={qty <= 1}
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="touch-target px-3 py-1 text-charcoal-muted hover:text-charcoal disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-serif font-bold text-base text-charcoal">
                      {qty}
                    </span>
                    <button
                      type="button"
                      disabled={qty >= listing.quantityAvailable}
                      onClick={() => setQty(Math.min(listing.quantityAvailable, qty + 1))}
                      className="touch-target px-3 py-1 text-charcoal-muted hover:text-charcoal disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-charcoal-muted">Subtotal:</span>
                  <span className="font-serif text-xl font-bold text-forest">
                    ₦{(listing.price * qty).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`touch-target py-3 rounded-xl font-semibold text-xs border transition-all flex items-center justify-center gap-2 ${
                      isAdded
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "border-forest text-forest bg-white hover:bg-forest hover:text-white"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Basket</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>{t.addToBasket}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="touch-target py-3 rounded-xl bg-forest hover:bg-forest-hover text-parchment font-semibold text-xs shadow-subtle transition-all"
                  >
                    {t.checkout}
                  </button>
                </div>
              </div>
            )}

            {/* Farm Review Badge */}
            <div className="pt-2 border-t border-hairline flex items-center gap-4 text-xs text-charcoal-muted">
              <div className="flex items-center gap-1 text-ochre font-bold">
                <Star className="w-4 h-4 fill-ochre" />
                <span>4.9</span>
              </div>
              <span>Verified local harvests</span>
              <span>•</span>
              <span>100% grower direct</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
