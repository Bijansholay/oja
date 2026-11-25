"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Listing, ListingCategory } from "@/lib/types";
import { ListingCard, ListingSkeleton } from "./listing-card";
import { filterAndSortNearby } from "@/lib/geo";
import { useI18n } from "@/lib/i18n/context";
import { DEMO_LISTINGS } from "@/lib/demo/store";
import { databases } from "@/lib/appwrite/client";
import { DATABASE_ID, COLLECTIONS, APPWRITE_PROJECT_ID } from "@/lib/appwrite/constants";
import { APP_CONFIG } from "@/lib/config";
import { Query } from "appwrite";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface ListingFeedProps {
  userLat: number;
  userLng: number;
  userAreaName: string;
  onOpenAreaPicker: () => void;
  radiusKm: number;
  onRadiusChange: (r: number) => void;
}

const CATEGORY_CHIPS: { id: "all" | ListingCategory; labelKey: string; name: string }[] = [
  { id: "all", labelKey: "allCategories", name: "All Harvests" },
  { id: "tubers_roots", labelKey: "tubersRoots", name: "Tubers & Roots" },
  { id: "vegetables_greens", labelKey: "vegetablesGreens", name: "Vegetables" },
  { id: "peppers_spices", labelKey: "peppersSpices", name: "Peppers & Spices" },
  { id: "grains_staples", labelKey: "grainsStaples", name: "Grains & Garri" },
  { id: "poultry_eggs", labelKey: "poultryEggs", name: "Eggs & Poultry" },
  { id: "oils_fats", labelKey: "oilsFats", name: "Pure Oils" },
  { id: "fruits", labelKey: "fruits", name: "Fresh Fruits" },
  { id: "livestock_fish", labelKey: "livestockFish", name: "Smoked Fish" },
];

export function ListingFeed({
  userLat,
  userLng,
  userAreaName,
  onOpenAreaPicker,
  radiusKm,
  onRadiusChange,
}: ListingFeedProps) {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"nearby" | "all">("nearby");
  const [selectedCategory, setSelectedCategory] = useState<"all" | ListingCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rawListings, setRawListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !APPWRITE_PROJECT_ID;

  // Load listings from Appwrite or Demo repository
  useEffect(() => {
    async function fetchListings() {
      setIsLoading(true);
      try {
        if (isDemo) {
          setRawListings(DEMO_LISTINGS);
          setIsLoading(false);
          return;
        }

        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.LISTINGS,
          [Query.equal("status", "active"), Query.orderDesc("createdAt"), Query.limit(APP_CONFIG.appwrite.feedPageLimit)]
        );
        setRawListings(res.documents as unknown as Listing[]);
      } catch (err) {
        console.error("Failed fetching listings from Appwrite:", err);
        setRawListings(isDemo ? DEMO_LISTINGS : []);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, [isDemo]);

  // Compute Nearby and All feeds
  const { nearbyListings, allListings } = useMemo(() => {
    // 1. Text Search Filter
    let filtered = rawListings;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.areaName && item.areaName.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // 3. Nearby calculation with exact haversine distance and radius capping
    const nearbyResults = filterAndSortNearby(filtered, userLat, userLng, radiusKm);
    const nearbyWithDistance: Listing[] = nearbyResults.map((r) => ({
      ...r.item,
      distanceKm: r.distanceKm,
      distanceFormatted: r.distanceFormatted,
    }));

    // 4. "All" Feed: sorted newest first
    const allSorted: Listing[] = [...filtered]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((item) => {
        const dist = filterAndSortNearby([item], userLat, userLng);
        return {
          ...item,
          distanceKm: dist[0]?.distanceKm,
          distanceFormatted: dist[0]?.distanceFormatted,
        };
      });

    return {
      nearbyListings: nearbyWithDistance,
      allListings: allSorted,
    };
  }, [rawListings, searchQuery, selectedCategory, userLat, userLng, radiusKm]);

  const currentDisplayListings = activeTab === "nearby" ? nearbyListings : allListings;

  return (
    <div className="space-y-6">
      {/* Feed Tabs & Location Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs: "Nearby Produce" vs "All Harvests" */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-parchment-soft border border-hairline w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("nearby")}
            className={`touch-target px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "nearby"
                ? "bg-forest text-parchment shadow-sm"
                : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t.nearbyTab}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "nearby" ? "bg-forest-muted text-parchment" : "bg-hairline text-charcoal"
              }`}
            >
              {nearbyListings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`touch-target px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-forest text-parchment shadow-sm"
                : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.allTab}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "all" ? "bg-forest-muted text-parchment" : "bg-hairline text-charcoal"
              }`}
            >
              {allListings.length}
            </span>
          </button>
        </div>

        {/* Location & Radius Pill trigger */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onOpenAreaPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline bg-white hover:bg-parchment-soft text-charcoal transition-all shadow-subtle"
          >
            <MapPin className="w-3.5 h-3.5 text-forest" />
            <span className="font-semibold">{userAreaName}</span>
            <span className="text-charcoal-muted font-normal">• within {radiusKm} km</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-charcoal-muted absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-hairline bg-white text-base sm:text-sm text-charcoal placeholder:text-charcoal-subtle focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all shadow-subtle"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-3.5 text-xs text-charcoal-muted hover:text-charcoal"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Chips (horizontal edge-to-edge scroll on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORY_CHIPS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSelected
                  ? "bg-forest border-forest text-parchment shadow-sm"
                  : "bg-white border-hairline text-charcoal hover:bg-parchment-soft"
              }`}
            >
              {(t as any)[cat.labelKey] || cat.name}
            </button>
          );
        })}
      </div>

      {/* Main Grid Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingSkeleton key={i} />
          ))}
        </div>
      ) : currentDisplayListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {currentDisplayListings.map((item) => (
            <ListingCard
              key={item.$id}
              listing={item}
              showDistance={activeTab === "nearby"}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 px-4 text-center rounded-2xl border border-hairline bg-white shadow-subtle max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-parchment-deep text-charcoal-muted flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="font-serif text-xl font-bold text-forest mb-2">
            {activeTab === "nearby" ? "Nothing nearby yet" : "No harvests found"}
          </h3>
          <p className="text-xs text-charcoal-muted leading-relaxed mb-6">
            {activeTab === "nearby" ? t.emptyNearby : t.emptyAll}
          </p>

          <div className="flex items-center justify-center gap-3">
            {activeTab === "nearby" && (
              <button
                type="button"
                onClick={() => onRadiusChange(radiusKm >= 30 ? 50 : 30)}
                className="px-4 py-2 rounded-lg bg-forest text-parchment text-xs font-semibold hover:bg-forest-hover shadow-subtle transition-colors"
              >
                Widen to {radiusKm >= 30 ? "50 km" : "30 km"} Radius
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-lg border border-hairline bg-parchment-soft text-charcoal text-xs font-semibold hover:bg-parchment-deep transition-colors"
            >
              Browse All Produce
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
