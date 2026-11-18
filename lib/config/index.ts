import { DEFAULT_REGION_LOCATIONS } from "./locations";

export const APP_CONFIG = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "Ọjà",
    tagline: "Hyperlocal farm produce directly from growers nearby",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    isDemoMode:
      process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
      !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  },

  currency: {
    code: process.env.NEXT_PUBLIC_CURRENCY_CODE || "NGN",
    symbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₦",
    locale: "en-NG",
  },

  geo: {
    defaultLat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || "6.4281"),
    defaultLng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || "3.4219"),
    defaultAreaName:
      process.env.NEXT_PUBLIC_DEFAULT_AREA_NAME || "Victoria Island & Ikoyi, Lagos",
    defaultRadiusKm: parseInt(process.env.NEXT_PUBLIC_DEFAULT_RADIUS_KM || "25", 10),
    supportedRadiiKm: [5, 15, 25, 50, 100],
    geohashPrecision: 6, // ~1.2 km x 0.6 km bounding cell
    fallbackPrecisionForRadius: (radiusKm: number) => {
      if (radiusKm <= 3) return 6;
      if (radiusKm <= 15) return 5;
      if (radiusKm <= 60) return 4;
      return 3;
    },
    locations: DEFAULT_REGION_LOCATIONS,
  },

  orders: {
    // Maximum order limit for first-time buyers on Pay on Delivery to prevent fake orders
    maxFirstTimePodLimitNaira: parseInt(
      process.env.ORDER_MAX_POD_LIMIT_NAIRA ||
        process.env.NEXT_PUBLIC_ORDER_MAX_POD_LIMIT_NAIRA ||
        "35000",
      10
    ),
    defaultMinQuantity: 1,
    maxListingPriceNaira: 5000000,
    maxDescriptionLength: 1000,
  },

  media: {
    maxPhotoSizeBytes: 8 * 1024 * 1024, // 8MB
    maxPhotoDimensionPx: 1600,
    compressionQuality: 0.82,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/jpg"],
    defaultPlaceholderPath: "/images/produce/placeholder.svg",
  },

  appwrite: {
    endpoint:
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
    databaseId:
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "oja_marketplace_db",
    bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "oja_produce_photos",
    feedPageLimit: parseInt(process.env.NEXT_PUBLIC_FEED_PAGE_LIMIT || "50", 10),
  },

  payments: {
    paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
  },
} as const;

export * from "./locations";
