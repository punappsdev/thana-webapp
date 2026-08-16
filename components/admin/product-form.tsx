"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ExternalLink, Eye, ImagePlus, Info, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { renameDictionaryEntryAction, saveProductAction } from "@/app/admin/(panel)/products/actions";
import { AdminSelect } from "@/components/admin/admin-select";
import { Badge } from "@/components/ui/badge";
import {
  ProductAttributeList,
  newAttributeKey,
  type DictionaryAttribute,
  type DictionaryRenameInput,
  type ProductAttributeDraft,
} from "@/components/admin/product-attributes-editor";
import {
  ProductCustomFieldList,
  type ProductCustomFieldDraft,
} from "@/components/admin/product-custom-fields-editor";
import {
  MAX_COMBINATIONS,
  ProductVariantsTable,
  buildAxes,
  combinationKey,
  existingToken,
  isOverCombinationLimit,
  syncVariants,
  type VariantRow,
} from "@/components/admin/product-variants-table";
import { FormTabPanel } from "@/components/admin/form-tab-panel";
import { MediaField } from "@/components/admin/media-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { useNoResetSubmit } from "@/lib/use-no-reset-submit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { isDraftSku, slugifyAdminTitle, type ActionResult } from "@/lib/admin/validation";

type CategoryOption = { id: number; nameTh: string; nameEn: string; subCategories: { id: number; nameTh: string }[] };
type Option = { id: number; nameTh?: string; nameEn?: string };
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
  /** Not editable any more — carried through so a save cannot zero it out. */
  price: number;
  image: string;
  isAvailable: boolean;
  isDefault: boolean;
  sortOrder: number;
  attributeValueIds: number[];
};

/** Limits arrive as strings so a field that has no numeric side stays blank. */
type SavedCustomField = {
  triggerValueId: number;
  inputType: "NUMBER" | "TEXT";
  labelTh: string;
  labelEn: string;
  unitTh: string;
  unitEn: string;
  minValue: string;
  maxValue: string;
  step: string;
  maxLength: string;
  required: boolean;
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
  published: boolean;
  sortOrder: number;
  categoryId: number | null;
  subCategoryId: number | null;
  brandId: number | null;
  unitId: number | null;
  images: ImageRow[];
  attributes: SavedAttribute[];
  variants: SavedVariant[];
  customFields: SavedCustomField[];
};

type EditorOptions = {
  categories: CategoryOption[];
  attributes: DictionaryAttribute[];
  brands: Option[];
  units: Option[];
};

const initialState: ActionResult = { success: false, message: "" };

