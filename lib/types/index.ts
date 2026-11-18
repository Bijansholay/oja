export type UserRole = "buyer" | "seller" | "both";

export type ListingUnit = "kg" | "bag" | "crate" | "piece" | "bunch";

export type ListingCategory =
  | "tubers_roots"
  | "vegetables_greens"
  | "peppers_spices"
  | "fruits"
  | "grains_staples"
  | "oils_fats"
  | "poultry_eggs"
  | "livestock_fish";

export type ListingStatus = "active" | "sold_out" | "hidden";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "out_for_delivery"
  | "completed"
  | "declined"
  | "cancelled";

export type PaymentMethod = "online" | "pay_on_delivery";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface Profile {
  $id: string;
  userId: string;
  name: string;
  phone: string;
  role: UserRole;
  avatarId?: string | null;
  lat: number;
  lng: number;
  geohash: string;
  areaName: string;
  createdAt: string;
}

export interface Listing {
  $id: string;
  sellerId: string;
  title: string;
  category: ListingCategory;
  description: string;
  price: number; // in Naira (NGN)
  unit: ListingUnit;
  quantityAvailable: number;
  photoIds: string[];
  lat: number;
  lng: number;
  geohash: string;
  areaName?: string;
  status: ListingStatus;
  createdAt: string;
  // Computed client-side for discovery:
  distanceKm?: number;
  distanceFormatted?: string;
  sellerName?: string;
  sellerPhone?: string;
}

export interface OrderItem {
  $id?: string;
  orderId: string;
  listingId: string;
  titleSnapshot: string;
  qty: number;
  unitPriceSnapshot: number; // in Naira (NGN)
  unitSnapshot?: ListingUnit;
}

export interface Order {
  $id: string;
  buyerId: string;
  sellerId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  buyerNote?: string;
  total: number; // in Naira (NGN)
  createdAt: string;
  paystackReference?: string | null;
  items?: OrderItem[];
  seller?: {
    name: string;
    phone: string;
    areaName?: string;
  };
  buyer?: {
    name: string;
    phone: string;
  };
}

export interface Review {
  $id: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  buyerName?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface CartItem {
  listingId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  unitPrice: number;
  unit: ListingUnit;
  qty: number;
  maxAvailable: number;
  photoId?: string;
  areaName?: string;
}
