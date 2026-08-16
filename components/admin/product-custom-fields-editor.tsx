"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminSelect } from "@/components/admin/admin-select";
import { MAX_CUSTOM_FIELDS, MAX_TEXT_FIELD_LENGTH } from "@/lib/quotation-custom-fields";
import type { ValueToken, VariantAxis } from "@/components/admin/product-variants-table";

/**
 * A field the customer fills in — a measurement such as the width of a
 * cut-to-size sheet, or free text such as the wording to be etched onto it.
 *
 * It hangs off one of the product's own option values: pick "สั่งตัดตามขนาด" on
 * the storefront and these appear; pick a stock size and they do not.
 *
 * The trigger is addressed by the same `ValueToken` the variant table uses, so a
 * value the admin typed a moment ago can be chosen before it exists in the
 * database; the save action resolves tokens to ids inside its transaction.
 */
export type ProductCustomFieldDraft = {
  _key: string;
  triggerToken: ValueToken | "";
  inputType: "NUMBER" | "TEXT";
  labelTh: string;
  labelEn: string;
  unitTh: string;
  unitEn: string;
  /** Kept as strings so a half-typed "12." survives while the admin is editing. */
  minValue: string;
  maxValue: string;
  step: string;
  maxLength: string;
  required: boolean;
};

const NO_TRIGGER = "none";

export function newCustomFieldDraft(): ProductCustomFieldDraft {
  return {
    _key: crypto.randomUUID(),
    triggerToken: "",
    inputType: "NUMBER",
    labelTh: "",
    labelEn: "",
    unitTh: "",
    unitEn: "",
    minValue: "",
    maxValue: "",
    step: "1",
    maxLength: "",
    required: true,
  };
}

