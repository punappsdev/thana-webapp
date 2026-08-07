import { describe, expect, it } from "vitest";
import {
  MAX_TEXT_FIELD_LENGTH,
  formatCustomFields,
  resolveCustomValues,
  type CustomFieldRule,
} from "@/lib/quotation-custom-fields";

/** Two fields on the same trigger, like the width/height of a cut-to-size sheet. */
const WIDTH: CustomFieldRule = {
  id: 1,
  inputType: "NUMBER",
  labelTh: "กว้าง",
  labelEn: "Width",
  unitTh: "มม.",
  unitEn: "mm",
  minValue: 100,
  maxValue: 2400,
  step: 10,
  maxLength: null,
  required: true,
  triggerValueId: 269,
};

const HEIGHT: CustomFieldRule = {
  ...WIDTH,
  id: 2,
  labelTh: "สูง",
  labelEn: "Height",
  maxValue: 3600,
};

/** A free text note, e.g. the wording to be etched onto the sheet. */
const NOTE: CustomFieldRule = {
  ...WIDTH,
  id: 3,
  inputType: "TEXT",
  labelTh: "ข้อความสลัก",
  labelEn: "Engraving",
  unitTh: null,
  unitEn: null,
  minValue: null,
  maxValue: null,
  step: null,
  maxLength: 60,
};

const FIELDS = [WIDTH, HEIGHT];
/** What the variant carries when the customer picked "สั่งตัดตามขนาด" */
const CUT_TO_SIZE = [269];
/** A variant on a fixed size — the fields were never shown */
const STOCK_SIZE = [260];

