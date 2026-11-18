#!/usr/bin/env node
import { Client, Databases, ID, Permission, Role } from "node-appwrite";
import { encodeGeohash } from "../lib/geo/geohash.js";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "oja_marketplace_db";

if (!projectId || !apiKey) {
  console.error("❌ NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY required.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

const SELLERS = [
  {
    userId: "seller_baba_alabi",
    name: "Alabi Organic Farm",
    phone: "+2348031234501",
    role: "seller",
    areaName: "Epe / Ketu-Epe Expressway, Lagos",
    lat: 6.5841,
    lng: 3.9832,
  },
  {
    userId: "seller_mama_ngozi",
    name: "Ngozi Fresh Greenery",
    phone: "+2348029876543",
    role: "seller",
    areaName: "Ajah / Sangotedo Farm Settlement, Lagos",
    lat: 6.4682,
    lng: 3.6198,
  },
  {
    userId: "seller_mallam_bello",
    name: "Bello & Sons Produce Depot",
    phone: "+2348145558912",
    role: "seller",
    areaName: "Mile 12 Produce Market, Lagos",
    lat: 6.6114,
    lng: 3.3982,
  },
  {
    userId: "seller_folake_acres",
    name: "Folake Agro Ventures",
    phone: "+2348057771234",
    role: "seller",
    areaName: "Agric / Ikorodu Farms, Lagos",
    lat: 6.6152,
    lng: 3.5104,
  },
];

const SEED_PRODUCE = [
  {
    sellerIndex: 0,
    title: "Fresh Roma Tomatoes (Firm & Ripe)",
    category: "vegetables_greens",
    description: "Harvested this dawn from our greenhouse in Epe. Sweet, dense flesh, firm skin, ideal for hearty stews, jollof rice, and paste without high acidity.",
    price: 14500,
    unit: "crate",
    quantityAvailable: 18,
    photoIds: ["photo_tomatoes_1"],
    areaName: "Epe, Lagos",
  },
  {
    sellerIndex: 0,
    title: "Scotch Bonnet Peppers (Ata Rodo Extra Hot)",
    category: "peppers_spices",
    description: "Extremely fragrant, vibrant red and orange rodo peppers. High capsicum heat with that distinct traditional aroma.",
    price: 4500,
    unit: "bag",
    quantityAvailable: 25,
    photoIds: ["photo_rodo_1"],
    areaName: "Epe, Lagos",
  },
  {
    sellerIndex: 1,
    title: "Fresh Cut Ugu (Fluted Pumpkin) Leaves",
    category: "vegetables_greens",
    description: "Cut fresh upon order. Tender, dark green leaves cultivated with zero artificial pesticides along the Sangotedo wetland belt.",
    price: 1200,
    unit: "bunch",
    quantityAvailable: 40,
    photoIds: ["photo_ugu_1"],
    areaName: "Sangotedo, Lagos",
  },
  {
    sellerIndex: 1,
    title: "Unripe & Semi-Ripe Plantains",
    category: "fruits",
    description: "Naturally ripened or green cooking plantain bunches from organic groves. Perfect for dodo, bole, or diabetic-friendly unripe flour porridge.",
    price: 3800,
    unit: "bunch",
    quantityAvailable: 15,
    photoIds: ["photo_plantain_1"],
    areaName: "Sangotedo, Lagos",
  },
  {
    sellerIndex: 2,
    title: "Abakaliki New Yams (Medium/Large Tubers)",
    category: "tubers_roots",
    description: "Straight from eastern farmlands. High starch content, clean dry skin, pounded yam texture is silky and lump-free.",
    price: 8500,
    unit: "piece",
    quantityAvailable: 35,
    photoIds: ["photo_yam_1"],
    areaName: "Mile 12, Lagos",
  },
  {
    sellerIndex: 2,
    title: "Oloyin Sweet Honey Beans (Cleaned & Weevil-Free)",
    category: "grains_staples",
    description: "Properly winnowed brown honey beans. Naturally sweet, fast cooking, stone-free and zero chemical preservatives.",
    price: 16500,
    unit: "bag",
    quantityAvailable: 12,
    photoIds: ["photo_beans_1"],
    areaName: "Mile 12, Lagos",
  },
  {
    sellerIndex: 2,
    title: "Crispy White Ijebu Garri",
    category: "grains_staples",
    description: "Properly fermented 3-day cassava grain. Sharp, pleasant sour bite, very dry and swells to triple its volume in cold water.",
    price: 5500,
    unit: "bag",
    quantityAvailable: 30,
    photoIds: ["photo_garri_1"],
    areaName: "Mile 12, Lagos",
  },
  {
    sellerIndex: 3,
    title: "Organic Red Palm Oil (Nsukka Traditional)",
    category: "oils_fats",
    description: "First-press unadulterated red oil. Thick, deep ruby red, aromatic nutty scent, zero dye, zero sediment.",
    price: 8800,
    unit: "crate",
    quantityAvailable: 10,
    photoIds: ["photo_palmoil_1"],
    areaName: "Ikorodu, Lagos",
  },
  {
    sellerIndex: 3,
    title: "Jumbo Farm Brown Eggs (Golden Yolks)",
    category: "poultry_eggs",
    description: "Free-range pasture-fed layers. Sturdy shells, deep orange-yellow yolks rich in omega nutrients.",
    price: 4900,
    unit: "crate",
    quantityAvailable: 50,
    photoIds: ["photo_eggs_1"],
    areaName: "Ikorodu, Lagos",
  },
  {
    sellerIndex: 3,
    title: "Oven-Kiln Smoked Catfish (Bone-In, Sand-Free)",
    category: "livestock_fish",
    description: "Smoked over mahogany and charcoal for 16 hours. Crisp skin, tender sweet aromatic flesh with zero bitter soot.",
    price: 5200,
    unit: "piece",
    quantityAvailable: 22,
    photoIds: ["photo_catfish_1"],
    areaName: "Ikorodu, Lagos",
  },
];

async function seed() {
  console.log("🌱 Seeding Ọjà Marketplace with realistic farmers and produce...\n");

  for (const seller of SELLERS) {
    const geohash = encodeGeohash(seller.lat, seller.lng, 6);
    try {
      await databases.createDocument(
        databaseId,
        "profiles",
        seller.userId,
        {
          userId: seller.userId,
          name: seller.name,
          phone: seller.phone,
          role: seller.role,
          lat: seller.lat,
          lng: seller.lng,
          geohash,
          areaName: seller.areaName,
          createdAt: new Date().toISOString(),
        },
        [Permission.read(Role.any()), Permission.update(Role.user(seller.userId))]
      );
      console.log(`✓ Seeded profile: ${seller.name} (${seller.areaName})`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`- Profile ${seller.name} already seeded.`);
      } else {
        console.warn(`! Profile ${seller.name}: ${err.message}`);
      }
    }
  }

  for (let i = 0; i < SEED_PRODUCE.length; i++) {
    const item = SEED_PRODUCE[i];
    const seller = SELLERS[item.sellerIndex];
    const docId = `listing_seed_${i + 1}`;
    const geohash = encodeGeohash(seller.lat, seller.lng, 6);

    try {
      await databases.createDocument(
        databaseId,
        "listings",
        docId,
        {
          sellerId: seller.userId,
          title: item.title,
          category: item.category,
          description: item.description,
          price: item.price,
          unit: item.unit,
          quantityAvailable: item.quantityAvailable,
          photoIds: item.photoIds,
          lat: seller.lat,
          lng: seller.lng,
          geohash,
          areaName: item.areaName,
          status: "active",
          createdAt: new Date(Date.now() - (i * 3600000)).toISOString(),
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(seller.userId)),
          Permission.delete(Role.user(seller.userId)),
        ]
      );
      console.log(`✓ Seeded listing: ${item.title} (₦${item.price.toLocaleString()} / ${item.unit})`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`- Listing ${item.title} already exists.`);
      } else {
        console.warn(`! Listing ${item.title}: ${err.message}`);
      }
    }
  }

  console.log("\n🎉 Seeding completed successfully!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
