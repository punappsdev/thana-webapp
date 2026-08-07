/**
 * Validation and formatting for what a customer types into a product's
 * ProductCustomField — the width and height of a cut-to-size sheet, or a free
 * text note such as the wording to be etched on it.
 *
 * Split out of the quotation server action for the same reason as
 * `lib/line/message.ts`: this is the one place in the codebase that has to trust
 * a value from the client, so it earns direct tests. Every other field on a cart
 * line is re-read from the catalog (see `resolveItems`), but nothing in the
 * catalog can produce a size or a note the customer invented.
 *
 * Deliberately no `import "server-only"` — that would break the vitest run.
 */

export type CustomFieldInputKind = "NUMBER" | "TEXT";

/** What a customer submits for one field. TEXT sends a string, NUMBER a number. */
export type CustomFieldValue = number | string;

/** Shape of a `ProductCustomField` row, narrowed to what the checks need. */
export type CustomFieldRule = {
  id: number;
  inputType: CustomFieldInputKind;
  labelTh: string;
  labelEn: string;
  /** Free text usually has no unit, hence nullable */
  unitTh: string | null;
  unitEn: string | null;
  /** NUMBER only. Prisma Decimal or plain number; both survive `Number()`. */
  minValue: number | { toString(): string } | null;
  maxValue: number | { toString(): string } | null;
  step: number | { toString(): string } | null;
  /** TEXT only */
  maxLength: number | null;
  /** false = the customer may leave it blank */
  required: boolean;
  /** The AttributeValue that makes this field appear on the product page */
  triggerValueId: number;
};

/** `value: null` = an optional field the customer chose to leave blank. */
export type ResolvedCustomValue = { field: CustomFieldRule; value: CustomFieldValue | null };

/**
 * Stands in for an optional field the customer skipped.
 *
 * Written out rather than omitted so the sales team can tell "the customer did
 * not want an engraving" from "this product never offered one" — two different
 * conversations to have when calling back.
 */
const NOT_SPECIFIED = { th: "ไม่ระบุ", en: "Not specified" } as const;

/**
 * How many entries one line may carry. Well above what a cut-to-size product
 * needs, and low enough that a tampered payload cannot inflate the LINE card
 * past the byte budget in lib/line/message.ts.
 */
export const MAX_CUSTOM_FIELDS = 10;

/**
 * Hard ceiling on one text answer, whatever the admin configured. Paired with
 * the 255-character `QuotationItem.customFieldsTh` column and the admin-side
 * check in `validateProductCustomFields`, this is what keeps a single quotation
 * line from blowing the LINE bubble budget.
 */
export const MAX_TEXT_FIELD_LENGTH = 200;

/**
 * Floating point slack when checking a value against `step`. 0.0005 sits below
 * the third decimal place the Decimal(12,3) columns store, so a value the admin
 * can express is never rejected for being off-grid by a rounding error.
 */
const STEP_EPSILON = 0.0005;

/**
 * Flattens whatever the customer typed onto a single line.
 *
 * Newlines and tabs are collapsed rather than rejected: the value is rendered as
 * one line in the cart, in `/admin/quotations`, and inside a LINE Flex text
 * component, and a raw newline would silently break all three. Control
 * characters go entirely — they are never intentional and would travel all the
 * way into the sales team's chat.
 */
