import { z } from "zod";

/**
 * Normalizes phone numbers commonly entered in Nigeria:
 * - Local Nigerian format: "08012345678" -> "+2348012345678"
 * - International without plus: "2348012345678" -> "+2348012345678"
 * - Strips internal spaces, dashes, or parentheses
 */
export function normalizePhoneNumber(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[\s\-\(\)]/g, "");
  // Local Nigerian format: 11 digits starting with 0 (e.g. 080..., 070..., 090..., 091...)
  if (/^0\d{10}$/.test(cleaned)) {
    return "+234" + cleaned.slice(1);
  }
  // Nigerian format with country code but missing plus: 2348012345678
  if (/^234\d{10}$/.test(cleaned)) {
    return "+" + cleaned;
  }
  // Already starting with +
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  // Generic international digits without plus (e.g. 14155552671)
  if (/^[1-9]\d{7,14}$/.test(cleaned)) {
    return "+" + cleaned;
  }
  return cleaned;
}

export const phoneRegex = /^\+?[1-9]\d{8,14}$/;

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Please enter a valid phone number")
  .max(25)
  .transform(normalizePhoneNumber)
  .refine(
    (val) => phoneRegex.test(val),
    "Please enter a valid phone number (e.g. 08012345678 or +2348012345678)"
  );

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  phone: phoneSchema,
  role: z.enum(["buyer", "seller", "both"], {
    errorMap: () => ({ message: "Select whether you are buying, selling, or both" }),
  }),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  areaName: z.string().trim().min(2, "Area name is required").max(100),
});

export const listingCategories = [
  "tubers_roots",
  "vegetables_greens",
  "peppers_spices",
  "fruits",
  "grains_staples",
  "oils_fats",
  "poultry_eggs",
  "livestock_fish",
] as const;

export const listingUnits = ["kg", "bag", "crate", "piece", "bunch"] as const;

export const listingCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(80, "Title cannot exceed 80 characters"),
  category: z.enum(listingCategories, {
    errorMap: () => ({ message: "Please select a valid produce category" }),
  }),
  description: z
    .string()
    .trim()
    .min(10, "Please describe freshness, source, or harvest date (at least 10 characters)")
    .max(800, "Description cannot exceed 800 characters"),
  price: z
    .number()
    .positive("Price must be greater than 0")
    .max(5000000, "Price seems unusually high"),
  unit: z.enum(listingUnits, {
    errorMap: () => ({ message: "Please select a unit (kg, bag, crate, piece, or bunch)" }),
  }),
  quantityAvailable: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Available quantity must be at least 1"),
  photoIds: z
    .array(z.string().min(1))
    .min(1, "Please provide at least one photo of your produce"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  areaName: z.string().trim().max(100).optional(),
});

export const listingUpdateSchema = listingCreateSchema.partial().extend({
  status: z.enum(["active", "sold_out", "hidden"]).optional(),
});

export const orderItemInputSchema = z.object({
  listingId: z.string().min(1, "Listing ID required"),
  qty: z.number().int().min(1, "Quantity must be at least 1"),
});

export const checkoutSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, "Cart cannot be empty"),
  paymentMethod: z.enum(["online", "pay_on_delivery"]),
  deliveryAddress: z
    .string()
    .trim()
    .min(3, "Please provide a detailed delivery address or landmark")
    .max(250),
  deliveryLat: z.number().min(-90).max(90),
  deliveryLng: z.number().min(-180).max(180),
  buyerName: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(80),
  buyerPhone: phoneSchema,
  buyerEmail: z.string().trim().email("Please enter a valid email").optional().or(z.literal("")),
  buyerNote: z.string().trim().max(300).optional(),
});

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["accepted", "out_for_delivery", "completed", "declined", "cancelled"]),
});

export const reviewCreateSchema = z.object({
  orderId: z.string().min(1),
  sellerId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .min(4, "Review must be at least 4 characters")
    .max(500),
});

export const phoneOtpRequestSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid international phone number e.g. +2348012345678"),
});

export const phoneOtpVerifySchema = z.object({
  userId: z.string().min(1, "User ID required"),
  secret: z.string().min(4, "Enter the verification code received via SMS"),
});

export const emailOtpRequestSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export const emailOtpVerifySchema = z.object({
  userId: z.string().min(1),
  secret: z.string().min(4),
});
