"use client";

import React, { useState } from "react";
import { X, MapPin, Check, Navigation } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

export interface AreaOption {
  name: string;
  lat: number;
  lng: number;
  state: string;
}

export const POPULAR_LOCATIONS: AreaOption[] = APP_CONFIG.geo.locations;

interface AreaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat: number;
  currentLng: number;
  currentAreaName: string;
  onSelectArea: (area: { name: string; lat: number; lng: number }) => void;
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
}

export function AreaPickerModal({
  isOpen,
  onClose,
  currentAreaName,
  onSelectArea,
  radiusKm,
  onRadiusChange,
}: AreaPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  if (!isOpen) return null;

  const filteredAreas = POPULAR_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseGps = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsDetectingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSelectArea({
            name: "My GPS Location",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setIsDetectingGps(false);
          onClose();
        },
        () => {
          setIsDetectingGps(false);
          alert("Could not access GPS location. Please choose an area below.");
        },
        { timeout: 7000 }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-parchment rounded-xl border border-hairline shadow-dropdown p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div>
            <h3 className="font-serif text-xl font-bold text-forest">Discovery Location</h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Select your neighbourhood or farm district
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-charcoal-muted hover:text-charcoal rounded-full hover:bg-parchment-soft"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Button */}
        <div className="my-4">
          <button
            type="button"
            onClick={handleUseGps}
            disabled={isDetectingGps}
            className="w-full py-2.5 px-3.5 rounded-lg border border-forest/30 bg-forest-light hover:bg-forest hover:text-white text-forest text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>{isDetectingGps ? "Detecting GPS..." : "Use My Exact Device GPS"}</span>
          </button>
        </div>

        {/* Radius Filter */}
        <div className="mb-4 p-3 rounded-lg bg-white border border-hairline space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-charcoal">Search Radius:</span>
            <span className="font-serif font-bold text-forest text-sm">{radiusKm} km</span>
          </div>
          <div className="flex gap-1.5">
            {APP_CONFIG.geo.supportedRadiiKm.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRadiusChange(r)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  radiusKm === r
                    ? "bg-forest text-parchment shadow-sm"
                    : "bg-parchment-soft text-charcoal-muted hover:text-charcoal"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Area Search Input */}
        <div className="relative mb-3">
          <MapPin className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search neighbourhood or market..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-hairline bg-white text-xs text-charcoal focus:border-forest outline-none transition-all"
          />
        </div>

        {/* Areas List */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {filteredAreas.map((loc) => {
            const isSelected = currentAreaName === loc.name;
            return (
              <button
                key={loc.name}
                type="button"
                onClick={() => {
                  onSelectArea({ name: loc.name, lat: loc.lat, lng: loc.lng });
                  onClose();
                }}
                className={`w-full p-2.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-forest-light text-forest font-bold"
                    : "hover:bg-parchment-soft text-charcoal"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 opacity-70" />
                  <span>{loc.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-forest" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
