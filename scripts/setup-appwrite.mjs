#!/usr/bin/env node
import { Client, Databases, Storage, Permission, Role } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "oja_marketplace_db";
const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "oja_produce_photos";

if (!projectId || !apiKey) {
  console.error("❌ Error: NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY must be set.");
  console.error("Please configure them in your .env.local file.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAttribute(databaseId, collectionId, attributeKey, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const attr = await databases.getAttribute(databaseId, collectionId, attributeKey);
      if (attr.status === "available") {
        return true;
      }
      if (attr.status === "failed") {
        throw new Error(`Attribute ${attributeKey} creation failed: ${attr.error || "unknown"}`);
      }
    } catch (e) {
      // ignore while creating
    }
    await sleep(1000);
  }
  return false;
}

async function ensureDatabase() {
  console.log(`📦 Ensuring database '${databaseId}' exists...`);
  try {
    await databases.get(databaseId);
    console.log(`✓ Database '${databaseId}' already exists.`);
  } catch (err) {
    if (err.code === 404) {
      await databases.create(databaseId, "Ọjà Marketplace Database");
      console.log(`✓ Created database '${databaseId}'.`);
    } else {
      throw err;
    }
  }
}

async function ensureBucket() {
  console.log(`🖼️  Ensuring storage bucket '${bucketId}' exists...`);
  try {
    await storage.getBucket(bucketId);
    console.log(`✓ Storage bucket '${bucketId}' already exists.`);
  } catch (err) {
    if (err.code === 404) {
      await storage.createBucket(
        bucketId,
        "Ọjà Produce Photography",
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ],
        false, // fileSecurity
        true, // enabled
        10 * 1024 * 1024, // 10MB max
        ["jpg", "jpeg", "png", "webp"]
      );
      console.log(`✓ Created storage bucket '${bucketId}'.`);
    } else {
      throw err;
    }
  }
}

async function ensureCollection(colId, name, permissions = []) {
  console.log(`\n📋 Ensuring collection '${colId}'...`);
  try {
    await databases.getCollection(databaseId, colId);
    console.log(`✓ Collection '${colId}' already exists.`);
  } catch (err) {
    if (err.code === 404) {
      await databases.createCollection(
        databaseId,
        colId,
        name,
        permissions,
        true // documentSecurity enabled
      );
      console.log(`✓ Created collection '${colId}'.`);
    } else {
      throw err;
    }
  }
}

async function ensureStringAttribute(colId, key, size, required = true, array = false, defaultVal = undefined) {
  try {
    await databases.createStringAttribute(databaseId, colId, key, size, required, defaultVal, array);
    console.log(`  + String attr '${key}' requested`);
  } catch (err) {
    if (err.code !== 409) console.warn(`  ! String attr '${key}': ${err.message}`);
  }
}

async function ensureFloatAttribute(colId, key, required = true, min = null, max = null, defaultVal = null) {
  try {
    await databases.createFloatAttribute(databaseId, colId, key, required, min, max, defaultVal);
    console.log(`  + Float attr '${key}' requested`);
  } catch (err) {
    if (err.code !== 409) console.warn(`  ! Float attr '${key}': ${err.message}`);
  }
}

async function ensureIntegerAttribute(colId, key, required = true, min = null, max = null, defaultVal = null) {
  try {
    await databases.createIntegerAttribute(databaseId, colId, key, required, min, max, defaultVal);
    console.log(`  + Integer attr '${key}' requested`);
  } catch (err) {
    if (err.code !== 409) console.warn(`  ! Integer attr '${key}': ${err.message}`);
  }
}

async function ensureIndex(colId, key, type, attributes, orders = ["ASC"]) {
  try {
    await databases.createIndex(databaseId, colId, key, type, attributes, orders);
    console.log(`  + Index '${key}' created`);
  } catch (err) {
    if (err.code !== 409) console.warn(`  ! Index '${key}': ${err.message}`);
  }
}

