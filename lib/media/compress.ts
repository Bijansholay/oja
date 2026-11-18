/**
 * Client-side image validation and compression helper.
 * Ensures produce photography is compressed before uploading to Appwrite Storage,
 * saving bandwidth on weak mobile networks and preventing oversized payloads.
 */

import { APP_CONFIG } from "@/lib/config";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeBytes?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: APP_CONFIG.media.maxPhotoDimensionPx,
  maxHeight: APP_CONFIG.media.maxPhotoDimensionPx,
  quality: APP_CONFIG.media.compressionQuality,
  maxSizeBytes: APP_CONFIG.media.maxPhotoSizeBytes,
};

export async function validateAndCompressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; previewUrl: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate file type
  const allowedTypes: readonly string[] = APP_CONFIG.media.allowedMimeTypes;
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid image format. Please select a JPG, PNG, or WebP photo.");
  }

  // Validate raw file size
  if (file.size > opts.maxSizeBytes!) {
    const limitMb = (opts.maxSizeBytes! / (1024 * 1024)).toFixed(0);
    throw new Error(
      `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under ${limitMb}MB.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          if (width > height) {
            height = Math.round((height * opts.maxWidth!) / width);
            width = opts.maxWidth!;
          } else {
            width = Math.round((width * opts.maxHeight!) / height);
            opts.maxWidth = width;
            height = opts.maxHeight!;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to create canvas context for image processing"));
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP or JPEG blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            const outputFilename = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], outputFilename, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);
            resolve({ file: compressedFile, previewUrl });
          },
          "image/webp",
          opts.quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image file into memory"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };
  });
}
