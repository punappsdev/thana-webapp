// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  CART_STORAGE_KEY,
  addItem,
  lineKey,
  readCart,
  type CartItem,
} from "@/lib/cart";

afterEach(() => {
  window.localStorage.clear();
});

function line(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 1,
    variantId: 10,
    slug: "clear-glass",
    nameTh: "กระจกใส",
    nameEn: "Clear glass",
    image: null,
    sku: "GL-CUT",
    qty: 1,
    ...overrides,
  };
}

describe("lineKey", () => {
  it("keeps the old key for lines with no typed-in values", () => {
    expect(lineKey(line())).toBe("1:10");
    expect(lineKey(line({ variantId: null }))).toBe("1:base");
    expect(lineKey(line({ customValues: [] }))).toBe("1:10");
  });

  it("separates two cut-to-size lines that share a variant", () => {
    const small = line({
      customValues: [
        { fieldId: 3, value: 100 },
        { fieldId: 4, value: 200 },
      ],
    });
    const large = line({
      customValues: [
        { fieldId: 3, value: 300 },
        { fieldId: 4, value: 400 },
      ],
    });

    expect(lineKey(small)).not.toBe(lineKey(large));
  });

  it("separates two lines that differ only by a typed note", () => {
    const birthday = line({ customValues: [{ fieldId: 3, value: "สุขสันต์วันเกิด" }] });
    const wedding = line({ customValues: [{ fieldId: 3, value: "สุขสันต์วันแต่งงาน" }] });

    expect(lineKey(birthday)).not.toBe(lineKey(wedding));
  });

  it("cannot be forged by a note containing the separators", () => {
    // Raw interpolation would let this text impersonate a second field.
    const sneaky = line({ customValues: [{ fieldId: 3, value: '4=x,5="y"' }] });
    const twoFields = line({
      customValues: [
        { fieldId: 3, value: "" },
        { fieldId: 4, value: "x" },
      ],
    });

    expect(lineKey(sneaky)).not.toBe(lineKey(twoFields));
  });

  it("does not depend on the order the inputs were filled in", () => {
    const widthFirst = line({
      customValues: [
        { fieldId: 3, value: 100 },
        { fieldId: 4, value: 200 },
      ],
    });
    const heightFirst = line({
      customValues: [
        { fieldId: 4, value: 200 },
        { fieldId: 3, value: 100 },
      ],
    });

    expect(lineKey(widthFirst)).toBe(lineKey(heightFirst));
  });
});

describe("addItem", () => {
  it("merges the same variant at the same size", () => {
    const size = [{ fieldId: 3, value: 100 }];
    const items = addItem(
      addItem([], line({ customValues: size, qty: 1 })),
      line({ customValues: size, qty: 2 }),
    );

    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(3);
  });

  /** The bug this feature would otherwise ship: two sizes summed into one line. */
  it("keeps two different sizes as separate lines", () => {
    const items = addItem(
      addItem([], line({ customValues: [{ fieldId: 3, value: 100 }], qty: 1 })),
      line({ customValues: [{ fieldId: 3, value: 300 }], qty: 1 }),
    );

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.customValues?.[0].value)).toEqual([100, 300]);
  });
});

describe("readCart", () => {
  it("keeps well-formed typed-in values", () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([line({ customValues: [{ fieldId: 3, value: 1200.5 }] })]),
    );

    expect(readCart()[0].customValues).toEqual([{ fieldId: 3, value: 1200.5 }]);
  });

  it("keeps a typed note as a string", () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([line({ customValues: [{ fieldId: 3, value: "สลักชื่อ" }] })]),
    );

    expect(readCart()[0].customValues).toEqual([{ fieldId: 3, value: "สลักชื่อ" }]);
  });

  it("drops a line whose typed-in values are malformed", () => {
    // A partial set would change the line's identity, so the line cannot be
    // salvaged the way an unreadable attribute label can. Only a number or a
    // string is a value — an object or a null is a broken payload.
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        line({ customValues: [{ fieldId: 3, value: { nested: true } }] as never }),
        line({ productId: 2, customValues: [{ fieldId: 3, value: 800 }] }),
      ]),
    );

    const items = readCart();
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(2);
  });
});