export function ProductCustomFieldList({
  fields,
  axes,
  onChange,
}: {
  fields: ProductCustomFieldDraft[];
  axes: VariantAxis[];
  onChange: (next: ProductCustomFieldDraft[]) => void;
}) {
  // Flattened across every axis: an admin thinks "show this when they pick X",
  // not "show this when axis 2 is X".
  const triggerOptions = axes.flatMap((axis) =>
    axis.options.map((option) => ({ value: option.token, label: `${axis.label}: ${option.label}` })),
  );

  const update = (key: string, patch: Partial<ProductCustomFieldDraft>) =>
    onChange(fields.map((field) => (field._key === key ? { ...field, ...patch } : field)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  if (triggerOptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4">
        <p className="font-body-sm text-muted-foreground">
          ต้องมีตัวเลือกที่ลูกค้าเลือกได้อย่างน้อยหนึ่งค่าก่อน เช่นเพิ่มค่า &ldquo;สั่งตัดตามขนาด&rdquo;
          ไว้ในตัวเลือก &ldquo;ขนาด&rdquo; แล้วจึงกลับมาสร้างช่องกรอกที่ผูกกับค่านั้น
        </p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
        <p className="font-label-md font-medium text-foreground">ยังไม่มีช่องกรอกสำหรับสินค้าสั่งตัด</p>
        <p className="mt-1 font-body-sm text-muted-foreground">
          เพิ่มช่องเพื่อให้ลูกค้ากรอกขนาดสั่งตัด (กว้าง/สูง) หรือข้อความสั่งทำเมื่อลูกค้าเลือกตัวเลือกที่กำหนด
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...fields, newCustomFieldDraft()])}
          className="mt-4 gap-1.5"
        >
          <Plus className="size-4" />
          เพิ่มช่อง
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const isText = field.inputType === "TEXT";
        const orphaned =
          field.triggerToken !== "" &&
          !triggerOptions.some((option) => option.value === field.triggerToken);

        const fieldTitle = field.labelTh
          ? field.labelEn
            ? `${field.labelTh} (${field.labelEn})`
            : field.labelTh
          : field.labelEn;

        return (
          <div
            key={field._key}
            className="space-y-4 rounded-lg border bg-card p-4 transition-colors"
          >
            {/* Header: Title & Actions */}
            <div className="flex items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="font-label-md font-semibold text-foreground">
                  ช่องที่ {index + 1}
                </span>
                {fieldTitle ? (
                  <span className="font-label-sm text-muted-foreground">
                    — {fieldTitle}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="เลื่อนขึ้น"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="เลื่อนลง"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, 1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="ลบช่องกรอก"
                  onClick={() => onChange(fields.filter((item) => item._key !== field._key))}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {/* Row 1: Trigger & Input Type */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="font-label-sm">แสดงช่องนี้เมื่อลูกค้าเลือก</Label>
                <AdminSelect
                  value={orphaned || field.triggerToken === "" ? NO_TRIGGER : field.triggerToken}
                  onValueChange={(value) =>
                    update(field._key, { triggerToken: value === NO_TRIGGER ? "" : value })
                  }
                  className="w-full font-body-sm"
                  options={[
                    { value: NO_TRIGGER, label: "— เลือกค่าที่จะเปิดช่องนี้ —" },
                    ...triggerOptions,
                  ]}
                />
                {orphaned ? (
                  <p className="font-label-sm text-destructive">
                    ค่าที่เคยผูกไว้ถูกลบไปแล้ว กรุณาเลือกค่าใหม่
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label className="font-label-sm">ชนิดของช่อง</Label>
                <AdminSelect
                  value={field.inputType}
                  onValueChange={(value) =>
                    update(field._key, { inputType: value === "TEXT" ? "TEXT" : "NUMBER" })
                  }
                  className="w-full font-body-sm"
                  options={[
                    { value: "NUMBER", label: "ตัวเลข (เช่น กว้าง 1200 มม.)" },
                    { value: "TEXT", label: "ข้อความ (เช่น 100x100 หรือข้อความสั่งทำ)" },
                  ]}
                />
              </div>
            </div>

            {/* Row 2: Labels and Units (Thai & English) */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TextField
                label="ชื่อช่อง (ไทย)"
                placeholder={isText ? "เช่น ข้อความสลัก" : "เช่น กว้าง"}
                value={field.labelTh}
                onChange={(value) => update(field._key, { labelTh: value })}
              />
              <TextField
                label={isText ? "หน่วย (ไทย) — เว้นว่างได้" : "หน่วย (ไทย)"}
                placeholder={isText ? "เช่น ตัวอักษร" : "เช่น มม."}
                value={field.unitTh}
                onChange={(value) => update(field._key, { unitTh: value })}
              />
              <TextField
                label="ชื่อช่อง (English)"
                placeholder={isText ? "e.g. Text" : "e.g. Width"}
                value={field.labelEn}
                onChange={(value) => update(field._key, { labelEn: value })}
              />
              <TextField
                label={isText ? "หน่วย (English) — เว้นว่างได้" : "หน่วย (English)"}
                placeholder={isText ? "Optional" : "e.g. mm"}
                value={field.unitEn}
                onChange={(value) => update(field._key, { unitEn: value })}
              />
            </div>

            {/* Row 3: Constraints */}
            {isText ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField
                  label="ความยาวสูงสุด (ตัวอักษร)"
                  type="number"
                  placeholder={String(MAX_TEXT_FIELD_LENGTH)}
                  value={field.maxLength}
                  onChange={(value) => update(field._key, { maxLength: value })}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextField
                    label="ค่าต่ำสุด"
                    type="number"
                    placeholder="เช่น 100"
                    value={field.minValue}
                    onChange={(value) => update(field._key, { minValue: value })}
                  />
                  <TextField
                    label="ค่าสูงสุด"
                    type="number"
                    placeholder="เช่น 2400"
                    value={field.maxValue}
                    onChange={(value) => update(field._key, { maxValue: value })}
                  />
                  <TextField
                    label="กรอกทีละกี่หน่วย"
                    type="number"
                    placeholder="1"
                    value={field.step}
                    onChange={(value) => update(field._key, { step: value })}
                  />
                </div>
                <p className="font-body-sm text-muted-foreground">
                  ลูกค้าจะกรอกได้เฉพาะในช่วงนี้เท่านั้น ทั้งบนหน้าเว็บและตอนส่งคำขอเข้าระบบ (ใส่ขนาดที่โรงงานตัดได้จริง)
                </p>
              </div>
            )}

            {/* Row 4: Required Switch */}
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id={`custom-field-required-${field._key}`}
                checked={field.required}
                onCheckedChange={(checked) => update(field._key, { required: checked })}
              />
              <div className="flex flex-wrap items-center gap-x-2">
                <Label
                  htmlFor={`custom-field-required-${field._key}`}
                  className="cursor-pointer font-label-sm font-medium"
                >
                  บังคับกรอก
                </Label>
                <span className="font-body-sm text-muted-foreground">
                  {field.required
                    ? "— ลูกค้าจะกดขอใบเสนอราคาไม่ได้จนกว่าจะกรอกช่องนี้"
                    : "— ลูกค้าเว้นว่างได้ ถ้าเว้นไว้จะขึ้นในคำขอว่า “ไม่ระบุ”"}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={fields.length >= MAX_CUSTOM_FIELDS}
          onClick={() => onChange([...fields, newCustomFieldDraft()])}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          เพิ่มช่อง
        </Button>
        {fields.length > 0 ? (
          <span className="font-label-sm text-muted-foreground">
            {fields.length} / {MAX_CUSTOM_FIELDS} ช่อง
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-label-sm">{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="font-body-sm"
      />
    </div>
  );
}
