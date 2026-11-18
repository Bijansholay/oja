"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem } from "@/lib/types";
import { SplitOrderDraft, splitCartBySeller, computeCartGrandTotal } from "@/lib/orders/calculator";

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "qty">, qty?: number) => void;
  updateQty: (listingId: string, qty: number) => void;
  removeFromCart: (listingId: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  grandTotal: number;
  splitOrders: SplitOrderDraft[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "oja_shopping_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load saved cart", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.warn("Failed to persist cart", e);
      }
    }
  }, [items, isLoaded]);

  const addToCart = (newItem: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.listingId === newItem.listingId);
      if (existing) {
        const updatedQty = Math.min(existing.qty + qty, newItem.maxAvailable);
        return prev.map((i) =>
          i.listingId === newItem.listingId ? { ...i, qty: updatedQty } : i
        );
      }
      return [...prev, { ...newItem, qty: Math.min(qty, newItem.maxAvailable) }];
    });
  };

  const updateQty = (listingId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(listingId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.listingId === listingId) {
          const validQty = Math.min(qty, item.maxAvailable);
          return { ...item, qty: validQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = items.reduce((acc, i) => acc + i.qty, 0);
  const splitOrders = splitCartBySeller(items);
  const grandTotal = computeCartGrandTotal(splitOrders);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        totalItemsCount,
        grandTotal,
        splitOrders,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