async function setupSchema() {
  await ensureDatabase();
  await ensureBucket();

  // 1. PROFILES
  await ensureCollection("profiles", "Profiles", [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
  ]);
  await ensureStringAttribute("profiles", "userId", 64, true);
  await ensureStringAttribute("profiles", "name", 100, true);
  await ensureStringAttribute("profiles", "phone", 32, true);
  await ensureStringAttribute("profiles", "role", 16, true);
  await ensureStringAttribute("profiles", "avatarId", 64, false);
  await ensureFloatAttribute("profiles", "lat", true);
  await ensureFloatAttribute("profiles", "lng", true);
  await ensureStringAttribute("profiles", "geohash", 12, true);
  await ensureStringAttribute("profiles", "areaName", 128, true);
  await ensureStringAttribute("profiles", "createdAt", 32, true);

  console.log("  ⏳ Waiting for profiles attributes to index...");
  await waitForAttribute(databaseId, "profiles", "userId");
  await waitForAttribute(databaseId, "profiles", "geohash");
  await waitForAttribute(databaseId, "profiles", "createdAt");

  await ensureIndex("profiles", "idx_profiles_userId", "unique", ["userId"]);
  await ensureIndex("profiles", "idx_profiles_geohash", "key", ["geohash"]);
  await ensureIndex("profiles", "idx_profiles_createdAt", "key", ["createdAt"], ["DESC"]);

  // 2. LISTINGS
  await ensureCollection("listings", "Listings", [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ]);
  await ensureStringAttribute("listings", "sellerId", 64, true);
  await ensureStringAttribute("listings", "title", 100, true);
  await ensureStringAttribute("listings", "category", 32, true);
  await ensureStringAttribute("listings", "description", 1000, true);
  await ensureFloatAttribute("listings", "price", true);
  await ensureStringAttribute("listings", "unit", 16, true);
  await ensureIntegerAttribute("listings", "quantityAvailable", true);
  await ensureStringAttribute("listings", "photoIds", 64, true, true);
  await ensureFloatAttribute("listings", "lat", true);
  await ensureFloatAttribute("listings", "lng", true);
  await ensureStringAttribute("listings", "geohash", 12, true);
  await ensureStringAttribute("listings", "areaName", 128, false);
  await ensureStringAttribute("listings", "status", 16, true);
  await ensureStringAttribute("listings", "createdAt", 32, true);

  console.log("  ⏳ Waiting for listings attributes to index...");
  await waitForAttribute(databaseId, "listings", "sellerId");
  await waitForAttribute(databaseId, "listings", "geohash");
  await waitForAttribute(databaseId, "listings", "status");
  await waitForAttribute(databaseId, "listings", "category");
  await waitForAttribute(databaseId, "listings", "createdAt");

  await ensureIndex("listings", "idx_listings_sellerId", "key", ["sellerId"]);
  await ensureIndex("listings", "idx_listings_geohash", "key", ["geohash"]);
  await ensureIndex("listings", "idx_listings_status", "key", ["status"]);
  await ensureIndex("listings", "idx_listings_category", "key", ["category"]);
  await ensureIndex("listings", "idx_listings_createdAt", "key", ["createdAt"], ["DESC"]);

  // 3. ORDERS
  await ensureCollection("orders", "Orders", [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
  ]);
  await ensureStringAttribute("orders", "buyerId", 64, true);
  await ensureStringAttribute("orders", "sellerId", 64, true);
  await ensureStringAttribute("orders", "status", 24, true);
  await ensureStringAttribute("orders", "paymentMethod", 24, true);
  await ensureStringAttribute("orders", "paymentStatus", 16, true);
  await ensureStringAttribute("orders", "deliveryAddress", 300, true);
  await ensureFloatAttribute("orders", "deliveryLat", true);
  await ensureFloatAttribute("orders", "deliveryLng", true);
  await ensureStringAttribute("orders", "buyerNote", 400, false);
  await ensureFloatAttribute("orders", "total", true);
  await ensureStringAttribute("orders", "paystackReference", 64, false);
  await ensureStringAttribute("orders", "createdAt", 32, true);

  console.log("  ⏳ Waiting for orders attributes to index...");
  await waitForAttribute(databaseId, "orders", "buyerId");
  await waitForAttribute(databaseId, "orders", "sellerId");
  await waitForAttribute(databaseId, "orders", "status");
  await waitForAttribute(databaseId, "orders", "createdAt");

  await ensureIndex("orders", "idx_orders_buyerId", "key", ["buyerId"]);
  await ensureIndex("orders", "idx_orders_sellerId", "key", ["sellerId"]);
  await ensureIndex("orders", "idx_orders_status", "key", ["status"]);
  await ensureIndex("orders", "idx_orders_createdAt", "key", ["createdAt"], ["DESC"]);

  // 4. ORDER ITEMS
  await ensureCollection("order_items", "Order Items", [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
  ]);
  await ensureStringAttribute("order_items", "orderId", 64, true);
  await ensureStringAttribute("order_items", "listingId", 64, true);
  await ensureStringAttribute("order_items", "titleSnapshot", 100, true);
  await ensureIntegerAttribute("order_items", "qty", true);
  await ensureFloatAttribute("order_items", "unitPriceSnapshot", true);
  await ensureStringAttribute("order_items", "unitSnapshot", 16, false);

  console.log("  ⏳ Waiting for order_items attributes to index...");
  await waitForAttribute(databaseId, "order_items", "orderId");
  await waitForAttribute(databaseId, "order_items", "listingId");

  await ensureIndex("order_items", "idx_order_items_orderId", "key", ["orderId"]);
  await ensureIndex("order_items", "idx_order_items_listingId", "key", ["listingId"]);

  // 5. REVIEWS
  await ensureCollection("reviews", "Reviews", [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
  ]);
  await ensureStringAttribute("reviews", "orderId", 64, true);
  await ensureStringAttribute("reviews", "sellerId", 64, true);
  await ensureStringAttribute("reviews", "buyerId", 64, true);
  await ensureStringAttribute("reviews", "buyerName", 100, false);
  await ensureIntegerAttribute("reviews", "rating", true);
  await ensureStringAttribute("reviews", "comment", 500, true);
  await ensureStringAttribute("reviews", "createdAt", 32, true);

  console.log("  ⏳ Waiting for reviews attributes to index...");
  await waitForAttribute(databaseId, "reviews", "orderId");
  await waitForAttribute(databaseId, "reviews", "sellerId");
  await waitForAttribute(databaseId, "reviews", "createdAt");

  await ensureIndex("reviews", "idx_reviews_orderId", "unique", ["orderId"]);
  await ensureIndex("reviews", "idx_reviews_sellerId", "key", ["sellerId"]);
  await ensureIndex("reviews", "idx_reviews_createdAt", "key", ["createdAt"], ["DESC"]);

  console.log("\n✅ All Ọjà collections, attributes, indexes and storage bucket successfully provisioned!");
}

setupSchema().catch((err) => {
  console.error("❌ Schema setup failed:", err);
  process.exit(1);
});
