// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  VariantSelector,
  type AttributeGroup,
  type CustomFieldOption,
  type VariantOption,
} from "@/components/products/variant-selector";

// Vitest runs without `globals`, so Testing Library never registers its own
// auto-cleanup — without this each test would inherit the previous DOM.
afterEach(cleanup);

const STOCK_VALUE_ID = 260;
const CUT_VALUE_ID = 269;

const groups: AttributeGroup[] = [
  {
    id: 1,
    name: "ขนาด",
    nameTh: "ขนาด",
    nameEn: "Size",
    unit: null,
    inputType: "SELECT",
    values: [
      { id: STOCK_VALUE_ID, label: "1200 x 2400 มม.", valueTh: "1200 x 2400 มม.", valueEn: "1200 x 2400 mm", colorHex: null },
      { id: CUT_VALUE_ID, label: "สั่งตัดตามขนาด", valueTh: "สั่งตัดตามขนาด", valueEn: "Custom Cut", colorHex: null },
    ],
  },
];

const variants: VariantOption[] = [
  { id: 10, sku: "STD", isAvailable: true, isDefault: true, valueIds: [STOCK_VALUE_ID] },
  { id: 11, sku: "CUT", isAvailable: true, isDefault: false, valueIds: [CUT_VALUE_ID] },
];

const customFields: CustomFieldOption[] = [
  {
    id: 1,
    inputType: "NUMBER",
    triggerValueId: CUT_VALUE_ID,
    label: "กว้าง",
    unit: "มม.",
    labelTh: "กว้าง",
    labelEn: "Width",
    unitTh: "มม.",
    unitEn: "mm",
    min: 100,
    max: 2400,
    step: 10,
    maxLength: null,
    required: true,
    hintLabel: "กรอกได้ตั้งแต่ 100 ถึง 2400 มม.",
    rangeLabel: "กรอกได้ตั้งแต่ 100 ถึง 2400 มม.",
    stepLabel: "กรอกเป็นช่วงละ 10 มม.",
  },
];

/** A required note and an optional one, both on the cut-to-size trigger. */
const NOTE_FIELD: CustomFieldOption = {
  id: 2,
  inputType: "TEXT",
  triggerValueId: CUT_VALUE_ID,
  label: "ข้อความสลัก",
  unit: null,
  labelTh: "ข้อความสลัก",
  labelEn: "Engraving",
  unitTh: null,
  unitEn: null,
  min: null,
  max: null,
  step: null,
  maxLength: 20,
  required: true,
  hintLabel: "กรอกได้ไม่เกิน 20 ตัวอักษร",
  rangeLabel: "กรอกได้ไม่เกิน 20 ตัวอักษร",
  stepLabel: "",
};

const labels = {
  selectOptions: "เลือกคุณสมบัติสินค้า",
  selectAllPrompt: "กรุณาเลือกคุณสมบัติให้ครบ",
  unavailable: "ไม่มีสินค้าตามคุณสมบัติที่เลือก",
  sku: "รหัสสินค้า",
  customFieldsPrompt: "ระบุขนาดที่ต้องการ",
  customFieldsIncomplete: "กรุณากรอกขนาดให้ครบก่อนเพิ่มลงในรายการ",
  customFieldOptional: "(ไม่บังคับ)",
};

/** `cartProduct` is omitted so the test needs no cart or i18n provider. */
function renderSelector(fields: CustomFieldOption[] = customFields) {
  return render(
    <VariantSelector groups={groups} variants={variants} baseSku="BASE" customFields={fields} labels={labels} />,
  );
}

const widthInput = () => screen.queryByLabelText("กว้าง (มม.)") as HTMLInputElement | null;

