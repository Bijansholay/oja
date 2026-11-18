import { Client, Account, Databases, Storage, ImageFormat } from "appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  BUCKET_ID,
} from "./constants";

export const client = new Client();

if (typeof window !== "undefined" && APPWRITE_PROJECT_ID) {
  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

/**
 * Generate optimized Appwrite storage image URL with width, quality, and webp format.
 * Falls back gracefully to placeholder if fileId is absent or invalid.
 */
export function getProduceImageUrl(
  fileId?: string | null,
  width: number = 600,
  quality: number = 80
): string {
  if (!fileId) {
    return "/images/produce/placeholder.svg";
  }

  // If fileId is a full URL (e.g. from seed or external source), return directly
  if (fileId.startsWith("http://") || fileId.startsWith("https://")) {
    return fileId;
  }

  // If seed placeholder identifier, return local artisanal SVG produce graphics
  if (fileId.startsWith("photo_") || fileId.startsWith("seed_")) {
    const seedMap: Record<string, string> = {
      photo_tomatoes_1: "/images/produce/tomatoes.svg",
      photo_rodo_1: "/images/produce/rodo.svg",
      photo_ugu_1: "/images/produce/ugu.svg",
      photo_plantain_1: "/images/produce/plantain.svg",
      photo_yam_1: "/images/produce/yam.svg",
      photo_beans_1: "/images/produce/beans.svg",
      photo_garri_1: "/images/produce/garri.svg",
      photo_palmoil_1: "/images/produce/palmoil.svg",
      photo_eggs_1: "/images/produce/eggs.svg",
      photo_catfish_1: "/images/produce/catfish.svg",
    };
    if (seedMap[fileId]) return seedMap[fileId];
  }

  if (!APPWRITE_PROJECT_ID) {
    return "/images/produce/placeholder.svg";
  }

  try {
    const url = storage.getFilePreview(
      BUCKET_ID,
      fileId,
      width,
      0, // height (0 = maintain aspect ratio)
      undefined, // gravity
      quality, // quality
      0, // borderWidth
      "", // borderColor
      0, // borderRadius
      1, // opacity
      0, // rotation
      "", // background
      ImageFormat.Webp // output format
    );
    return url.toString();
  } catch (err) {
    return "/images/produce/placeholder.svg";
  }
}