describe("resolveCustomValues", () => {
  it("accepts a complete, in-range set", () => {
    const result = resolveCustomValues(FIELDS, CUT_TO_SIZE, [
      { fieldId: 1, value: 1200 },
      { fieldId: 2, value: 2400 },
    ]);

    expect(result?.map((entry) => entry.value)).toEqual([1200, 2400]);
  });

  it("returns them in the admin's order, not the order they were submitted", () => {
    const result = resolveCustomValues(FIELDS, CUT_TO_SIZE, [
      { fieldId: 2, value: 2400 },
      { fieldId: 1, value: 1200 },
    ]);

    expect(result?.map((entry) => entry.field.labelTh)).toEqual(["กว้าง", "สูง"]);
  });

  it("accepts either bound exactly", () => {
    expect(
      resolveCustomValues(FIELDS, CUT_TO_SIZE, [
        { fieldId: 1, value: 100 },
        { fieldId: 2, value: 3600 },
      ]),
    ).not.toBeNull();
  });

  it("drops the line when a measurement is out of range", () => {
    // The whole line goes, not just the bad number: a sheet without a size is
    // something the sales team cannot quote at all.
    expect(
      resolveCustomValues(FIELDS, CUT_TO_SIZE, [
        { fieldId: 1, value: 30_000 },
        { fieldId: 2, value: 2400 },
      ]),
    ).toBeNull();

    expect(
      resolveCustomValues(FIELDS, CUT_TO_SIZE, [
        { fieldId: 1, value: 90 },
        { fieldId: 2, value: 2400 },
      ]),
    ).toBeNull();
  });

  it("drops the line when a measurement is off the step grid", () => {
    expect(
      resolveCustomValues(FIELDS, CUT_TO_SIZE, [
        { fieldId: 1, value: 1205 },
        { fieldId: 2, value: 2400 },
      ]),
    ).toBeNull();
  });

  it("tolerates the rounding error a three-decimal step produces", () => {
    const fine: CustomFieldRule = { ...WIDTH, minValue: 0.1, maxValue: 10, step: 0.1 };
    // 0.1 * 7 is 0.7000000000000001 in binary floating point.
    expect(resolveCustomValues([fine], CUT_TO_SIZE, [{ fieldId: 1, value: 0.8 }])).not.toBeNull();
  });

  it("drops the line when a measurement is missing", () => {
    expect(resolveCustomValues(FIELDS, CUT_TO_SIZE, [{ fieldId: 1, value: 1200 }])).toBeNull();
    expect(resolveCustomValues(FIELDS, CUT_TO_SIZE, [])).toBeNull();
  });

  it("drops the line when a field is sent twice instead of both fields", () => {
    expect(
      resolveCustomValues(FIELDS, CUT_TO_SIZE, [
        { fieldId: 1, value: 1200 },
        { fieldId: 1, value: 1200 },
      ]),
    ).toBeNull();
  });

  it("drops the line when a value is sent for a field that was never shown", () => {
    // The customer picked a stock size, so no measurement should arrive at all.
    expect(
      resolveCustomValues(FIELDS, STOCK_SIZE, [{ fieldId: 1, value: 1200 }]),
    ).toBeNull();
  });

  it("drops the line when the field belongs to another product", () => {
    expect(
      resolveCustomValues(FIELDS, CUT_TO_SIZE, [
        { fieldId: 99, value: 1200 },
        { fieldId: 2, value: 2400 },
      ]),
    ).toBeNull();
  });

  it("drops the line on a non-finite value", () => {
    expect(
      resolveCustomValues(FIELDS, CUT_TO_SIZE, [
        { fieldId: 1, value: Number.NaN },
        { fieldId: 2, value: 2400 },
      ]),
    ).toBeNull();
    expect(
      resolveCustomValues(FIELDS, CUT_TO_SIZE, [
        { fieldId: 1, value: Number.POSITIVE_INFINITY },
        { fieldId: 2, value: 2400 },
      ]),
    ).toBeNull();
  });

  it("leaves an ordinary product with no custom fields alone", () => {
    expect(resolveCustomValues([], STOCK_SIZE, [])).toEqual([]);
    // A product with nothing to type into must not accept a typed value either.
    expect(resolveCustomValues([], STOCK_SIZE, [{ fieldId: 1, value: 5 }])).toBeNull();
  });

  describe("free text fields", () => {
    it("accepts a note alongside the measurements", () => {
      const result = resolveCustomValues([...FIELDS, NOTE], CUT_TO_SIZE, [
        { fieldId: 1, value: 1200 },
        { fieldId: 2, value: 2400 },
        { fieldId: 3, value: "สุขสันต์วันเกิด" },
      ]);

      expect(result?.map((entry) => entry.value)).toEqual([1200, 2400, "สุขสันต์วันเกิด"]);
    });

    it("flattens a pasted multi-line note onto one line", () => {
      // A raw newline would break the cart row, the admin table and the LINE
      // Flex text all at once.
      const result = resolveCustomValues([NOTE], CUT_TO_SIZE, [
        { fieldId: 3, value: "  บรรทัดแรก\n\tบรรทัดสอง  " },
      ]);

      expect(result?.[0].value).toBe("บรรทัดแรก บรรทัดสอง");
    });

    it("strips control characters rather than passing them to the sales team", () => {
      // A NUL or a bell would travel straight into the sales team's chat window.
      const result = resolveCustomValues([NOTE], CUT_TO_SIZE, [
        { fieldId: 3, value: "abc\u0000\u0007def" },
      ]);

      expect(result?.[0].value).toBe("abc def");
    });

    it("rejects a note longer than the field allows", () => {
      // Truncating would quietly change wording that gets etched onto glass.
      expect(
        resolveCustomValues([NOTE], CUT_TO_SIZE, [{ fieldId: 3, value: "ก".repeat(61) }]),
      ).toBeNull();
      expect(
        resolveCustomValues([NOTE], CUT_TO_SIZE, [{ fieldId: 3, value: "ก".repeat(60) }]),
      ).not.toBeNull();
    });

    it("caps a note at the hard ceiling even when the field asks for more", () => {
      const greedy: CustomFieldRule = { ...NOTE, maxLength: 100_000 };
      expect(
        resolveCustomValues([greedy], CUT_TO_SIZE, [
          { fieldId: 3, value: "a".repeat(MAX_TEXT_FIELD_LENGTH + 1) },
        ]),
      ).toBeNull();
    });

    it("rejects a blank note for a required field", () => {
      expect(resolveCustomValues([NOTE], CUT_TO_SIZE, [{ fieldId: 3, value: "   " }])).toBeNull();
      expect(resolveCustomValues([NOTE], CUT_TO_SIZE, [])).toBeNull();
    });

    it("rejects a number sent for a text field and vice versa", () => {
      expect(resolveCustomValues([NOTE], CUT_TO_SIZE, [{ fieldId: 3, value: 1200 }])).toBeNull();
      expect(resolveCustomValues([WIDTH], CUT_TO_SIZE, [{ fieldId: 1, value: "1200" }])).toBeNull();
    });

    it("keeps a skipped optional field as a null rather than dropping it", () => {
      // The quotation must still show the field was offered and declined.
      const optional: CustomFieldRule = { ...NOTE, required: false };
      expect(resolveCustomValues([optional], CUT_TO_SIZE, [])).toEqual([
        { field: optional, value: null },
      ]);
      // Still checked when it is filled in.
      expect(
        resolveCustomValues([optional], CUT_TO_SIZE, [{ fieldId: 3, value: "ก".repeat(61) }]),
      ).toBeNull();
    });

    it("still requires the mandatory fields when an optional one is skipped", () => {
      const optional: CustomFieldRule = { ...NOTE, required: false };
      const result = resolveCustomValues([WIDTH, optional], CUT_TO_SIZE, [
        { fieldId: 1, value: 1200 },
      ]);

      expect(result?.map((entry) => entry.value)).toEqual([1200, null]);
      expect(
        resolveCustomValues([WIDTH, optional], CUT_TO_SIZE, [{ fieldId: 3, value: "hi" }]),
      ).toBeNull();
    });

    it("refuses a NUMBER field whose bounds were never stored", () => {
      // A row like this can only come from a bad write; treating null as
      // "unbounded" would hand the customer an unchecked field.
      const broken: CustomFieldRule = { ...WIDTH, minValue: null, maxValue: null };
      expect(resolveCustomValues([broken], CUT_TO_SIZE, [{ fieldId: 1, value: 5 }])).toBeNull();
    });
  });

  it("reads Prisma Decimal bounds, not just plain numbers", () => {
    // Decimal columns arrive as objects; the checks must not silently pass.
    const decimal = (value: string) => ({ toString: () => value });
    const fromDb: CustomFieldRule = {
      ...WIDTH,
      minValue: decimal("100.000"),
      maxValue: decimal("2400.000"),
      step: decimal("10.000"),
    };

    expect(resolveCustomValues([fromDb], CUT_TO_SIZE, [{ fieldId: 1, value: 1200 }])).not.toBeNull();
    expect(resolveCustomValues([fromDb], CUT_TO_SIZE, [{ fieldId: 1, value: 5000 }])).toBeNull();
  });
});