export function normalizeCustomText(raw: string): string {
  return (
    raw
      // Escaped rather than literal so no raw NUL ever sits in this source file.
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Re-checks what a customer submitted against the product's own fields,
 * returning the entries in the admin's display order.
 *
 * Returns null — meaning "drop this whole line" — rather than ignoring the bad
 * entries, because a cut-to-size sheet without its size is not a smaller version
 * of the request, it is a request the sales team cannot quote. The picker on the
 * product page prevents this for real customers; reaching it means the payload
 * was edited by hand or the product's fields changed since the cart was filled.
 *
 * Optional fields the customer left blank come back with a null value rather
 * than being dropped, so the quotation still records that they were offered.
 */
export function resolveCustomValues(
  fields: CustomFieldRule[],
  selectedValueIds: Iterable<number>,
  submitted: { fieldId: number; value: CustomFieldValue }[],
): ResolvedCustomValue[] | null {
  const selected = new Set(selectedValueIds);
  // Only the fields whose trigger the customer actually landed on are in play;
  // the rest were never shown and must not arrive with a value.
  const expected = fields.filter((field) => selected.has(field.triggerValueId));
  if (submitted.length > expected.length) return null;
  if (expected.length > MAX_CUSTOM_FIELDS) return null;

  const expectedById = new Map(expected.map((field) => [field.id, field]));
  const byFieldId = new Map<number, CustomFieldValue>();

  for (const entry of submitted) {
    const field = expectedById.get(entry.fieldId);
    // Unknown id, a field belonging to another product, or the same field twice
    if (!field || byFieldId.has(field.id)) return null;

    const value =
      field.inputType === "TEXT" ? checkText(field, entry.value) : checkNumber(field, entry.value);
    if (value === null) return null;

    byFieldId.set(field.id, value);
  }

  // A required field the customer never filled in makes the line unquotable.
  if (expected.some((field) => field.required && !byFieldId.has(field.id))) return null;

  // Built from `expected`, not from `submitted`, so the result is always in the
  // admin's own order ("กว้าง" before "สูง") and always carries every field the
  // customer was shown — including the optional ones they skipped.
  return expected.map((field) => ({ field, value: byFieldId.get(field.id) ?? null }));
}

/** The cleaned string, or null when it cannot be accepted at all. */
function checkText(field: CustomFieldRule, value: CustomFieldValue): string | null {
  if (typeof value !== "string") return null;

  const text = normalizeCustomText(value);
  // A blank answer is "not submitted"; sending it explicitly is a broken payload
  // for a required field and pointless noise for an optional one.
  if (text === "") return null;

  const limit = Math.min(field.maxLength ?? MAX_TEXT_FIELD_LENGTH, MAX_TEXT_FIELD_LENGTH);
  // Truncating instead would quietly change what the customer asked for, which
  // matters when the text is the wording to be etched onto the glass.
  if (text.length > limit) return null;

  return text;
}

function checkNumber(field: CustomFieldRule, value: CustomFieldValue): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  // A NUMBER field always carries bounds; a null here means a broken row rather
  // than "unbounded", and letting it through would defeat the whole check.
  if (field.minValue === null || field.maxValue === null) return null;

  const min = Number(field.minValue);
  const max = Number(field.maxValue);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (value < min || value > max) return null;

  const step = field.step === null ? 0 : Number(field.step);
  if (Number.isFinite(step) && step > 0) {
    const steps = (value - min) / step;
    if (Math.abs(steps - Math.round(steps)) > STEP_EPSILON) return null;
  }

  return value;
}

/**
 * "กว้าง: 1200 มม. · สลัก: สุขสันต์วันเกิด" — the same one-line shape as
 * `formatOptions` in the quotation action, so admin and LINE need no extra joins.
 *
 * Capped at 255 to match `QuotationItem.customFieldsTh`. `validateProductCustomFields`
 * stops an admin from configuring fields whose worst case would reach that cap,
 * so in practice this slice never fires.
 */
export function formatCustomFields(
  values: ResolvedCustomValue[],
  locale: "th" | "en",
): string | null {
  if (values.length === 0) return null;
  const parts = values.map(({ field, value }) => {
    const label = locale === "en" ? field.labelEn : field.labelTh;
    if (value === null) return `${label}: ${NOT_SPECIFIED[locale]}`;

    const unit = (locale === "en" ? field.unitEn : field.unitTh)?.trim();
    const shown = typeof value === "number" ? formatNumber(value) : value;
    // The unit belongs to a value; "ไม่ระบุ มม." above would read as nonsense.
    return unit ? `${label}: ${shown} ${unit}` : `${label}: ${shown}`;
  });
  return parts.join(" · ").slice(0, 255);
}

/** Drops trailing zeros so 1200 reads as "1200" and 1200.5 as "1200.5". */
function formatNumber(value: number): string {
  return String(Number(value.toFixed(3)));
}
