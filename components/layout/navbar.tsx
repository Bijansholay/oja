"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import { useCart } from "@/features/cart/cart-context";
import { useI18n } from "@/lib/i18n/context";
import { Language } from "@/lib/i18n/translations";
import { ShoppingBag, MapPin, User, ChevronDown, Sprout } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";

interface NavbarProps {
  onOpenAreaPicker?: () => void;
  currentAreaName?: string;
}

export function Navbar({ onOpenAreaPicker, currentAreaName }: NavbarProps) {
  const { user, profile, activeRole, setActiveRole } = useAuth();
  const { totalItemsCount, setIsOpen } = useCart();
  const { locale, setLocale, t } = useI18n();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "yo", label: "Yorùbá" },
    { code: "ha", label: "Hausa" },
    { code: "pcm", label: "Pidgin" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-parchment/95 backdrop-blur-md border-b border-hairline transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="w-8 h-8 rounded-md bg-forest text-parchment flex items-center justify-center font-serif text-lg font-bold shadow-subtle group-hover:bg-forest-hover transition-colors">
                  Ọ
                </span>
                <div className="flex flex-col">
                  <span className="font-serif text-2xl font-bold tracking-tight text-forest">
                    {t.appName}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-charcoal-muted -mt-1 font-medium">
                    Farm Produce
                  </span>
                </div>
              </Link>

              {/* Area location indicator pill (Mobile & Desktop) */}
              {onOpenAreaPicker && (
                <button
                  onClick={onOpenAreaPicker}
                  type="button"
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-parchment-soft hover:bg-parchment-deep border border-hairline text-xs text-charcoal font-medium transition-all"
                  title="Change discovery location"
                >
                  <MapPin className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                  <span className="max-w-[80px] xs:max-w-[110px] sm:max-w-[160px] truncate text-[11px] sm:text-xs">
                    {currentAreaName || profile?.areaName || "Lagos, NG"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-charcoal-muted flex-shrink-0" />
                </button>
              )}
            </div>

            {/* Right action items */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-hairline bg-parchment-soft hover:bg-parchment-deep text-charcoal flex items-center gap-1 uppercase transition-colors"
                  aria-label="Toggle language"
                >
                  <span>{locale}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {isLangMenuOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-dropdown border border-hairline py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLocale(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-parchment-soft transition-colors ${
                          locale === lang.code ? "font-bold text-forest" : "text-charcoal"
                        }`}
                      >
                        {lang.label}
                        {locale === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-forest" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Farmer Switcher / Dashboard Link */}
              <Link
                href="/seller"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-forest hover:bg-forest-light border border-forest/20 transition-all"
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>{t.sellerDashboard}</span>
              </Link>

              {/* Basket Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative touch-target px-3 py-2 rounded-md hover:bg-parchment-soft transition-colors flex items-center gap-1.5 text-charcoal"
                aria-label="View basket"
              >
                <ShoppingBag className="w-5 h-5 text-forest" />
                <span className="hidden sm:inline text-xs font-semibold">{t.basket}</span>
                {totalItemsCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1 rounded-full bg-terracotta text-white text-[11px] font-bold flex items-center justify-center">
                    {totalItemsCount}
                  </span>
                )}
              </button>

              {/* User Account / Profile */}
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="touch-target p-2 rounded-md hover:bg-parchment-soft transition-colors text-charcoal flex items-center gap-1.5"
                title={user ? user.name || "My Account" : "Sign In"}
              >
                <div className="w-8 h-8 rounded-full bg-forest-light text-forest flex items-center justify-center font-bold text-xs">
                  {user ? (user.name ? user.name[0].toUpperCase() : "U") : <User className="w-4 h-4" />}
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
