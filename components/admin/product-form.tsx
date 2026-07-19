"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, ImagePlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveProductAction } from "@/app/admin/(panel)/products/actions";
import { AdminSelect } from "@/components/admin/admin-select";
import {
  ProductAttributeList,
  newAttributeKey,
  type DictionaryAttribute,
  type ProductAttributeDraft,
} from "@/components/admin/product-attributes-editor";
import {
  ProductVariantsTable,
  buildAxes,
  combinationKey,
  existingToken,
  syncVariants,
  type VariantRow,
} from "@/components/admin/product-variants-table";
import { FormTabPanel } from "@/components/admin/form-tab-panel";
import { MediaField } from "@/components/admin/media-field";
import { useNoResetSubmit } from "@/components/admin/use-no-reset-submit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { slugifyAdminTitle, type ActionResult } from "@/lib/admin/validation";

type CategoryOption = { id: number; nameTh: string; nameEn: string; subCategories: { id: number; nameTh: string }[] };
type Option = { id: number; name?: string; nameTh?: string };
type ImageRow = { _key?: string; url: string; altTh: string; altEn: string; sortOrder: number };

type SavedAttribute = {
  attributeId: number;
  nameTh: string;
  nameEn: string;
  isVariantAxis: boolean;
  sortOrder: number;
  valueIds: number[];
};

type SavedVariant = {
  sku: string;
  price: number;
  image: string;
  isAvailable: boolean;
  isDefault: boolean;
  sortOrder: number;
  attributeValueIds: number[];
};

type ProductRecord = {
  id: number;
  updatedAt: Date;
  slug: string;
  sku: string;
  nameTh: string;
  nameEn: string;
  descriptionTh: string | null;
  descriptionEn: string | null;
  usageGuideTh: string | null;
  usageGuideEn: string | null;
  coverImage: string | null;
  catalogPdf: string | null;
  basePrice: number | null;
  currency: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  categoryId: number | null;
  subCategoryId: number | null;
  brandId: number | null;
  unitId: number | null;
  pricingUnitId: number | null;
  images: ImageRow[];
  attributes: SavedAttribute[];
  variants: SavedVariant[];
};

type EditorOptions = {
  categories: CategoryOption[];
  attributes: DictionaryAttribute[];
  brands: Option[];
  units: Option[];
  pricingUnits: Option[];
};

const initialState: ActionResult = { success: false, message: "" };


