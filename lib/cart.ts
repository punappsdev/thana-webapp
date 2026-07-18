/**
 * Quotation cart — pure domain logic and localStorage access.
 *
 * Products here are quote-request only (see the `stockQty` note in schema.prisma),
 * so the cart is a wish list the customer assembles before asking for a price.
 * Everything lives in the browser for now; the request is only persisted server
 * side when the customer submits the contact form.
 */

/**
 * Both languages are snapshotted rather than the one that was on screen, so a
 * cart assembled in Thai reads correctly after the customer switches to English.
 * Resolve them with `pick(item, "name", locale)` from lib/products.ts.
 *
 * Declared as a type alias, not an interface, so it carries the implicit index
 * signature `pick` requires — the same reason Prisma's generated types work there.
 */
export type CartItem = {
  productId: number;
  variantId: number;
  /** Kept so a line can link back to the product page */
  slug: string;
  nameTh: string;
  nameEn: string;
  image: string | null;
  sku: string | null;
  /** Snapshot of the listed price — re-checked server side when the quote is requested */
  unitPrice: number;
  pricingUnitNameTh: string | null;
  pricingUnitNameEn: string | null;
  qty: number;
};

/** Bumped to v2 when lines gained per-locale names; v1 carts are simply dropped. */
export const CART_STORAGE_KEY = "thana-quote-cart-v2";

export const MAX_QTY = 9999;

/** Identifies a line: the same product in two variants is two separate lines. */
export function lineKey(item: Pick<CartItem, "productId" | "variantId">): string {
  return `${item.productId}:${item.variantId}`;
}

export function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.trunc(qty)));
}

/**
 * Validates one entry from storage. Anything shaped wrong is dropped rather than
 * trusted — the payload is user-writable and a bad line would break every render.
 */
function parseItem(raw: unknown): CartItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const it = raw as Record<string, unknown>;

  if (typeof it.productId !== "number" || !Number.isFinite(it.productId)) return null;
  if (typeof it.variantId !== "number" || !Number.isFinite(it.variantId)) return null;
  if (typeof it.slug !== "string" || it.slug === "") return null;
  if (typeof it.nameTh !== "string" || typeof it.nameEn !== "string") return null;
  if (typeof it.unitPrice !== "number" || !Number.isFinite(it.unitPrice)) return null;
  if (typeof it.qty !== "number") return null;

  return {
    productId: it.productId,
    variantId: it.variantId,
    slug: it.slug,
    nameTh: it.nameTh,
    nameEn: it.nameEn,
    image: typeof it.image === "string" ? it.image : null,
    sku: typeof it.sku === "string" ? it.sku : null,
    unitPrice: it.unitPrice,
    pricingUnitNameTh:
      typeof it.pricingUnitNameTh === "string" ? it.pricingUnitNameTh : null,
    pricingUnitNameEn:
      typeof it.pricingUnitNameEn === "string" ? it.pricingUnitNameEn : null,
    qty: clampQty(it.qty),
  };
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const items: CartItem[] = [];
    const seen = new Set<string>();
    for (const entry of parsed) {
      const item = parseItem(entry);
      // Duplicate keys would make qty edits ambiguous, so keep the first only
      if (item && !seen.has(lineKey(item))) {
        seen.add(lineKey(item));
        items.push(item);
      }
    }
    return items;
  } catch {
    // Malformed JSON, or storage blocked (Safari private mode) — start empty
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota or blocked storage: the in-memory cart still works for this session
  }
}

/**
 * Adds a line, merging into the matching one when the same variant is added twice.
 * The snapshot fields are refreshed on merge so a stale price from an earlier
 * session never survives a fresh visit to the product page.
 */
export function addItem(items: CartItem[], incoming: CartItem): CartItem[] {
  const key = lineKey(incoming);
  const index = items.findIndex((item) => lineKey(item) === key);
  if (index === -1) {
    return [...items, { ...incoming, qty: clampQty(incoming.qty) }];
  }

  const next = [...items];
  next[index] = {
    ...incoming,
    qty: clampQty(items[index].qty + incoming.qty),
  };
  return next;
}

export function updateQty(items: CartItem[], key: string, qty: number): CartItem[] {
  return items.map((item) =>
    lineKey(item) === key ? { ...item, qty: clampQty(qty) } : item
  );
}

export function removeItem(items: CartItem[], key: string): CartItem[] {
  return items.filter((item) => lineKey(item) !== key);
}

/** Total pieces across all lines — what the header badge shows. */
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}
