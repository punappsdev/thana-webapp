"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveCatalogAction } from "@/app/admin/(panel)/catalog/actions";
import { AdminSelect } from "@/components/admin/admin-select";
import { MediaField } from "@/components/admin/media-field";
import { useNoResetSubmit } from "@/components/admin/use-no-reset-submit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogResource } from "@/lib/admin/catalog-config";
import type { ActionResult } from "@/lib/admin/validation";

const initialState: ActionResult = { success: false, message: "" };
type Option = { id: number; nameTh: string };

export function CatalogEditor({ resource, edit, categories, attributes }: { resource: CatalogResource; edit?: Record<string, unknown>; categories: Option[]; attributes: Option[] }) {
  const [state, action, pending] = useActionState(saveCatalogAction, initialState);
  const handleSubmit = useNoResetSubmit(action);
  useEffect(() => { if (state.message) (state.success ? toast.success : toast.error)(state.message); }, [state]);
  const value = (name: string) => edit?.[name] == null ? "" : String(edit[name]);
  const checked = (name: string, fallback = false) => edit?.[name] == null ? fallback : Boolean(edit[name]);
  const field = (name: string, label: string, required = true, type = "text") => <div className="space-y-2"><Label htmlFor={name} className="font-label-md">{label}</Label><Input id={name} name={name} type={type} defaultValue={value(name)} required={required} className="font-body-sm" /></div>;
  const bilingual = !["brands", "attribute-values"].includes(resource);
  return <Card><CardHeader><CardTitle className="font-headline-sm">{edit ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</CardTitle></CardHeader>{/* Keyed so picking a different row re-seeds every defaultValue field instead of
      keeping the previously edited row's values. */}
  <CardContent><form key={String(edit?.id ?? "new")} onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
    <input type="hidden" name="resource" value={resource} /><input type="hidden" name="id" value={value("id")} />
    {["categories", "subcategories", "brands", "attributes", "attribute-values", "article-categories"].includes(resource) ? field("slug", "Slug") : null}
    {["units", "pricing-units"].includes(resource) ? field("code", "รหัส") : null}
    {resource === "brands" ? field("name", "ชื่อแบรนด์") : null}
    {bilingual ? <>{field("nameTh", "ชื่อภาษาไทย")}{field("nameEn", "ชื่อภาษาอังกฤษ")}</> : null}
    {resource === "attribute-values" ? <>{field("valueTh", "ค่าภาษาไทย")}{field("valueEn", "ค่าภาษาอังกฤษ")}{field("colorHex", "รหัสสี", false)}{field("numericValue", "ค่าตัวเลข", false, "number")}</> : null}
    {resource === "subcategories" ? <div className="space-y-2"><Label className="font-label-md">หมวดหมู่</Label><AdminSelect name="categoryId" defaultValue={value("categoryId") || undefined} placeholder="เลือกหมวดหมู่" className="w-full" options={categories.map((x) => ({ value: String(x.id), label: x.nameTh }))} /></div> : null}
    {resource === "attribute-values" ? <div className="space-y-2"><Label className="font-label-md">คุณลักษณะ</Label><AdminSelect name="attributeId" defaultValue={value("attributeId") || undefined} placeholder="เลือกคุณลักษณะ" className="w-full" options={attributes.map((x) => ({ value: String(x.id), label: x.nameTh }))} /></div> : null}
    {resource === "attributes" ? <><div className="space-y-2"><Label className="font-label-md">ชนิดช่องกรอก</Label><AdminSelect name="inputType" defaultValue={value("inputType") || "SELECT"} className="w-full" options={[{ value: "SELECT", label: "ตัวเลือก" }, { value: "COLOR", label: "สี" }, { value: "NUMBER", label: "ตัวเลข" }, { value: "TEXT", label: "ข้อความ" }]} /></div>{field("unit", "หน่วย", false)}</> : null}
    {resource === "brands" ? <><MediaField name="logo" label="โลโก้" accept="image" defaultValue={value("logo")} />{field("websiteUrl", "เว็บไซต์", false, "url")}</> : null}
    {["categories", "subcategories"].includes(resource) ? <MediaField name="coverImage" label="รูปปก" accept="image" defaultValue={value("coverImage")} /> : null}
    {resource === "categories" ? <><div className="space-y-2 md:col-span-2"><Label htmlFor="descriptionTh" className="font-label-md">คำอธิบายภาษาไทย</Label><Textarea id="descriptionTh" name="descriptionTh" defaultValue={value("descriptionTh")} className="font-body-sm" /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="descriptionEn" className="font-label-md">คำอธิบายภาษาอังกฤษ</Label><Textarea id="descriptionEn" name="descriptionEn" defaultValue={value("descriptionEn")} className="font-body-sm" /></div></> : null}
    {["categories", "subcategories", "attributes", "attribute-values"].includes(resource) ? field("sortOrder", "ลำดับ", false, "number") : null}
    {["categories", "subcategories"].includes(resource) ? <label className="flex items-center gap-2 font-label-md"><input type="checkbox" name="published" defaultChecked={checked("published", true)} />เผยแพร่</label> : null}
    <div className="md:col-span-2"><Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</Button></div>
  </form></CardContent></Card>;
}
