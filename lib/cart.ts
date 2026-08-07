/**
 * Quotation cart — pure domain logic and localStorage access.
 *
 * Nothing here is priced: the site quotes on request only, so a cart is purely
 * the list of items the customer wants quoted. Everything lives in the browser
 * for now; the request is only persisted server side when the customer submits
 * the contact form.
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
  /** Null for a product with no options to choose. */
  variantId: number | null;
  /** Kept so a line can link back to the product page */
  slug: string;
  nameTh: string;
  nameEn: string;
  image: string | null;
  sku: string | null;
  qty: number;
  attributes?: {
    nameTh: string;
    nameEn: string;
    valueTh: string;
    valueEn: string;
    colorHex?: string | null;
  }[];
  /**
   * What the customer typed into a ProductCustomField — a number for a
   * measurement, a string for a free text note. Unlike everything else in a cart
   * line these cannot be re-read from the database; the server re-validates them
   * against the field's own rules instead (see `resolveItems` in
   * app/[locale]/quote/actions.ts).
   *
   * Fields the customer left blank are simply absent, so an optional note costs
   * nothing. The readable version is appended to `attributes` at add time so the
   * cart and the quotation form render it with no extra lookup.
   */
  customValues?: { fieldId: number; value: number | string }[];
};

/**
 * Bumped to v2 when lines gained per-locale names, and to v3 when `lineKey`
 * started including customValues; older carts are simply dropped.
 */
export const CART_STORAGE_KEY = "thana-quote-cart-v3";

export const MAX_QTY = 9999;

/**
 * Identifies a line: the same product in two variants is two separate lines.
 *
 * The typed-in values are part of the identity too. Two cut-to-size sheets at
 * 100×200 and 300×400 match the same "cut to size" variant, so without them
 * `addItem` would merge the lines, sum the quantities and overwrite the first
 * size with the second — a wrong quotation with nothing on screen to show it.
 *
 * Sorted by fieldId so the key does not depend on the order the inputs were
 * filled in. Lines with no custom values keep exactly the key they had before.
 */
export function lineKey(item: Pick<CartItem, "productId" | "variantId" | "customValues">): string {
  const base = `${item.productId}:${item.variantId ?? "base"}`;
  if (!item.customValues || item.customValues.length === 0) return base;

  // JSON.stringify quotes and escapes the value so a typed note containing a
  // comma or a quote cannot forge the separator and collide with another line.
  const custom = [...item.customValues]
    .sort((a, b) => a.fieldId - b.fieldId)
    .map((entry) => `${entry.fieldId}=${JSON.stringify(entry.value)}`)
    .join(",");
  return `${base}:${custom}`;
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
  if (it.variantId !== null && (typeof it.variantId !== "number" || !Number.isFinite(it.variantId))) return null;
  if (typeof it.slug !== "string" || it.slug === "") return null;
  if (typeof it.nameTh !== "string" || typeof it.nameEn !== "string") return null;
  if (typeof it.qty !== "number") return null;

  let attributes: CartItem["attributes"] = undefined;
  if (Array.isArray(it.attributes)) {
    attributes = [];
    for (const attr of it.attributes) {
      if (
        typeof attr === "object" &&
        attr !== null &&
        typeof attr.nameTh === "string" &&
        typeof attr.nameEn === "string" &&
        typeof attr.valueTh === "string" &&
        typeof attr.valueEn === "string"
      ) {
        attributes.push({
          nameTh: attr.nameTh,
          nameEn: attr.nameEn,
          valueTh: attr.valueTh,
          valueEn: attr.valueEn,
          colorHex: typeof attr.colorHex === "string" ? attr.colorHex : null,
        });
      }
    }
  }

  // A malformed entry here would change the line's identity, so the whole line
  // is dropped rather than kept with a partial set of typed-in values.
  let customValues: CartItem["customValues"] = undefined;
  if (Array.isArray(it.customValues)) {
    customValues = [];
    for (const entry of it.customValues) {
      if (
        typeof entry !== "object" ||
        entry === null ||
        typeof entry.fieldId !== "number" ||
        !Number.isInteger(entry.fieldId) ||
        entry.fieldId <= 0
      ) {
        return null;
      }
      // A number is a measurement, a string is a typed note. Anything else —
      // including a NaN that JSON.parse would hand back as null — is not a value.
      const isNumber = typeof entry.value === "number" && Number.isFinite(entry.value);
      const isText = typeof entry.value === "string";
      if (!isNumber && !isText) return null;

      customValues.push({ fieldId: entry.fieldId, value: entry.value as number | string });
    }
  }

  return {
    productId: it.productId,
    variantId: it.variantId as number | null,
    slug: it.slug,
    nameTh: it.nameTh,
    nameEn: it.nameEn,
    image: typeof it.image === "string" ? it.image : null,
    sku: typeof it.sku === "string" ? it.sku : null,
    qty: clampQty(it.qty),
    attributes,
    customValues,
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
 * The snapshot fields are refreshed on merge so stale details from an earlier
 * session never survive a fresh visit to the product page.
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
