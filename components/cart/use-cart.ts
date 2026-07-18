"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { cartCount, cartSubtotal, type CartItem } from "@/lib/cart";
import {
  addToCart,
  clearCart,
  getServerSnapshot,
  getSheetServerSnapshot,
  getSheetSnapshot,
  getSnapshot,
  removeFromCart,
  setCartQty,
  setSheetOpen,
  subscribe,
  subscribeSheet,
} from "@/lib/cart-store";

export interface UseCartResult {
  items: CartItem[];
  count: number;
  subtotal: number;
  /**
   * False during the server render and the hydration pass. Anything whose output
   * depends on the stored cart must wait for this, or the markup React hydrates
   * will not match what the server sent.
   */
  hydrated: boolean;
  add: (item: CartItem) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

/** Reads the quotation cart. No provider needed — see lib/cart-store.ts. */
export function useCart(): UseCartResult {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isOpen = useSyncExternalStore(
    subscribeSheet,
    getSheetSnapshot,
    getSheetServerSnapshot
  );
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const openCart = useCallback(() => setSheetOpen(true), []);
  const closeCart = useCallback(() => setSheetOpen(false), []);

  return useMemo(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      hydrated,
      add: addToCart,
      setQty: setCartQty,
      remove: removeFromCart,
      clear: clearCart,
      isOpen,
      openCart,
      closeCart,
    }),
    [items, hydrated, isOpen, openCart, closeCart]
  );
}
