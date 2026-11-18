# Ọjà — Hyperlocal Farm Produce Marketplace

Ọjà is a production-grade, mobile-first hyperlocal marketplace connecting local farmers and produce growers with nearby buyers. Produce is harvested to order and delivered directly by the grower to the buyer's doorstep.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Appwrite**, and **Paystack**.

---

## Features

- **Hyperlocal Discovery**: Geohash precision 6 indexing with 8-neighbor cell lookup and spherical Haversine distance calculations. Formatted distances (`2.4 km away`) ensure farmer privacy until order acceptance.
- **Dual Discovery Modes**: "Nearby" tab (sorted by distance within chosen radius) and "All" tab (chronological feed, newest first).
- **Graceful Location Fallback**: Instant fallback to manual neighbourhood picker if browser geolocation permission is denied.
- **Fast 30-Second Listing**: Take/pick photo, set price, quantity, and auto-detect farmland GPS coordinates. Photos are compressed client-side to WebP to save mobile data.
- **Authoritative Server Checkout**: Cart items are split into **one order per farmer**. Prices and stock levels are recomputed on the server from the database. Client price spoofing is strictly prevented.
- **Realtime Status Timeline**: 4-stage live tracking: `pending` → `accepted` → `out_for_delivery` → `completed`.
- **Payment Options**: "Pay on delivery" (cash or transfer on arrival) and "Pay now" via Paystack (verified with HMAC SHA512 webhooks).
- **Direct Farmer Messaging**: One-tap "Chat on WhatsApp" with prefilled order inquiry text.
- **Multilingual Support (i18n)**: English (default), Yorùbá, Hausa, and Nigerian Pidgin.
- **Installable PWA**: Offline caching, service worker shell, and mobile touch targets (44px+).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend** | Appwrite (Auth, Databases, Storage, Realtime) |
| **State & Fetching** | TanStack React Query v5 |
| **Validation** | Zod (on every client form and server API route) |
| **Payments** | Paystack (with signature-verified webhooks) |
| **Icons & Typography** | Lucide Icons, Fraunces (Serif) & DM Sans (Humanist Sans) |
| **Testing** | Vitest (Unit & End-to-End order flow) |

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### 2. Installation
```bash
# Clone the repository and navigate into folder
git clone <repo-url>
cd oja-marketplace

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials:
```env
# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=oja_marketplace_db
NEXT_PUBLIC_APPWRITE_BUCKET_ID=oja_produce_photos
APPWRITE_API_KEY=your_server_appwrite_api_key

# Paystack (Optional: If omitted, "Pay now" is hidden and Pay on Delivery is used)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx

# App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Demo Mode (Set to true to test the app without live Appwrite connectivity)
NEXT_PUBLIC_DEMO_MODE=false
```

---

## Appwrite Backend Setup

The project includes an idempotent provisioning script that creates all databases, collections, attributes, indexes, and storage buckets automatically:

### 1. Provision Backend Schema
```bash
npm run setup:appwrite
```
This script provisions:
- **`profiles`**: `userId` (unique), `name`, `phone`, `role`, `lat`, `lng`, `geohash`, `areaName`.
- **`listings`**: `sellerId`, `title`, `category`, `description`, `price`, `unit`, `quantityAvailable`, `photoIds[]`, `lat`, `lng`, `geohash`, `status`.
- **`orders`**: `buyerId`, `sellerId`, `status`, `paymentMethod`, `paymentStatus`, `deliveryAddress`, `total`.
- **`order_items`**: `orderId`, `listingId`, `titleSnapshot`, `qty`, `unitPriceSnapshot`.
- **`reviews`**: `orderId`, `sellerId`, `buyerId`, `rating`, `comment`.
- **Storage Bucket**: `oja_produce_photos` (10MB max, WebP/JPG/PNG).

### 2. Seed Realistic Produce & Farmers
```bash
npm run seed:appwrite
```
Seeds realistic Nigerian farms and fresh produce:
- Baba Alabi Organic Farm (Epe Greenhouse Tomatoes, Ata Rodo Peppers)
- Ngozi Fresh Greenery (Sangotedo Cut Ugu Leaves, Plantain Bunches)
- Bello & Sons Produce Depot (Mile 12 Abakaliki New Yams, Oloyin Honey Beans, Ijebu Garri)
- Folake Agro Ventures (Ikorodu Nsukka Red Palm Oil, Brown Farm Eggs, Kiln-Smoked Catfish)

---

## Running the Application

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Unit and End-to-End Tests
```bash
npm run test
```
Runs 11 automated test suites covering:
- Haversine distance accuracy and safe rounding
- Geohash base32 encoding and 8-neighbor cell retrieval
- Cart splitting partitioned by farmer
- Anti-fraud Pay on Delivery limit validation
- End-to-end multi-seller order lifecycle and Paystack webhook verification

### Production Build
```bash
npm run build
npm start
```

---

## Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
   - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
   - `NEXT_PUBLIC_APPWRITE_BUCKET_ID`
   - `APPWRITE_API_KEY`
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL, e.g. `https://oja.vercel.app`)
   - `NEXT_PUBLIC_DEMO_MODE=false`
4. Click **Deploy**. Vercel will build and deploy the Next.js application.

---

## Paystack Webhook Configuration

1. In your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer), navigate to **Settings > API Keys & Webhooks**.
2. Under **Live/Test Webhook URL**, enter:
   ```
   https://your-domain.vercel.app/api/payments/paystack/webhook
   ```
3. Save changes. When buyers pay online, Paystack dispatches a signed `charge.success` event, which Ọjà verifies via HMAC SHA512 and idempotently marks matching orders as `paid`.

---

## Security Checklist

- [x] Appwrite API key restricted strictly to server runtime (`APPWRITE_API_KEY`), never exposed to browser bundles.
- [x] Server-side price recalculation: client prices are never trusted.
- [x] Atomic stock validation to eliminate overselling under concurrent checkouts.
- [x] Strict document security permissions on all Appwrite collections.
- [x] Paystack webhook signature verification (HMAC SHA512).
- [x] Client-side image validation and WebP compression before upload.
- [x] Full HTTP security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy).
- [x] Zod validation on every input payload.
- [x] Offline fallback with Service Worker PWA support.
