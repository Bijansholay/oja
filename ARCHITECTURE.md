# Ọjà Architecture & System Design Decisions

## 1. Domain Overview
**Ọjà** is a hyperlocal agricultural marketplace connecting smallholder farmers and food producers with nearby buyers. The product solves three critical friction points in food systems:
1. **Producer Margins**: Traditional food supply chains in emerging markets involve 3-5 intermediaries, degrading farmer income and increasing food miles.
2. **Freshness & Speed**: Produce is harvested to order and delivered directly by growers, cutting transit times from days to hours.
3. **Hyperlocal Discoverability**: Buyers discover what is being harvested *within their actual neighbourhood or radius*, rather than generic national listings.

---

## 2. Layered Codebase Architecture
The codebase strictly adheres to a domain-driven, layered architecture where business logic is isolated from presentation components:

```
├── app/                           # Next.js App Router (pages & server routes)
│   ├── api/orders/checkout/       # Server checkout & atomic cart split
│   ├── api/payments/paystack/     # Paystack webhook verification
│   ├── checkout/                  # Split checkout screen
│   ├── listings/[id]/             # Produce detail screen
│   ├── orders/                    # Buyer orders & realtime tracking
│   ├── seller/                    # Farmer dashboard & inventory management
│   └── seller/new/                # <30s produce posting flow
├── components/                    # Reusable, accessible UI components
│   ├── auth/                      # Phone & Email OTP modal with demo switcher
│   ├── cart/                      # Grouped basket slide-over drawer
│   └── layout/                    # Responsive navbar & 44px+ mobile bottom nav
├── features/                      # Domain feature modules
│   ├── auth/                      # AuthContext & session management
│   ├── cart/                      # CartContext & multi-seller state
│   └── listings/                  # Feed, card, area picker, and form logic
├── lib/                           # Core utilities and abstractions
│   ├── appwrite/                  # Client & Server (admin) SDK connectors
│   ├── demo/                      # In-memory realistic seed repository
│   ├── geo/                       # Geohashing & Haversine distance engine
│   ├── i18n/                      # English, Yorùbá, Hausa, & Pidgin translations
│   ├── media/                     # Client-side image validation & WebP compression
│   ├── notifications/             # WhatsApp deep link & notification provider
│   ├── orders/                    # Multi-farmer cart splitting & POD limits
│   ├── payments/                  # PaymentProvider abstraction (Paystack)
│   └── validation/                # Zod schemas for all server inputs
└── scripts/                       # Setup & seed scripts
    ├── setup-appwrite.mjs         # One-command idempotent schema provisioning
    └── seed-appwrite.mjs          # Realistic Nigerian agricultural seed data
```

---

## 3. Key Design Decisions

### 3.1 Hyperlocal Geohash & Haversine Distance Engine
- **Spatial Indexing**: Every listing and user profile stores `lat`, `lng`, and an encoded `geohash` at **precision 6** (~1.2 km x 0.6 km bounding cell).
- **Neighbor Cells**: To prevent boundary cutoff (where a farm across a street falls into an adjacent cell), queries retrieve the target cell plus its **8 cardinal and diagonal neighbors** (9 cells total).
- **Graceful Radius Widening**: If nearby results are sparse, the algorithm dynamically widens the search radius (precision 5 = ~5 km, precision 4 = ~39 km) before falling back to all harvests.
- **Privacy Protection**: Exact seller GPS coordinates are **never exposed to buyers**. Distance is computed using the spherical Haversine formula and formatted into rounded human bands (`2.4 km away`, `Nearby (< 500 m)`). The buyer's delivery destination is only revealed to the farmer once an order has been accepted.
- **Pluggable Interface**: The geo system is wrapped behind a `SpatialQueryStrategy` interface, allowing a seamless swap to PostgreSQL PostGIS or native Appwrite spatial queries without touching UI code.

### 3.2 Authoritative Checkout & Cart Splitting per Farmer
- **Zero Client Price Trust**: The client cart submits only `listingId` and `qty`. The checkout endpoint (`/api/orders/checkout`) re-fetches authoritative prices and stock levels directly from the database. Any spoofed client price is ignored.
- **Stock Decrement**: Available quantities are decremented on the server during order creation to prevent overselling under concurrent requests.
- **One Order per Farmer**: Because each grower delivers their own produce, a cart containing items from multiple farmers is partitioned by `sellerId` into separate orders at checkout. Each farmer receives an independent order record, packing list, and delivery timeline.
- **Anti-Fraud POD Protection**: For "Pay on Delivery" orders, new buyers are capped at ₦35,000 to mitigate uncollected perishable farm goods.

### 3.3 Payment Provider Abstraction
- Payment handling is designed behind the `PaymentProvider` interface:
  - `initializePayment()`
  - `verifyTransaction()`
  - `verifyWebhookSignature()`
- **Paystack Implementation**: Webhook requests are verified using HMAC SHA512 signatures (`x-paystack-signature`). Orders are updated idempotently (`unpaid` -> `paid`). Client-side payment confirmations are never trusted for order fulfillment.
- **Dynamic Feature Flag**: If `PAYSTACK_SECRET_KEY` is not configured, the UI automatically hides "Pay now" and presents Pay on Delivery as the active payment method.

### 3.4 Security Hardening
- **Server-Only Secrets**: The `APPWRITE_API_KEY` and `PAYSTACK_SECRET_KEY` exist solely in server-side environment variables and are never bundled into client JS.
- **Document-Level Security**:
  - Listings: readable by `Role.any()`, writable/deletable only by owning seller.
  - Orders: readable and manageable only by the buyer and seller involved.
- **HTTP Security Headers**: `next.config.mjs` configures strict Content Security Policy, HSTS (`max-age=31536000`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Media Validation**: Images are validated for MIME type (`image/jpeg`, `image/png`, `image/webp`), size (<8MB), and compressed client-side into WebP to conserve mobile bandwidth.

### 3.5 Design System & Brand Identity
- **Restrained Palette**: Grounded in warm `#FBF9F5` parchment, deep forest green (`#1B382B`), subtle terracotta (`#B85D38`), and soft charcoal (`#232723`). Avoids neon accents, gradients, or glassmorphism.
- **Typography Scale**: Serif headings (*Fraunces*) paired with humanist body typography (*DM Sans*).
- **Mobile First & PWA**: 44px+ minimum touch targets, offline service worker caching, and a persistent bottom navigation bar.
- **Multilingual Support (i18n)**: English default with native Yorùbá, Hausa, and Nigerian Pidgin toggles on key transaction labels.