describe("formatCustomFields", () => {
  // Height takes a half-unit step so the fractional rendering can be checked;
  // a 2400.5 on the step-10 grid above would (correctly) be rejected outright.
  const resolved = resolveCustomValues(
    [WIDTH, { ...HEIGHT, step: 0.5 }],
    CUT_TO_SIZE,
    [
      { fieldId: 1, value: 1200 },
      { fieldId: 2, value: 2400.5 },
    ],
  )!;

  it("reads as one line in each language", () => {
    expect(formatCustomFields(resolved, "th")).toBe("กว้าง: 1200 มม. · สูง: 2400.5 มม.");
    expect(formatCustomFields(resolved, "en")).toBe("Width: 1200 mm · Height: 2400.5 mm");
  });

  it("returns null when the product has nothing to type into", () => {
    expect(formatCustomFields([], "th")).toBeNull();
  });

  it("writes out a skipped optional field instead of leaving a gap", () => {
    // "the customer did not want an engraving" and "this product never offered
    // one" are two different call-backs for the sales team.
    const optional: CustomFieldRule = { ...NOTE, required: false };
    const skipped = resolveCustomValues([WIDTH, optional], CUT_TO_SIZE, [
      { fieldId: 1, value: 1200 },
    ])!;

    expect(formatCustomFields(skipped, "th")).toBe("กว้าง: 1200 มม. · ข้อความสลัก: ไม่ระบุ");
    expect(formatCustomFields(skipped, "en")).toBe("Width: 1200 mm · Engraving: Not specified");
  });

  it("leaves the unit off the placeholder", () => {
    // "ไม่ระบุ มม." would read as a measurement that is somehow in millimetres.
    const optionalNumber: CustomFieldRule = { ...HEIGHT, required: false };
    const skipped = resolveCustomValues([optionalNumber], CUT_TO_SIZE, [])!;

    expect(formatCustomFields(skipped, "th")).toBe("สูง: ไม่ระบุ");
    expect(formatCustomFields(skipped, "en")).toBe("Height: Not specified");
  });

  it("never exceeds the VarChar(255) column the LINE budget depends on", () => {
    const wordy = Array.from({ length: 10 }, (_, index): CustomFieldRule => ({
      ...WIDTH,
      id: index + 1,
      labelTh: "ความกว้างของแผ่นกระจกด้านซ้าย".repeat(2),
      labelEn: "Width of the left-hand glass panel".repeat(2),
    }));
    const values = wordy.map((field) => ({ fieldId: field.id, value: 1200 }));

    const long = resolveCustomValues(wordy, CUT_TO_SIZE, values)!;
    expect(formatCustomFields(long, "th")!.length).toBeLessThanOrEqual(255);
    expect(formatCustomFields(long, "en")!.length).toBeLessThanOrEqual(255);
  });
});
