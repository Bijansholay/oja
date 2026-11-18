export const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";

export const APPWRITE_PROJECT_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

export const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "oja_marketplace_db";

export const BUCKET_ID =
  process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "oja_produce_photos";

export const COLLECTIONS = {
  PROFILES: "profiles",
  LISTINGS: "listings",
  ORDERS: "orders",
  ORDER_ITEMS: "order_items",
  REVIEWS: "reviews",
} as const;