export function ProductForm({ record, options }: { record: ProductRecord | null; options: EditorOptions }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveProductAction, initialState);
  const handleSubmit = useNoResetSubmit(action);
  const dirtyRef = useRef(false);
  const markDirty = () => {
    dirtyRef.current = true;
  };

  const [categoryId, setCategoryId] = useState(record?.categoryId ? String(record.categoryId) : "none");
  const category = options.categories.find((item) => item.id === Number(categoryId));
  const [titleEn, setTitleEn] = useState(record?.nameEn || "");
  const [slug, setSlug] = useState(record?.slug || "");

  const [images, setImages] = useState<ImageRow[]>(() =>
    (record?.images || []).map((image, index) => ({ ...image, _key: `image-${index}-${image.url}` })),
  );

  const [attributes, setAttributes] = useState<ProductAttributeDraft[]>(() =>
    (record?.attributes || []).map((attribute) => ({
      _key: newAttributeKey(),
      attributeId: attribute.attributeId,
      newNameTh: "",
      newNameEn: "",
      isVariantAxis: attribute.isVariantAxis,
      valueIds: attribute.valueIds,
      newValues: [],
    })),
  );

  const [variants, setVariants] = useState<VariantRow[]>(() =>
    (record?.variants || []).map((variant, index) => ({
      _key: `variant-${index}`,
      sku: variant.sku,
      price: variant.price,
      image: variant.image,
      isAvailable: variant.isAvailable,
      isDefault: variant.isDefault,
      sortOrder: variant.sortOrder,
      valueTokens: variant.attributeValueIds.map(existingToken),
    })),
  );

  const axes = useMemo(() => buildAxes(attributes, options.attributes), [attributes, options.attributes]);

  /**
   * The price rows are a pure function of the options, so keep them in step
   * automatically instead of behind a "generate" button the admin had to
   * remember to press. Rows for combinations that still exist keep whatever was
   * typed into them; the identity check stops this from looping.
   */
  const axesSignature = useMemo(
    () => JSON.stringify(axes.map((axis) => [axis.attributeKey, axis.options.map((option) => option.token)])),
    [axes],
  );
  const [syncedSignature, setSyncedSignature] = useState(axesSignature);
  if (syncedSignature !== axesSignature) {
    // Adjusting state during render — React's documented way to react to a
    // changed prop/derived value without an extra render pass.
    setSyncedSignature(axesSignature);
    const next = syncVariants(variants, axes);
    const unchanged =
      variants.length === next.length &&
      variants.every((row, index) => combinationKey(row.valueTokens) === combinationKey(next[index].valueTokens));
    if (!unchanged) setVariants(next);
  }

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    if (state.success) {
      dirtyRef.current = false;
      toast.success(state.message);
      router.push("/admin/products");
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  const optionLabel = (option: Option) => option.name || option.nameTh || String(option.id);

  // Serialized for the server action. Attributes carry either an existing id or
  // a name to create; variants address values by token so newly typed values
  // can be referenced before they exist in the database.
  const attributesPayload = attributes.map((attribute, index) => ({
    attributeId: attribute.attributeId,
    newNameTh: attribute.newNameTh,
    newNameEn: attribute.newNameEn,
    isVariantAxis: attribute.isVariantAxis,
    sortOrder: index,
    valueIds: attribute.valueIds,
    newValues: attribute.newValues.map((value) => ({ key: value._key, valueTh: value.valueTh, valueEn: value.valueEn })),
  }));

  // An empty price stays empty so the action can reject it, rather than being
  // silently written to the database as 0.
  const variantsPayload = variants.map((variant, index) => ({
    sku: variant.sku,
    price: variant.price,
    image: variant.image,
    isAvailable: variant.isAvailable,
    isDefault: variant.isDefault,
    sortOrder: index,
    valueTokens: variant.valueTokens,
  }));

  return (
    <form onSubmit={handleSubmit} onChange={markDirty} className="space-y-6">
      <input type="hidden" name="id" value={record?.id || ""} />
      <input type="hidden" name="updatedAt" value={record?.updatedAt ? new Date(record.updatedAt).toISOString() : ""} />
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} readOnly />
      <input type="hidden" name="attributesJson" value={JSON.stringify(attributesPayload)} readOnly />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variantsPayload)} readOnly />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline-lg font-semibold">{record ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</h1>
          <p className="font-body-sm text-muted-foreground">จัดการข้อมูล รูปภาพ คุณลักษณะ และตัวเลือกใน transaction เดียว</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {record ? (
            <Button asChild variant="outline">
              <Link href={`/admin/preview/products/${record.id}`} target="_blank">
                <Eye className="size-4" />
                Preview
              </Link>
            </Button>
          ) : null}
          <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
            <Save className="size-4" />
            บันทึกร่าง
          </Button>
          <Button type="submit" name="intent" value="publish" disabled={pending}>
            เผยแพร่
          </Button>
        </div>
      </div>

      {state.conflict ? (
        <p className="rounded-md border border-destructive bg-error-container p-3 font-body-sm text-on-error-container">{state.message}</p>
      ) : null}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="general" className="font-label-md">ข้อมูลหลัก</TabsTrigger>
          <TabsTrigger value="attributes" className="font-label-md">คุณลักษณะและตัวเลือก ({variants.length})</TabsTrigger>
          <TabsTrigger value="media" className="font-label-md">รูปและเอกสาร</TabsTrigger>
        </TabsList>

        <FormTabPanel value="general" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline-sm">ชื่อและรายละเอียด</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="th">
                  <TabsList>
                    <TabsTrigger value="th" className="font-label-md">ไทย</TabsTrigger>
                    <TabsTrigger value="en" className="font-label-md">English</TabsTrigger>
                  </TabsList>
                  <FormTabPanel value="th" className="mt-5 space-y-4">
                    <Field label="ชื่อสินค้า">
                      <Input name="nameTh" defaultValue={record?.nameTh} className="font-body-sm" />
                    </Field>
                    <Field label="คำอธิบาย">
                      <Textarea name="descriptionTh" defaultValue={record?.descriptionTh || ""} rows={6} className="font-body-sm" />
                    </Field>
                    <Field label="คำแนะนำการใช้งาน">
                      <Textarea name="usageGuideTh" defaultValue={record?.usageGuideTh || ""} rows={4} className="font-body-sm" />
                    </Field>
                  </FormTabPanel>
                  <FormTabPanel value="en" className="mt-5 space-y-4">
                    <Field label="Product name">
                      <Input
                        name="nameEn"
                        value={titleEn}
                        onChange={(event) => setTitleEn(event.target.value)}
                        onBlur={() => {
                          if (!slug) setSlug(slugifyAdminTitle(titleEn));
                        }}
                        className="font-body-sm"
                      />
                    </Field>
                    <Field label="Description">
                      <Textarea name="descriptionEn" defaultValue={record?.descriptionEn || ""} rows={6} className="font-body-sm" />
                    </Field>
                    <Field label="Usage guide">
                      <Textarea name="usageGuideEn" defaultValue={record?.usageGuideEn || ""} rows={4} className="font-body-sm" />
                    </Field>
                  </FormTabPanel>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline-sm">รหัสและราคา</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Slug">
                  <Input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} className="font-body-sm" />
                </Field>
                <Field label="SKU หลัก">
                  <Input name="sku" defaultValue={record?.sku} className="font-body-sm" />
                </Field>
                <Field label="ราคาฐาน">
                  <Input name="basePrice" type="number" min="0" step="0.01" defaultValue={record?.basePrice ?? ""} className="font-body-sm" />
                </Field>
                <Field label="สกุลเงิน">
                  <Input name="currency" defaultValue={record?.currency || "THB"} className="font-body-sm" />
                </Field>
                <Field label="ลำดับ">
                  <Input name="sortOrder" type="number" defaultValue={record?.sortOrder || 0} className="font-body-sm" />
                </Field>
                <label className="flex items-center gap-2 font-label-md">
                  <input name="featured" type="checkbox" defaultChecked={record?.featured} />
                  สินค้าแนะนำ
                </label>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">การจัดหมวดหมู่</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SelectField name="categoryId" label="หมวดหมู่" value={categoryId} onChange={setCategoryId} options={options.categories.map((item) => ({ id: item.id, label: item.nameTh }))} />
                <SelectField name="subCategoryId" label="หมวดหมู่ย่อย" defaultValue={record?.subCategoryId} options={(category?.subCategories || []).map((item) => ({ id: item.id, label: item.nameTh }))} />
                <SelectField name="brandId" label="แบรนด์" defaultValue={record?.brandId} options={options.brands.map((item) => ({ id: item.id, label: optionLabel(item) }))} />
                <SelectField name="unitId" label="หน่วยสินค้า" defaultValue={record?.unitId} options={options.units.map((item) => ({ id: item.id, label: optionLabel(item) }))} />
                <SelectField name="pricingUnitId" label="หน่วยราคา" defaultValue={record?.pricingUnitId} options={options.pricingUnits.map((item) => ({ id: item.id, label: optionLabel(item) }))} />
              </div>
            </CardContent>
          </Card>
        </FormTabPanel>

        <FormTabPanel value="attributes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">ตัวเลือกที่ลูกค้าเลือกได้</CardTitle>
              <p className="font-body-sm text-muted-foreground">
                สิ่งที่ลูกค้าต้องเลือกก่อนขอใบเสนอราคา เช่น ความหนา ขนาด สี — แต่ละแบบตั้งราคาแยกกันได้
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <ProductAttributeList
                attributes={attributes}
                dictionary={options.attributes}
                variantAxis
                addLabel="เพิ่มตัวเลือก"
                emptyState={
                  <div className="rounded-lg border border-dashed p-4">
                    <p className="font-body-sm text-muted-foreground">
                      สินค้านี้ไม่มีตัวเลือก ลูกค้าจะขอใบเสนอราคาได้ทันทีที่
                      <span className="font-semibold text-foreground"> ราคาฐาน</span> ที่กรอกไว้ในแท็บข้อมูลหลัก
                    </p>
                  </div>
                }
                onChange={(next) => {
                  markDirty();
                  setAttributes(next);
                }}
              />
              <ProductVariantsTable
                variants={variants}
                axes={axes}
                onChange={(next) => {
                  markDirty();
                  setVariants(next);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">ข้อมูลจำเพาะ</CardTitle>
              <p className="font-body-sm text-muted-foreground">
                ข้อมูลที่แสดงในตารางรายละเอียดบนหน้าสินค้าอย่างเดียว ลูกค้าเลือกไม่ได้ และไม่มีผลกับราคา
              </p>
            </CardHeader>
            <CardContent>
              <ProductAttributeList
                attributes={attributes}
                dictionary={options.attributes}
                variantAxis={false}
                addLabel="เพิ่มข้อมูลจำเพาะ"
                emptyState={
                  <div className="rounded-lg border border-dashed p-4">
                    <p className="font-body-sm text-muted-foreground">ยังไม่มีข้อมูลจำเพาะ</p>
                  </div>
                }
                onChange={(next) => {
                  markDirty();
                  setAttributes(next);
                }}
              />
            </CardContent>
          </Card>
        </FormTabPanel>

        <FormTabPanel value="media">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">รูปภาพและแคตตาล็อก</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <MediaField name="coverImage" label="รูปปก" accept="image" defaultValue={record?.coverImage} />
                <MediaField name="catalogPdf" label="Catalog PDF" accept="pdf" defaultValue={record?.catalogPdf} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm">รูปเพิ่มเติม</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImages((current) => [...current, { _key: crypto.randomUUID(), url: "", altTh: "", altEn: "", sortOrder: current.length }])}
                >
                  <ImagePlus className="size-4" />
                  เพิ่มรูป
                </Button>
              </div>
              {images.map((image, index) => (
                <div key={image._key} className="grid items-start gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
                  <MediaField
                    accept="image"
                    value={image.url}
                    onChange={(url) => setImages((current) => current.map((row, i) => (i === index ? { ...row, url } : row)))}
                  />
                  <Input
                    value={image.altTh}
                    onChange={(event) => setImages((current) => current.map((row, i) => (i === index ? { ...row, altTh: event.target.value } : row)))}
                    placeholder="Alt ภาษาไทย"
                    className="font-body-sm"
                  />
                  <Input
                    value={image.altEn}
                    onChange={(event) => setImages((current) => current.map((row, i) => (i === index ? { ...row, altEn: event.target.value } : row)))}
                    placeholder="English alt"
                    className="font-body-sm"
                  />
                  <Button type="button" variant="ghost" size="icon" aria-label="ลบรูป" onClick={() => setImages((current) => current.filter((_, i) => i !== index))}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button asChild type="button" variant="link">
                <Link href="/admin/media" target="_blank">เปิดคลังไฟล์</Link>
              </Button>
            </CardContent>
          </Card>
        </FormTabPanel>
      </Tabs>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-label-md">{label}</Label>
      {children}
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: { id: number; label: string }[];
  defaultValue?: number | null;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="font-label-md">{label}</Label>
      <AdminSelect
        name={name}
        value={value}
        defaultValue={value === undefined ? (defaultValue ? String(defaultValue) : "none") : undefined}
        onValueChange={onChange}
        className="w-full font-body-sm"
        options={[{ value: "none", label: "ไม่ระบุ" }, ...options.map((option) => ({ value: String(option.id), label: option.label }))]}
      />
    </div>
  );
}