describe("VariantSelector custom measurements", () => {
  it("hides the measurement box until the cut-to-size option is picked", () => {
    renderSelector();
    // The default variant is the stock sheet, so nothing to type into yet.
    expect(widthInput()).toBeNull();

    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));
    expect(widthInput()).not.toBeNull();
  });

  it("hides it again when the customer goes back to a stock size", () => {
    renderSelector();
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));
    fireEvent.click(screen.getByText("1200 x 2400 มม."));

    expect(widthInput()).toBeNull();
    // And the stock sheet stays quotable rather than being blocked by a field
    // the customer can no longer see.
    expect(screen.queryByText(labels.customFieldsIncomplete)).toBeNull();
  });

  it("asks for the measurement before the product can be quoted", () => {
    renderSelector();
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));

    expect(screen.getByText(labels.customFieldsIncomplete)).toBeTruthy();
  });

  it("shows the bounds up front and stays quiet until something is typed", () => {
    renderSelector();
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));

    const input = widthInput()!;
    expect(screen.getByText("กรอกได้ตั้งแต่ 100 ถึง 2400 มม.")).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("flags a measurement the factory cannot cut", () => {
    renderSelector();
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));
    fireEvent.change(widthInput()!, { target: { value: "30000" } });

    expect(widthInput()!.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(labels.customFieldsIncomplete)).toBeTruthy();
  });

  it("flags a measurement off the step grid with its own message", () => {
    renderSelector();
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));
    fireEvent.change(widthInput()!, { target: { value: "1205" } });

    expect(screen.getByText("กรอกเป็นช่วงละ 10 มม.")).toBeTruthy();
  });

  it("clears the prompt once a valid measurement is entered", () => {
    renderSelector();
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));
    fireEvent.change(widthInput()!, { target: { value: "1200" } });

    expect(widthInput()!.getAttribute("aria-invalid")).toBe("false");
    expect(screen.queryByText(labels.customFieldsIncomplete)).toBeNull();
    // The variant's own code appears only once the line is actually quotable.
    expect(screen.getByText(/CUT/)).toBeTruthy();
  });
});

const noteInput = () => screen.queryByLabelText(/ข้อความสลัก/) as HTMLInputElement | null;

describe("VariantSelector free text fields", () => {
  it("renders a text box, not a number box", () => {
    renderSelector([NOTE_FIELD]);
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));

    const input = noteInput()!;
    expect(input.getAttribute("type")).toBe("text");
    // The browser must not offer the customer's saved name or address here.
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(input.getAttribute("maxlength")).toBe("20");
  });

  it("blocks the quote until a required note is filled in", () => {
    renderSelector([NOTE_FIELD]);
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));
    expect(screen.getByText(labels.customFieldsIncomplete)).toBeTruthy();

    fireEvent.change(noteInput()!, { target: { value: "สุขสันต์วันเกิด" } });
    expect(screen.queryByText(labels.customFieldsIncomplete)).toBeNull();
  });

  it("treats whitespace as still empty", () => {
    renderSelector([NOTE_FIELD]);
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));
    fireEvent.change(noteInput()!, { target: { value: "   " } });

    expect(screen.getByText(labels.customFieldsIncomplete)).toBeTruthy();
    // Not an error either — the customer has not really typed anything yet.
    expect(noteInput()!.getAttribute("aria-invalid")).toBe("false");
  });

  it("lets an optional note be skipped entirely", () => {
    renderSelector([{ ...NOTE_FIELD, required: false }]);
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));

    expect(noteInput()).not.toBeNull();
    expect(screen.queryByText(labels.customFieldsIncomplete)).toBeNull();
    expect(screen.getByText(labels.customFieldOptional)).toBeTruthy();
  });

  it("does not mark an optional field as optional when it is required", () => {
    renderSelector([NOTE_FIELD]);
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));

    expect(screen.queryByText(labels.customFieldOptional)).toBeNull();
  });

  it("mixes measurements and a note under the same option", () => {
    renderSelector([...customFields, { ...NOTE_FIELD, required: false }]);
    fireEvent.click(screen.getByText("สั่งตัดตามขนาด"));

    expect(widthInput()).not.toBeNull();
    expect(noteInput()).not.toBeNull();
    // The measurement is still required even though the note is not.
    expect(screen.getByText(labels.customFieldsIncomplete)).toBeTruthy();

    fireEvent.change(widthInput()!, { target: { value: "1200" } });
    expect(screen.queryByText(labels.customFieldsIncomplete)).toBeNull();
  });
});