const overLimitHint = `ตัวเลือกสินค้าได้สูงสุด ${MAX_COMBINATIONS} รายการ กรุณาลดจำนวนค่าของตัวเลือกลงก่อนจึงจะบันทึกได้`;


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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dictionary, setDictionary] = useState<DictionaryAttribute[]>(() => options.attributes);
  const [, startRenameTransition] = useTransition();

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

  const [customFields, setCustomFields] = useState<ProductCustomFieldDraft[]>(() =>
    (record?.customFields || []).map((field) => ({
      _key: crypto.randomUUID(),
      triggerToken: existingToken(field.triggerValueId),
      inputType: field.inputType,
      labelTh: field.labelTh,
      labelEn: field.labelEn,
      unitTh: field.unitTh,
      unitEn: field.unitEn,
      minValue: field.minValue,
      maxValue: field.maxValue,
      step: field.step,
      maxLength: field.maxLength,
      required: field.required,
    })),
  );

  const renameDictionaryEntry = async (input: DictionaryRenameInput): Promise<ActionResult> =>
    new Promise((resolve) => {
      startRenameTransition(async () => {
        try {
          const result = await renameDictionaryEntryAction(input);
          if (result.success) {
            setDictionary((current) =>
              current.map((attribute) => {
                if (input.kind === "attribute" && attribute.id === input.id) {
                  return { ...attribute, nameTh: input.nameTh, nameEn: input.nameEn };
                }
                if (input.kind === "value") {
                  return {
                    ...attribute,
                    values: attribute.values.map((value) =>
                      value.id === input.id ? { ...value, valueTh: input.nameTh, valueEn: input.nameEn } : value,
                    ),
                  };
                }
                return attribute;
              }),
            );
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
          resolve(result);
        } catch {
          const result: ActionResult = { success: false, message: "เปลี่ยนชื่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
          toast.error(result.message);
          resolve(result);
        }
      });
    });

  const axes = useMemo(() => buildAxes(attributes, dictionary), [attributes, dictionary]);

  // Past the cap the variant table stops regenerating, so the rows on screen no
  // longer match the options. Saving that would quietly store combinations the
  // admin never saw — block it here rather than let the action reject it later.
  const overLimit = isOverCombinationLimit(axes);

  /**
   * The variant rows are a pure function of the options, so keep them in step
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

  const optionLabel = (option: Option) =>
    [option.nameTh, option.nameEn].filter((name): name is string => Boolean(name?.trim())).join(" / ") || String(option.id);

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

  // `price` is no longer editable anywhere, but it still round-trips: the action
  // deletes and recreates every variant on save, so leaving it out would wipe the
  // stored prices the moment anyone edits a product.
  const variantsPayload = variants.map((variant, index) => ({
    sku: variant.sku,
    price: variant.price,
    image: variant.image,
    isAvailable: variant.isAvailable,
    isDefault: variant.isDefault,
    sortOrder: index,
    valueTokens: variant.valueTokens,
  }));

  // Limits go over as typed. Turning "" into 0 here would quietly ship a field
  // the customer can enter 0 into; the action rejects the blank instead.
  const customFieldsPayload = customFields.map((field, index) => ({
    triggerToken: field.triggerToken,
    inputType: field.inputType,
    labelTh: field.labelTh,
    labelEn: field.labelEn,
    unitTh: field.unitTh,
    unitEn: field.unitEn,
    minValue: field.minValue,
    maxValue: field.maxValue,
    step: field.step,
    maxLength: field.maxLength,
    required: field.required,
    sortOrder: index,
  }));

  return (
    <form onSubmit={handleSubmit} onChange={markDirty} className="space-y-6">
      <input type="hidden" name="id" value={record?.id || ""} />
      <input type="hidden" name="updatedAt" value={record?.updatedAt ? new Date(record.updatedAt).toISOString() : ""} />
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} readOnly />
      <input type="hidden" name="attributesJson" value={JSON.stringify(attributesPayload)} readOnly />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variantsPayload)} readOnly />
      <input type="hidden" name="customFieldsJson" value={JSON.stringify(customFieldsPayload)} readOnly />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-headline-lg font-semibold">{record ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</h1>
            {record ? <Badge variant={record.published ? "default" : "secondary"}>{record.published ? "เผยแพร่อยู่" : "ฉบับร่าง"}</Badge> : null}
          </div>
          <p className="font-body-sm text-muted-foreground mt-1">
            {record?.published ? "แก้ไขข้อมูลแล้วกดบันทึก หรือกด 'ยกเลิกเผยแพร่' เพื่อเปลี่ยนกลับเป็นฉบับร่าง" : "บันทึกร่างได้ทันทีแม้กรอกยังไม่ครบ แล้วค่อยกลับมาทำต่อ — กรอกให้ครบก่อนกดเผยแพร่"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {record ? (
            <Button asChild type="button" variant="outline">
              <Link href={`/admin/preview/products/${record.id}`} target="_blank">
                <Eye className="size-4" />
                Preview
              </Link>
            </Button>
          ) : null}
          {record?.published ? (
            <>
              <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending || overLimit} title={overLimit ? overLimitHint : undefined}>
                <Save className="size-4" />
                ยกเลิกเผยแพร่ (เปลี่ยนเป็นร่าง)
              </Button>
              <Button type="submit" name="intent" value="publish" disabled={pending || overLimit} title={overLimit ? overLimitHint : undefined}>
                <Save className="size-4" />
                บันทึกการแก้ไข
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending || overLimit} title={overLimit ? overLimitHint : undefined}>
                <Save className="size-4" />
                บันทึกร่าง
              </Button>
              <Button type="submit" name="intent" value="publish" disabled={pending || overLimit} title={overLimit ? overLimitHint : undefined}>
                <ExternalLink className="size-4" />
                เผยแพร่
              </Button>
            </>
          )}
        </div>
      </div>

      {state.conflict ? (
        <p className="rounded-md border border-destructive bg-error-container p-3 font-body-sm text-on-error-container">{state.message}</p>
      ) : null}

      {/* The table's own warning sits in another tab, so repeat the reason next
          to the buttons it just disabled — otherwise they look simply broken. */}
      {overLimit ? (
        <p className="rounded-md border border-destructive bg-error-container p-3 font-body-sm text-on-error-container">{overLimitHint}</p>
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
                    <RichTextField
                      name="descriptionTh"
                      label="คำอธิบาย"
                      initialValue={record?.descriptionTh || ""}
                      helpText=""
                      onDirty={markDirty}
                    />
                    <RichTextField
                      name="usageGuideTh"
                      label="คำแนะนำการใช้งาน"
                      initialValue={record?.usageGuideTh || ""}
                      helpText=""
                      minHeight="compact"
                      onDirty={markDirty}
                    />
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
                    <RichTextField
                      name="descriptionEn"
                      label="Description"
                      initialValue={record?.descriptionEn || ""}
                      helpText="Use headings, lists, emphasis, or links to make product information easier to scan."
                      placeholder="Start writing the product description..."
                      onDirty={markDirty}
                    />
                    <RichTextField
                      name="usageGuideEn"
                      label="Usage guide"
                      initialValue={record?.usageGuideEn || ""}
                      helpText="Add steps or important care notes. Numbered lists work well for instructions."
                      placeholder="Start writing the usage guide..."
                      minHeight="compact"
                      onDirty={markDirty}
                    />
                  </FormTabPanel>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline-sm">รหัสสินค้า</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="SKU (รหัสสินค้า)">
                  {/* A draft without a SKU carries a generated placeholder so the
                      unique column has a value; show it as empty so the admin
                      types a real code instead of editing machine text. */}
                  <Input name="sku" defaultValue={isDraftSku(record?.sku) ? "" : record?.sku} className="font-body-sm" />
                  <p className="font-body-sm text-muted-foreground mt-1.5">
                    รหัสอ้างอิงสินค้าในระบบ ห้ามซ้ำกัน เช่น GL-001 — เว้นว่างไว้ก่อนได้ แต่ต้องกรอกก่อนเผยแพร่
                  </p>
                </Field>
                {/* Slug is generated automatically; keep it mounted (only collapsed)
                    so its value still submits and the on-blur auto-fill keeps working. */}
                <div className="border-t pt-3">
                  <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="flex items-center gap-1 font-label-sm text-muted-foreground hover:text-foreground">
                    {showAdvanced ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}ตัวเลือกขั้นสูง
                  </button>
                  <div className={cn("mt-3 space-y-4", !showAdvanced && "hidden")}>
                    <Field label="ชื่อในลิงก์ (URL)">
                      <Input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} className="font-body-sm" />
                      <p className="font-body-sm text-muted-foreground mt-1.5">
                        เว้นว่างเพื่อให้ระบบสร้างให้อัตโนมัติจากชื่อภาษาอังกฤษ (ใช้ a-z, 0-9 และขีดกลาง)
                      </p>
                    </Field>
                    <Field label="ลำดับการแสดง">
                      <Input name="sortOrder" type="number" defaultValue={record?.sortOrder || 0} className="font-body-sm" />
                      <p className="font-body-sm text-muted-foreground mt-1.5">
                        ใช้จัดเรียงลำดับการแสดงผลสินค้าบนหน้าเว็บ (เลขน้อยจะอยู่ก่อน เช่น 1, 2)
                      </p>
                    </Field>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">การจัดหมวดหมู่</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SelectField name="categoryId" label="หมวดหมู่" value={categoryId} onChange={setCategoryId} options={options.categories.map((item) => ({ id: item.id, label: item.nameTh }))} />
                <SelectField name="subCategoryId" label="หมวดหมู่ย่อย" defaultValue={record?.subCategoryId} options={(category?.subCategories || []).map((item) => ({ id: item.id, label: item.nameTh }))} />
                <SelectField name="brandId" label="แบรนด์" defaultValue={record?.brandId} options={options.brands.map((item) => ({ id: item.id, label: optionLabel(item) }))} />
                <SelectField name="unitId" label="หน่วยสินค้า" defaultValue={record?.unitId} options={options.units.map((item) => ({ id: item.id, label: optionLabel(item) }))} />
              </div>
            </CardContent>
          </Card>
        </FormTabPanel>

        <FormTabPanel value="attributes" className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex gap-3 py-4">
              <Info className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="font-label-md">“ตัวเลือก” กับ “ข้อมูลจำเพาะ” ต่างกันอย่างไร?</p>
                <p className="font-body-sm text-muted-foreground"><span className="font-semibold text-foreground">ตัวเลือก</span> = สิ่งที่ลูกค้าเลือกได้ก่อนขอใบเสนอราคา เช่น ความหนา สี &nbsp;·&nbsp; <span className="font-semibold text-foreground">ข้อมูลจำเพาะ</span> = ข้อมูลที่แสดงบนหน้าสินค้าอย่างเดียว ลูกค้าเลือกไม่ได้</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">ตัวเลือกที่ลูกค้าเลือกได้</CardTitle>
              <p className="font-body-sm text-muted-foreground">
                สิ่งที่ลูกค้าต้องเลือกก่อนขอใบเสนอราคา เช่น ความหนา ขนาด สี
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <ProductAttributeList
                attributes={attributes}
                dictionary={dictionary}
                variantAxis
                addLabel="เพิ่มตัวเลือก"
                emptyState={
                  <div className="rounded-lg border border-dashed p-4">
                    <p className="font-body-sm text-muted-foreground">
                      สินค้านี้ไม่มีตัวเลือก ลูกค้าจะกดขอใบเสนอราคาได้ทันทีจากหน้าสินค้า
                    </p>
                  </div>
                }
                onChange={(next) => {
                  markDirty();
                  setAttributes(next);
                }}
                onRename={renameDictionaryEntry}
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
              <CardTitle className="font-headline-sm">ช่องให้ลูกค้ากรอกเอง (สินค้าสั่งตัด)</CardTitle>
              <p className="font-body-sm text-muted-foreground">
                ช่องที่จะอยู่บนหน้าสินค้าเมื่อลูกค้าเลือกค่าที่กำหนดไว้ เช่นเลือก
                &ldquo;สั่งตัดตามขนาด&rdquo; เพื่อให้ลูกค้ากรอกความกว้าง/สูง หรือข้อความที่ต้องการได้เอง
              </p>
            </CardHeader>
            <CardContent>
              <ProductCustomFieldList
                fields={customFields}
                axes={axes}
                onChange={(next) => {
                  markDirty();
                  setCustomFields(next);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">ข้อมูลจำเพาะ</CardTitle>
              <p className="font-body-sm text-muted-foreground">
                ข้อมูลที่แสดงในตารางรายละเอียดบนหน้าสินค้าอย่างเดียว ลูกค้าเลือกไม่ได้
              </p>
            </CardHeader>
            <CardContent>
              <ProductAttributeList
                attributes={attributes}
                dictionary={dictionary}
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
                onRename={renameDictionaryEntry}
              />
            </CardContent>
          </Card>
        </FormTabPanel>

        <FormTabPanel value="media">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">รูปภาพและแคตตาล็อก</CardTitle>
              <p className="font-body-sm text-muted-foreground">
                กรุณาใช้รูปสินค้าแบบสี่เหลี่ยมจัตุรัส 1:1 (เช่น 800 × 800 px) ระบบจะแสดงทุกภาพในกรอบ 1:1 โดยคงสัดส่วนภาพและตัดส่วนขอบที่เกินกรอบออก จึงควรวางสินค้าไว้กลางภาพ
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <MediaField
                  name="coverImage"
                  label="รูปปก"
                  accept="image"
                  defaultValue={record?.coverImage}
                  description="ใช้รูปสี่เหลี่ยมจัตุรัส 1:1 (เช่น 800 × 800 px) ระบบจะแสดงในกรอบ 1:1 และตัดส่วนที่เกินกรอบออก"
                />
                <MediaField
                  name="catalogPdf"
                  label="Catalog PDF"
                  accept="pdf"
                  defaultValue={record?.catalogPdf}
                  description="รองรับไฟล์เอกสาร PDF ขนาดไม่เกิน 25 MB"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-sm">รูปเพิ่มเติม ({images.length}/4)</h3>
                  <p className="font-body-sm text-muted-foreground">แสดงเป็นแกลเลอรีให้ลูกค้าคลิกดูภาพใหญ่ในหน้าสินค้า (สูงสุด 4 รูป — ใช้รูปสี่เหลี่ยมจัตุรัส 1:1 ระบบจะตัดส่วนที่เกินกรอบออก)</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={images.length >= 4}
                  onClick={() => setImages((current) => current.length >= 4 ? current : [...current, { _key: crypto.randomUUID(), url: "", altTh: "", altEn: "", sortOrder: current.length }])}
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
                    description="ใช้รูปสี่เหลี่ยมจัตุรัส 1:1 (เช่น 800 × 800 px) ระบบจะตัดส่วนที่เกินกรอบออก"
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

function RichTextField({
  name,
  label,
  initialValue,
  helpText,
  placeholder,
  minHeight = "default",
  onDirty,
}: {
  name: string;
  label: string;
  initialValue: string;
  helpText: string;
  placeholder?: string;
  minHeight?: "compact" | "default";
  onDirty: () => void;
}) {
  const editorId = `${name}-editor`;
  const hintId = `${name}-hint`;

  return (
    <div className="space-y-2">
      <Label htmlFor={editorId} className="font-label-md">{label}</Label>
      <RichTextEditor
        name={name}
        initialValue={initialValue}
        editorId={editorId}
        ariaLabel={label}
        describedBy={hintId}
        toolbarLabel={`เครื่องมือจัดรูปแบบ ${label}`}
        placeholder={placeholder}
        minHeight={minHeight}
        onDirty={onDirty}
      />
      <p id={hintId} className="font-body-sm text-muted-foreground">{helpText}</p>
    </div>
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
