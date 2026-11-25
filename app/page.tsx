"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { ListingFeed } from "@/features/listings/listing-feed";
import { AreaPickerModal } from "@/features/listings/area-picker-modal";
import { useAuth } from "@/features/auth/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { APP_CONFIG } from "@/lib/config";
import { Sprout, ShieldCheck, Truck } from "lucide-react";

export default function HomePage() {
  const { profile } = useAuth();
  const { t } = useI18n();

  // Location state for nearby calculations (using centralized configuration)
  const [userLocation, setUserLocation] = useState({
    name: profile?.areaName || APP_CONFIG.geo.defaultAreaName,
    lat: profile?.lat || APP_CONFIG.geo.defaultLat,
    lng: profile?.lng || APP_CONFIG.geo.defaultLng,
  });

  const [radiusKm, setRadiusKm] = useState(APP_CONFIG.geo.defaultRadiusKm);
  const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);

  const handleSelectArea = (area: { name: string; lat: number; lng: number }) => {
    setUserLocation(area);
  };

  return (
    <>
      <Navbar
        onOpenAreaPicker={() => setIsAreaPickerOpen(true)}
        currentAreaName={userLocation.name.split(",")[0]}
      />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 min-w-0">
        {/* Editorial Market Banner (Split Background: Solid Forest Green + Farmer Photograph) */}
        <section className="relative rounded-2xl bg-forest text-parchment overflow-hidden shadow-subtle w-full max-w-full grid grid-cols-1 md:grid-cols-12 border border-forest-muted/30">
          {/* Left Side: Solid Forest Green Background with Story Content */}
          <div className="relative z-10 p-5 sm:p-8 md:p-10 md:col-span-7 flex flex-col justify-center space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-hover border border-forest-muted text-[11px] font-semibold text-parchment-soft w-fit">
              <Sprout className="w-3.5 h-3.5 text-ochre" />
              <span>Hyperlocal Farm Fresh Produce</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight break-words">
              Straight from the soil to your kitchen.
            </h1>

            <p className="text-xs sm:text-sm text-parchment/85 leading-relaxed max-w-xl">
              Fresh tomatoes from Epe, new yams from Benue, crisp ugu from Sangotedo.
              Delivered directly by the farmers who harvest them.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-parchment/75">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-ochre" />
                Farmer Direct Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-ochre" />
                Pay on Delivery or Card
              </span>
            </div>
          </div>

          {/* Right Side: Split Image Background */}
          <div className="relative md:col-span-5 h-60 sm:h-72 md:h-auto min-h-[220px] md:min-h-full overflow-hidden">
            <Image
              src="/images/hero-farmer.jpg"
              alt="Local farmer inspecting fresh harvest in greenhouse"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 45vw"
            />
            {/* Seamless split gradient blend: smooth fade on desktop from forest to image, soft top fade on mobile */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-forest via-forest/20 to-transparent pointer-events-none" />

            {/* Verification badge on image */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 px-2.5 py-1 rounded-full bg-forest/85 backdrop-blur-md border border-white/10 text-[10px] text-parchment-soft font-medium shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Grower Direct</span>
            </div>
          </div>
        </section>

        {/* Discovery Feed */}
        <section className="w-full min-w-0 max-w-full">
          <ListingFeed
            userLat={userLocation.lat}
            userLng={userLocation.lng}
            userAreaName={userLocation.name.split(",")[0]}
            onOpenAreaPicker={() => setIsAreaPickerOpen(true)}
            radiusKm={radiusKm}
            onRadiusChange={(r) => setRadiusKm(r)}
          />
        </section>
      </main>

      {/* Area Picker Modal */}
      <AreaPickerModal
        isOpen={isAreaPickerOpen}
        onClose={() => setIsAreaPickerOpen(false)}
        currentLat={userLocation.lat}
        currentLng={userLocation.lng}
        currentAreaName={userLocation.name}
        onSelectArea={handleSelectArea}
        radiusKm={radiusKm}
        onRadiusChange={(r) => setRadiusKm(r)}
      />
    </>
  );
}
