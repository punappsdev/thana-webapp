"use client";

import { useActionState, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import { saveCatalogAction } from "@/app/admin/(panel)/catalog/actions";
import { AdminSelect } from "@/components/admin/admin-select";
import { MediaField } from "@/components/admin/media-field";
import { useNoResetSubmit } from "@/components/admin/use-no-reset-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CatalogResource } from "@/lib/admin/catalog-config";
import type { ActionResult } from "@/lib/admin/validation";

const initialState: ActionResult = { success: false, message: "" };
type Option = { id: number; nameTh: string };

export function CatalogEditor({ resource, edit, categories, attributes, onSaved }: { resource: CatalogResource; edit?: Record<string, unknown>; categories: Option[]; attributes: Option[]; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(saveCatalogAction, initialState);
  const handleSubmit = useNoResetSubmit(action);
  const [showAdvanced, setShowAdvanced] = useState(false);
  useEffect(() => {
    if (!state.message) return;
    if (state.success) { toast.success(state.message); onSaved?.(); }
    else toast.error(state.message);
    // onSaved is intentionally omitted — it changes identity every render and we
    // only want to react to a settled action result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const value = (name: string) => edit?.[name] == null ? "" : String(edit[name]);
  const checked = (name: string, fallback = false) => edit?.[name] == null ? fallback : Boolean(edit[name]);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  const field = (name: string, label: string, required = true, type = "text", hint?: string, className?: string) => (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className="font-label-md">{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={value(name)} required={required} className="font-body-sm" />
      {hint ? <p className="font-body-sm text-muted-foreground">{hint}</p> : null}
      {fieldError(name) ? <p className="font-body-sm text-destructive">{fieldError(name)}</p> : null}
    </div>
  );

  const bilingual = !["brands", "attribute-values"].includes(resource);
  const usesSlug = ["categories", "subcategories", "brands", "attributes", "attribute-values", "article-categories"].includes(resource);
  const usesCode = ["units", "pricing-units"].includes(resource);
  const hasSortOrder = ["categories", "subcategories", "attributes", "attribute-values"].includes(resource);

  return (
    // Keyed by the edited row so switching rows re-seeds every defaultValue field.
    <form key={String(edit?.id ?? "new")} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="resource" value={resource} />
      <input type="hidden" name="id" value={value("id")} />

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          {resource === "brands" ? field("name", "ชื่อแบรนด์", true, "text", undefined, "sm:col-span-2") : null}
          {bilingual ? <>{field("nameTh", "ชื่อ (ภาษาไทย)")}{field("nameEn", "ชื่อ (ภาษาอังกฤษ)")}</> : null}
          {resource === "attribute-values" ? <>{field("valueTh", "ค่า (ภาษาไทย)")}{field("valueEn", "ค่า (ภาษาอังกฤษ)")}{field("colorHex", "รหัสสี (ถ้ามี)", false, "text", "เช่น #FF0000 สำหรับสีแดง")}{field("numericValue", "ค่าตัวเลข (ถ้ามี)", false, "number", "เช่น 10 สำหรับความหนา 10 มม.")}</> : null}

          {resource === "subcategories" ? (
            <div className="space-y-2 sm:col-span-2">
              <Label className="font-label-md">หมวดหมู่หลัก</Label>
              <AdminSelect name="categoryId" defaultValue={value("categoryId") || undefined} placeholder="เลือกหมวดหมู่" className="w-full font-body-sm" options={categories.map((x) => ({ value: String(x.id), label: x.nameTh }))} />
              <p className="font-body-sm text-muted-foreground">หมวดหมู่ย่อยนี้จะอยู่ภายใต้หมวดหมู่หลักที่เลือก</p>
            </div>
          ) : null}
          {resource === "attribute-values" ? (
            <div className="space-y-2 sm:col-span-2">
              <Label className="font-label-md">คุณลักษณะ</Label>
              <AdminSelect name="attributeId" defaultValue={value("attributeId") || undefined} placeholder="เลือกคุณลักษณะ" className="w-full font-body-sm" options={attributes.map((x) => ({ value: String(x.id), label: x.nameTh }))} />
              <p className="font-body-sm text-muted-foreground">ค่านี้เป็นตัวเลือกของคุณลักษณะใด เช่น “สีแดง” อยู่ใต้ “สี”</p>
            </div>
          ) : null}

          {resource === "attributes" ? (
            <>
              <div className="space-y-2">
                <Label className="font-label-md">ชนิดข้อมูล</Label>
                <AdminSelect name="inputType" defaultValue={value("inputType") || "SELECT"} className="w-full font-body-sm" options={[{ value: "SELECT", label: "ตัวเลือก (เลือกจากรายการ)" }, { value: "COLOR", label: "สี" }, { value: "NUMBER", label: "ตัวเลข" }, { value: "TEXT", label: "ข้อความ" }]} />
                <p className="font-body-sm text-muted-foreground">รูปแบบของค่าที่จะกรอกในคุณลักษณะนี้</p>
              </div>
              {field("unit", "หน่วย (ถ้ามี)", false, "text", "เช่น มม., นิ้ว")}
            </>
          ) : null}

          {resource === "brands" ? <><div className="sm:col-span-2"><MediaField name="logo" label="โลโก้ (ถ้ามี)" accept="image" defaultValue={value("logo")} /></div>{field("websiteUrl", "เว็บไซต์ (ถ้ามี)", false, "url", undefined, "sm:col-span-2")}</> : null}
          {["categories", "subcategories"].includes(resource) ? <div className="sm:col-span-2"><MediaField name="coverImage" label="รูปปก (ถ้ามี)" accept="image" defaultValue={value("coverImage")} /></div> : null}

          {resource === "categories" ? (
            <>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="descriptionTh" className="font-label-md">คำอธิบาย (ภาษาไทย)</Label><Textarea id="descriptionTh" name="descriptionTh" defaultValue={value("descriptionTh")} className="font-body-sm" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="descriptionEn" className="font-label-md">คำอธิบาย (ภาษาอังกฤษ)</Label><Textarea id="descriptionEn" name="descriptionEn" defaultValue={value("descriptionEn")} className="font-body-sm" /></div>
            </>
          ) : null}

          {["categories", "subcategories"].includes(resource) ? (
            <label className="flex items-center gap-2 font-label-md sm:col-span-2"><input type="checkbox" name="published" defaultChecked={checked("published", true)} className="size-4" />เผยแพร่บนเว็บไซต์</label>
          ) : null}
        </div>

        {/* Advanced: slug/code stay mounted (only visually collapsed) so their
            values still submit and an edited row keeps its existing slug. */}
        <div className="border-t pt-3">
          <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="flex items-center gap-1 font-label-sm text-muted-foreground hover:text-foreground">
            {showAdvanced ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}ตัวเลือกขั้นสูง
          </button>
          <div className={cn("mt-3 grid gap-4 sm:grid-cols-2", !showAdvanced && "hidden")}>
            {usesSlug ? field("slug", "ชื่อในลิงก์ (URL)", false, "text", "เว้นว่างเพื่อให้ระบบสร้างให้อัตโนมัติ") : null}
            {usesCode ? field("code", "รหัส", false, "text", "เว้นว่างเพื่อให้ระบบสร้างให้อัตโนมัติ") : null}
            {hasSortOrder ? field("sortOrder", "ลำดับการแสดง", false, "number", "ตัวเลขน้อยแสดงก่อน") : null}
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-end gap-2 border-t px-5 py-4">
        <Button type="submit" disabled={pending}><Save className="size-4" />{pending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</Button>
      </div>
    </form>
  );
}
