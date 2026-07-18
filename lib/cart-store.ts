/**
 * Module-level store backing the quotation cart.
 *
 * The cart lives in localStorage, which is an external system rather than React
 * state, so it is exposed through the `useSyncExternalStore` contract. That keeps
 * hydration honest (the server snapshot is always empty) and means any component
 * can read the cart without being wrapped in a provider — which matters here
 * because `Header` is composed per page rather than mounted once in the layout.
 */

import {
  CART_STORAGE_KEY,
  addItem,
  readCart,
  removeItem,
  updateQty,
  writeCart,
  type CartItem,
} from "./cart";

/** Stable reference so the server snapshot never triggers a re-render loop. */
const EMPTY: CartItem[] = [];

let items: CartItem[] = typeof window === "undefined" ? EMPTY : readCart();

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function commit(next: CartItem[]) {
  items = next;
  writeCart(next);
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // First subscriber owns the cross-tab listener; without it a cart edited in
  // one tab leaves a stale badge in the others.
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function onStorage(event: StorageEvent) {
  if (event.key !== CART_STORAGE_KEY) return;
  items = readCart();
  emit();
}

export function getSnapshot(): CartItem[] {
  return items;
}

export function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function addToCart(item: CartItem): void {
  commit(addItem(items, item));
}

export function setCartQty(key: string, qty: number): void {
  commit(updateQty(items, key, qty));
}

export function removeFromCart(key: string): void {
  commit(removeItem(items, key));
}

export function clearCart(): void {
  commit([]);
}

/* -- Cart sheet open state -------------------------------------------------
   Kept alongside the items so a product page can pop the sheet open after an
   add without either component knowing about the other. Its own listener set,
   so toggling the panel does not re-render everything reading the item list. */

let sheetOpen = false;
const sheetListeners = new Set<() => void>();

export function subscribeSheet(listener: () => void): () => void {
  sheetListeners.add(listener);
  return () => {
    sheetListeners.delete(listener);
  };
}

export function getSheetSnapshot(): boolean {
  return sheetOpen;
}

export function getSheetServerSnapshot(): boolean {
  return false;
}

export function setSheetOpen(open: boolean): void {
  if (sheetOpen === open) return;
  sheetOpen = open;
  for (const listener of sheetListeners) listener();
}
