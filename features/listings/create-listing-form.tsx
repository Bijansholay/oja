"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { ListingCategory, ListingUnit } from "@/lib/types";
import { validateAndCompressImage } from "@/lib/media/compress";
import { uploadProducePhoto, createProduceListing } from "./listing-actions";
import { APP_CONFIG } from "@/lib/config";
import {
  Camera,
  UploadCloud,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES: { id: ListingCategory; label: string; defaultUnit: ListingUnit }[] = [
  { id: "vegetables_greens", label: "Vegetables & Greens", defaultUnit: "bunch" },
  { id: "peppers_spices", label: "Peppers & Spices", defaultUnit: "bag" },
  { id: "tubers_roots", label: "Tubers & Roots", defaultUnit: "piece" },
  { id: "grains_staples", label: "Grains & Staples", defaultUnit: "bag" },
  { id: "fruits", label: "Fresh Fruits", defaultUnit: "bunch" },
  { id: "poultry_eggs", label: "Poultry & Eggs", defaultUnit: "crate" },
  { id: "oils_fats", label: "Pure Oils & Fats", defaultUnit: "crate" },
  { id: "livestock_fish", label: "Fish & Livestock", defaultUnit: "piece" },
];

export function CreateListingForm() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListingCategory>("vegetables_greens");
  const [unit, setUnit] = useState<ListingUnit>("crate");
  const [price, setPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(10);
  const [description, setDescription] = useState("");

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);

  // Location state using centralized configuration
  const [locationName, setLocationName] = useState(profile?.areaName || APP_CONFIG.geo.defaultAreaName);
  const [lat, setLat] = useState<number>(profile?.lat || APP_CONFIG.geo.defaultLat);
  const [lng, setLng] = useState<number>(profile?.lng || APP_CONFIG.geo.defaultLng);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect browser location once if available
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator && !profile?.lat) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationName("Your Current Farmland Location");
          setIsDetectingLocation(false);
        },
        () => {
          setIsDetectingLocation(false);
        },
        { timeout: 5000 }
      );
    }
  }, [profile]);

  // Handle category change
  const handleCategorySelect = (catId: ListingCategory) => {
    setCategory(catId);
    const meta = CATEGORIES.find((c) => c.id === catId);
    if (meta) {
      setUnit(meta.defaultUnit);
    }
  };

  // Handle Photo selection
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await validateAndCompressImage(file);
      setCompressedFile(res.file);
      setPhotoPreview(res.previewUrl);
    } catch (err: any) {
      setError(err.message || "Failed to process photo");
    }
  };

  // Submit Listing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Please sign in as a farmer to post produce");
      return;
    }

    const numPrice = parseFloat(price);
    if (!numPrice || numPrice <= 0) {
      setError("Please enter a valid price in Naira");
      return;
    }

    if (!compressedFile) {
      setError("Please provide a photograph of your fresh harvest");
      return;
    }

    setIsSubmitting(true);

    try {
      const photoId = await uploadProducePhoto(compressedFile);

      await createProduceListing(
        {
          title: title.trim(),
          category,
          unit,
          price: numPrice,
          quantityAvailable: quantity,
          description:
            description.trim() ||
            `Freshly harvested produce from our farmland in ${locationName}. Top quality, handled with care.`,
          photoIds: [photoId],
          lat,
          lng,
          areaName: locationName,
        },
        user.$id,
        profile?.name || user.name || "Local Farmer"
      );

      router.push("/seller");
    } catch (err: any) {
      setError(err.message || "Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/seller"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-forest">Post Fresh Produce</h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Take a photo, set your price, and start selling directly to nearby buyers.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload Zone */}
        <div>
          <label className="block text-xs font-bold text-charcoal mb-2">
            Produce Photo <span className="text-terracotta">*</span>
          </label>
          <div className="relative border-2 border-dashed border-hairline rounded-xl p-4 bg-parchment-soft hover:bg-parchment-deep transition-all text-center">
            {photoPreview ? (
              <div className="relative w-full h-56 rounded-lg overflow-hidden border border-hairline bg-black/5">
                <Image
                  src={photoPreview}
                  alt="Produce preview"
                  fill
                  className="object-cover"
                />
                <label className="absolute bottom-3 right-3 px-3 py-1.5 bg-forest text-parchment text-xs font-semibold rounded-md shadow-subtle cursor-pointer hover:bg-forest-hover">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-8">
                <div className="w-14 h-14 rounded-full bg-forest-light text-forest flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-charcoal">
                  Snap or select a photo of your harvest
                </p>
                <p className="text-xs text-charcoal-muted mt-1">
                  JPG, PNG, or WebP. Auto-compressed for fast loading.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-charcoal mb-1.5">
            Produce Title <span className="text-terracotta">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sweet Roma Tomatoes (Firm & Ripe)"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-white text-sm text-charcoal focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-all"
          />
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold text-charcoal mb-2">
            Category <span className="text-terracotta">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                  category === cat.id
                    ? "border-forest bg-forest text-parchment font-semibold shadow-subtle"
                    : "border-hairline bg-white text-charcoal hover:bg-parchment-soft"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price & Unit Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-charcoal mb-1.5">
              Price (₦ Naira) <span className="text-terracotta">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-charcoal-muted">
                ₦
              </span>
              <input
                type="number"
                min="100"
                step="50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4,500"
                required
                className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-hairline bg-white text-sm text-charcoal focus:border-forest outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal mb-1.5">
              Selling Unit <span className="text-terracotta">*</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ListingUnit)}
              className="w-full px-3 py-2.5 rounded-lg border border-hairline bg-white text-sm text-charcoal focus:border-forest outline-none transition-all capitalize"
            >
              <option value="crate">Per Crate</option>
              <option value="bag">Per Bag</option>
              <option value="bunch">Per Bunch</option>
              <option value="kg">Per Kilogram (kg)</option>
              <option value="piece">Per Piece / Tuber</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal mb-1.5">
              Quantity Available <span className="text-terracotta">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-white text-sm text-charcoal focus:border-forest outline-none transition-all"
            />
          </div>
        </div>

        {/* Farm Location Picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-charcoal">
              Farm Location (for nearby radius calculation)
            </label>
            {isDetectingLocation && (
              <span className="text-[11px] text-forest animate-pulse">
                Detecting GPS coordinates...
              </span>
            )}
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-forest absolute left-3 top-3" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Epe Farm Settlement, Lagos"
              required
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-hairline bg-white text-sm text-charcoal focus:border-forest outline-none transition-all"
            />
          </div>

          {/* Quick Area presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[11px] text-charcoal-muted self-center">Quick pick:</span>
            {APP_CONFIG.geo.locations.slice(0, 4).map((area) => (
              <button
                key={area.name}
                type="button"
                onClick={() => {
                  setLocationName(area.name);
                  setLat(area.lat);
                  setLng(area.lng);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  locationName === area.name
                    ? "bg-forest-light border-forest text-forest font-semibold"
                    : "bg-white border-hairline text-charcoal-muted hover:text-charcoal"
                }`}
              >
                {area.name.split(",")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-charcoal mb-1.5">
            Description / Harvest Notes
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell buyers about freshness, harvest date, sweet flavour or farm origin..."
            className="w-full p-3 rounded-lg border border-hairline bg-white text-sm text-charcoal focus:border-forest outline-none transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-forest hover:bg-forest-hover text-parchment font-semibold text-base transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <span>Publishing Produce to Marketplace...</span>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-ochre" />
              <span>Publish Produce (Under 30s)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
