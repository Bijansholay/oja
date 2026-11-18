import { Listing, ListingCategory, ListingUnit, ListingStatus } from "@/lib/types";
import { databases, storage } from "@/lib/appwrite/client";
import { DATABASE_ID, BUCKET_ID, COLLECTIONS, APPWRITE_PROJECT_ID } from "@/lib/appwrite/constants";
import { encodeGeohash } from "@/lib/geo/geohash";
import { DEMO_LISTINGS } from "@/lib/demo/store";
import { APP_CONFIG } from "@/lib/config";
import { ID, Query } from "appwrite";

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !APPWRITE_PROJECT_ID;

// In-memory demo store mutations
let dynamicListings = [...DEMO_LISTINGS];

export async function uploadProducePhoto(file: File): Promise<string> {
  if (isDemo) {
    // In demo mode, convert to persistent local Object URL or data URI
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
  return uploaded.$id;
}

export interface CreateListingInput {
  title: string;
  category: ListingCategory;
  description: string;
  price: number;
  unit: ListingUnit;
  quantityAvailable: number;
  photoIds: string[];
  lat: number;
  lng: number;
  areaName?: string;
}

export async function createProduceListing(
  input: CreateListingInput,
  sellerId: string,
  sellerName: string
): Promise<Listing> {
  const geohash = encodeGeohash(input.lat, input.lng, APP_CONFIG.geo.geohashPrecision);
  const now = new Date().toISOString();

  if (isDemo) {
    const newListing: Listing = {
      $id: "listing_user_" + Date.now(),
      sellerId,
      sellerName,
      title: input.title,
      category: input.category,
      description: input.description,
      price: input.price,
      unit: input.unit,
      quantityAvailable: input.quantityAvailable,
      photoIds: input.photoIds,
      lat: input.lat,
      lng: input.lng,
      geohash,
      areaName: input.areaName || APP_CONFIG.geo.defaultAreaName,
      status: "active",
      createdAt: now,
    };
    dynamicListings.unshift(newListing);
    return newListing;
  }

  const payload = {
    sellerId,
    title: input.title,
    category: input.category,
    description: input.description,
    price: input.price,
    unit: input.unit,
    quantityAvailable: input.quantityAvailable,
    photoIds: input.photoIds,
    lat: input.lat,
    lng: input.lng,
    geohash,
    areaName: input.areaName || "",
    status: "active",
    createdAt: now,
  };

  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.LISTINGS,
    ID.unique(),
    payload
  );

  return doc as unknown as Listing;
}

export async function updateProduceListing(
  listingId: string,
  updates: Partial<CreateListingInput & { status: ListingStatus }>
): Promise<Listing> {
  if (isDemo) {
    const idx = dynamicListings.findIndex((l) => l.$id === listingId);
    if (idx === -1) throw new Error("Listing not found");

    const updated = {
      ...dynamicListings[idx],
      ...updates,
      geohash:
        updates.lat && updates.lng
          ? encodeGeohash(updates.lat, updates.lng, APP_CONFIG.geo.geohashPrecision)
          : dynamicListings[idx].geohash,
    };
    dynamicListings[idx] = updated;
    return updated;
  }

  const payload: Record<string, any> = { ...updates };
  if (updates.lat && updates.lng) {
    payload.geohash = encodeGeohash(updates.lat, updates.lng, APP_CONFIG.geo.geohashPrecision);
  }

  const doc = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.LISTINGS,
    listingId,
    payload
  );

  return doc as unknown as Listing;
}

export async function getSellerListings(sellerId: string): Promise<Listing[]> {
  if (isDemo) {
    return dynamicListings.filter((l) => l.sellerId === sellerId);
  }

  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.LISTINGS, [
    Query.equal("sellerId", sellerId),
    Query.orderDesc("createdAt"),
  ]);

  return res.documents as unknown as Listing[];
}

export async function getListingById(listingId: string): Promise<Listing | null> {
  if (isDemo) {
    const found = dynamicListings.find((l) => l.$id === listingId);
    return found || null;
  }

  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.LISTINGS,
      listingId
    );
    return doc as unknown as Listing;
  } catch {
    return null;
  }
}
