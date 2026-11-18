# Ọjà Marketplace: Codebase Audit & Zero-Hardcoding Architecture Standards

> **Document Status**: Production Standard  
> **Target System**: Ọjà Hyperlocal Farm-Produce Marketplace  
> **Last Audited**: 2026-11-18  

---

## 1. Executive Summary

This document establishes the official **Zero-Hardcoding Standard** for the Ọjà marketplace codebase and catalogs every hardcoded value identified during the audit, its replacement mechanism, and its architectural rationale.

Previously, early development and demo scaffolding left several hardcoded artifacts across routes, components, and server logic (including test user IDs such as `buyer_test_user` and `seller_baba_alabi`, placeholder phone numbers such as `+2348031234501` and `+2348000000000`, fixed Lagos coordinates, hardcoded first-time Pay on Delivery caps of `30000`, and inline preset arrays). 

All such hardcoded instances have been eliminated and consolidated into a unified configuration architecture (`APP_CONFIG`) backed by environment variable overrides, strong typing, and explicit user-driven state.

---

## 2. Codebase Audit & Remediation Matrix

| Category | File | Previously Hardcoded Item | Remediated Architecture | Benefit |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Personas** | `app/api/orders/checkout/route.ts` | Defaulted unauthenticated buyer to `"buyer_test_user"` with phone `"+2348091112233"`. | Strict extraction from authenticated session (`account.get()`) or verified validated payload (`buyerName`, `buyerPhone`). Rejects anonymous attempts. | Prevents unauthorized orders from impersonating test accounts. |
| **Authentication & Personas** | `app/seller/page.tsx` | Fallback seller ID: `effectiveSellerId = user?.$id \|\| "seller_baba_alabi"`. | Explicit authenticated gate: unauthenticated visitors are presented with `AuthModal` prompting login before viewing dashboard. | Enforces authentic farmer data isolation. |
| **Authentication & Personas** | `app/orders/page.tsx` | Fallback buyer ID: `const buyerId = user?.$id \|\| "buyer_test_user"`. | Unauthenticated visitors see a dedicated "Track Your Harvest Orders" sign-in gate. Authenticated users query only their own orders. | Prevents leaking demo buyer orders to general visitors. |
| **Authentication & Personas** | `features/auth/auth-context.tsx` | Automatically loaded `"buyer_test_user"` if `localStorage` was empty in demo mode. | If no active persona is stored, user is initialized as `null` (guest state). In demo mode, users can actively choose their persona. | Genuine guest browsing experience matching production behavior. |
| **Contact & Phone Numbers** | `app/seller/page.tsx` | WhatsApp chat link fallback: `"+2348000000000"`. | Dynamic evaluation: WhatsApp and Phone buttons only render when buyer provides a phone number. | Eliminates non-functional dummy contacts. |
| **Contact & Phone Numbers** | `app/orders/[id]/page.tsx` | Farmer direct phone fallback: `"+2348031234501"`. | Reads `order.seller?.phone` directly. Disables or conditionally hides call/chat buttons if absent. | Clean, dynamic seller contact display. |
| **Contact & Phone Numbers** | `app/listings/[id]/page.tsx` | "Ask Farmer" WhatsApp link fallback: `"+2348031234501"`. | Reads `listing.sellerPhone`. WhatsApp link is rendered only when phone digits exist. | No fake phone numbers rendered to shoppers. |
| **Coordinates & Geolocation** | `app/page.tsx` | Hardcoded center `lat: 6.4281, lng: 3.4219`, radius `25`, name `"Victoria Island & Ikoyi, Lagos"`. | Sourced from `APP_CONFIG.geo.defaultLat`, `defaultLng`, `defaultRadiusKm`, `defaultAreaName`. Overridable via `NEXT_PUBLIC_*`. | Marketplace can be localized to Abuja, Ibadan, Port Harcourt, or Accra with 0 code changes. |
| **Coordinates & Geolocation** | `app/checkout/page.tsx` | Hardcoded initial address `"14 Adeola Odeku St, Victoria Island, Lagos"`, `6.4281`, `3.4219`. | Initialized from authenticated user's profile if set, or empty/default from `APP_CONFIG.geo`. | Never prepopulates another person's address. |
| **Coordinates & Geolocation** | `features/listings/create-listing-form.tsx` | Inline `COMMON_NIGERIAN_AREAS` array and hardcoded `6.5841, 3.9832`. | Replaced with `APP_CONFIG.geo.locations` and centralized default coordinates. | Unified list of agricultural hubs and markets across all forms. |
| **Coordinates & Geolocation** | `features/listings/area-picker-modal.tsx` | Inline `POPULAR_LOCATIONS` array and inline radius buttons `[5, 15, 30, 50]`. | Sourced directly from `APP_CONFIG.geo.locations` and `APP_CONFIG.geo.supportedRadiiKm`. | Instant synchronization when radius tiers or areas change. |
| **Coordinates & Geolocation** | `features/listings/listing-actions.ts` | Hardcoded fallback `"Local Farm Settlement"` and fixed precision `6`. | Uses `APP_CONFIG.geo.defaultAreaName` and `APP_CONFIG.geo.geohashPrecision`. | Precision and fallback names configured in one single module. |
| **Financial & Commerce Limits** | `lib/orders/calculator.ts` | Hardcoded first-time Pay on Delivery threshold: `30000` NGN. | Driven by `APP_CONFIG.orders.maxFirstTimePodLimitNaira` (default 35,000 NGN) and `APP_CONFIG.currency.symbol`. | Risk and compliance teams can tune POD anti-fraud caps via `ORDER_MAX_POD_LIMIT_NAIRA`. |
| **Validation & Security** | `lib/validation/schemas.ts` | `checkoutSchema` lacked explicit buyer contact fields, relying on server fallbacks. | Added mandatory `buyerName` and `buyerPhone` (with international phone regex) and optional `buyerEmail`. | Enforces complete order metadata before payment or dispatch. |
| **Media & Upload Limits** | `lib/media/compress.ts` | Hardcoded `1600` max dimensions, `0.82` quality, and `8 * 1024 * 1024` byte limits. | Fully parameterized with `APP_CONFIG.media` (`maxPhotoSizeBytes`, `maxPhotoDimensionPx`, `compressionQuality`, `allowedMimeTypes`). | Tune media budgets based on client device and storage tier without touching canvas routines. |
| **Media & Upload Limits** | `features/listings/create-listing-form.tsx` | Fallback dummy image ID: `"photo_tomatoes_1"`. | Enforces photo upload validation before submission. | Guaranteed that real listings have real produce photos. |
| **Payment Security** | `lib/payments/provider.ts` | Mock verification returned hardcoded `amountNaira: 10000` and `paid: true`. | When unconfigured, `verifyTransaction` returns `paid: false` and `amountNaira: 0`. | Prevents simulated or bypassed payment verifications from marking orders paid. |
| **Database & Pagination** | `features/listings/listing-feed.tsx` | Query pagination limit hardcoded to `50`. | Sourced from `APP_CONFIG.appwrite.feedPageLimit` (overridable via `NEXT_PUBLIC_FEED_PAGE_LIMIT`). | Page size can be dialed up or down based on mobile payload budgets. |

