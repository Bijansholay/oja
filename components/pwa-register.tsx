"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => {
            console.log("[PWA] Service worker active");
          })
          .catch((err) => {
            console.warn("[PWA] Service worker registration ignored:", err);
          });
      } else {
        // In development, unregister any active service worker to avoid caching HMR and dev chunks
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      }
    }
  }, []);

  return null;
}
