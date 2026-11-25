import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PwaRegister } from "@/components/pwa-register";

export const viewport: Viewport = {
  themeColor: "#1B382B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Ọjà — Hyperlocal Farm Produce Marketplace",
  description:
    "Direct harvest from local growers in your area. Farm-fresh tomatoes, yams, peppers, plantains, grains, and produce delivered directly by the farmer.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..800;1,9..40,300..800&family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-parchment text-charcoal flex flex-col w-full max-w-full overflow-x-hidden pb-16 sm:pb-0">
        <Providers>
          <div className="flex-1 flex flex-col w-full max-w-full min-w-0">{children}</div>
          <CartDrawer />
          <BottomNav />
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
