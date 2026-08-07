"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminSelect } from "@/components/admin/admin-select";
import { MAX_TEXT_FIELD_LENGTH } from "@/lib/quotation-custom-fields";
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

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const isText = field.inputType === "TEXT";
        // A token can disappear when the admin deletes the value it pointed at.
        // Saying so beats silently resetting the dropdown to the first option.
        const orphaned =
          field.triggerToken !== "" &&
          !triggerOptions.some((option) => option.value === field.triggerToken);

        return (
          <div key={field._key} className="space-y-4 rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-label-md">แสดงช่องนี้เมื่อลูกค้าเลือก</Label>
                  {/* Radix Select rejects an empty item value, so "none" stands in
                      for "not chosen yet" — the same sentinel the rest of the
                      admin forms use. */}
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

                <div className="space-y-2">
                  <Label className="font-label-md">ชนิดของช่อง</Label>
                  <AdminSelect
                    value={field.inputType}
                    onValueChange={(value) =>
                      update(field._key, { inputType: value === "TEXT" ? "TEXT" : "NUMBER" })
                    }
                    className="w-full font-body-sm"
                    options={[
                      { value: "NUMBER", label: "ตัวเลข (เช่น กว้าง 1200 มม.)" },
                      { value: "TEXT", label: "ข้อความ (เช่น 100x100)" },
                    ]}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="ลบช่องกรอก"
                onClick={() => onChange(fields.filter((item) => item._key !== field._key))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                label="ชื่อช่อง (ไทย)"
                placeholder={isText ? "เช่น 100x100" : "เช่น กว้าง"}
                value={field.labelTh}
                onChange={(value) => update(field._key, { labelTh: value })}
              />
              <TextField
                label="ชื่อช่อง (English)"
                placeholder={isText ? "e.g. 100x100" : "e.g. Width"}
                value={field.labelEn}
                onChange={(value) => update(field._key, { labelEn: value })}
              />
              <TextField
                label={isText ? "หน่วย (ไทย) — เว้นว่างได้" : "หน่วย (ไทย)"}
                placeholder="เช่น มม."
                value={field.unitTh}
                onChange={(value) => update(field._key, { unitTh: value })}
              />
              <TextField
                label={isText ? "หน่วย (English) — เว้นว่างได้" : "หน่วย (English)"}
                placeholder="e.g. mm"
                value={field.unitEn}
                onChange={(value) => update(field._key, { unitEn: value })}
              />
            </div>

            {isText ? (
              <div className="grid gap-3 md:grid-cols-3">
                <TextField
                  label="ความยาวสูงสุด (ตัวอักษร)"
                  type="number"
                  placeholder={String(MAX_TEXT_FIELD_LENGTH)}
                  value={field.maxLength}
                  onChange={(value) => update(field._key, { maxLength: value })}
                />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                <TextField
                  label="ค่าต่ำสุด"
                  type="number"
                  value={field.minValue}
                  onChange={(value) => update(field._key, { minValue: value })}
                />
                <TextField
                  label="ค่าสูงสุด"
                  type="number"
                  value={field.maxValue}
                  onChange={(value) => update(field._key, { maxValue: value })}
                />
                <TextField
                  label="กรอกทีละกี่หน่วย"
                  type="number"
                  value={field.step}
                  onChange={(value) => update(field._key, { step: value })}
                />
              </div>
            )}

            <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3">
              <Switch
                id={`custom-field-required-${field._key}`}
                checked={field.required}
                onCheckedChange={(checked) => update(field._key, { required: checked })}
              />
              <Label htmlFor={`custom-field-required-${field._key}`} className="font-label-md">
                บังคับกรอก
              </Label>
              <span className="font-body-sm text-muted-foreground">
                {field.required
                  ? "ลูกค้าจะกดขอใบเสนอราคาไม่ได้จนกว่าจะกรอกช่องนี้"
                  : "ลูกค้าเว้นว่างได้ ถ้าเว้นไว้จะขึ้นในคำขอว่า “ไม่ระบุ”"}
              </span>
            </div>

            {/* ขอบเขตนี้ถูกตรวจซ้ำที่ฝั่งเซิร์ฟเวอร์ตอนลูกค้าส่งคำขอ ไม่ใช่แค่ hint
                ของช่องกรอก — ค่าที่ลูกค้าพิมพ์มาจากตะกร้าในเบราว์เซอร์ซึ่งแก้ได้
                ช่องข้อความไม่มีคำอธิบายนี้ เพราะขอบเขตมีแค่ความยาวซึ่งบอกอยู่ที่ช่องแล้ว */}
            {!isText && (
              <p className="font-body-sm text-muted-foreground">
                ลูกค้าจะกรอกได้เฉพาะในช่วงนี้เท่านั้น ทั้งบนหน้าเว็บและตอนส่งคำขอเข้าระบบ
                กรุณาใส่ขนาดที่โรงงานตัดได้จริง
              </p>
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...fields, newCustomFieldDraft()])}>
        <Plus className="size-3.5" />
        เพิ่มช่องให้ลูกค้ากรอกเอง
      </Button>
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
    <div className="space-y-2">
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