---

## 3. The "Zero Hardcoding" Architecture Standard

Every engineer and automated agent contributing to this repository must follow these rules:

### Rule 1: No Hardcoded User IDs or Test Personas
- **Prohibited**: `userId = user?.$id || "buyer_test_user"`, `sellerId = "seller_baba_alabi"`.
- **Mandated**: If an operation requires authentication, check `if (!user)` and render an authentication prompt or return an HTTP 401 Unauthorized response. Never silently substitute a test user.

### Rule 2: No Hardcoded Contact Numbers or Credentials
- **Prohibited**: Dummy fallbacks like `phone || "+2348000000000"`.
- **Mandated**: Check for phone presence. If missing, omit the button, render a disabled state, or instruct the user to complete their profile. Secrets (Appwrite keys, Paystack secret keys) must **only** reside in server environment variables and never be embedded or defaulted in client bundles.

### Rule 3: Single Source of Truth for Geolocation (`APP_CONFIG.geo`)
- **Prohibited**: Magic numbers like `6.4281`, `3.4219`, `precision: 6`, or inline arrays of local markets.
- **Mandated**: Import `APP_CONFIG` from `@/lib/config`. Reference:
  - `APP_CONFIG.geo.defaultLat`
  - `APP_CONFIG.geo.defaultLng`
  - `APP_CONFIG.geo.defaultAreaName`
  - `APP_CONFIG.geo.geohashPrecision`
  - `APP_CONFIG.geo.locations`

### Rule 4: Dynamic Commerce & Anti-Fraud Thresholds (`APP_CONFIG.orders`)
- **Prohibited**: Hardcoded limits like `if (total > 30000)`.
- **Mandated**: Reference `APP_CONFIG.orders.maxFirstTimePodLimitNaira` and `APP_CONFIG.currency.symbol`. Configure via `.env` (`ORDER_MAX_POD_LIMIT_NAIRA`).

### Rule 5: Centralized Media Processing Parameters (`APP_CONFIG.media`)
- **Prohibited**: Raw canvas dimensions, arbitrary compression ratios, or inline MIME type arrays.
- **Mandated**: Use `APP_CONFIG.media.maxPhotoDimensionPx`, `APP_CONFIG.media.compressionQuality`, and `APP_CONFIG.media.allowedMimeTypes`.

### Rule 6: Authoritative Server Price Computation
- **Prohibited**: Trusting client-submitted totals, line totals, or discount rates.
- **Mandated**: All prices must be re-queried and re-calculated on the server from the database before order creation and stock decrementation.

---

## 4. How to Add New Configuration Parameters

When introducing a new configurable business value:

1. Add the variable to `lib/config/index.ts` under the appropriate category (`app`, `geo`, `orders`, `media`, `payments`, `appwrite`).
2. Provide a sensible environment variable fallback:
   ```typescript
   myNewParam: process.env.NEXT_PUBLIC_MY_PARAM || "defaultValue",
   ```
3. Document the variable and its purpose in `.env.example`.
4. Import and use `APP_CONFIG.<category>.<param>` in features and components.
5. Add unit tests covering boundary conditions.
