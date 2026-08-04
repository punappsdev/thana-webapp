"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { saveLineRoutingAction } from "@/app/admin/(panel)/settings/actions";
import { MultiSelectField, type MultiSelectOption } from "@/components/admin/multi-select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDistrictsForProvince } from "@/lib/districts";
import { PROVINCES } from "@/lib/provinces";
import { useNoResetSubmit } from "@/lib/use-no-reset-submit";
import type { LineRoutingOptions, LineRoutingSettings } from "@/lib/admin/line-routing-data";
import { type ActionResult } from "@/lib/admin/validation";

const initialState: ActionResult = { success: false, message: "" };

/** อำเภอทั้งประเทศพร้อมชื่อจังหวัด สร้างครั้งเดียวตอนโหลดโมดูล ไม่ใช่ทุกครั้งที่ render */
const DISTRICT_OPTIONS: MultiSelectOption[] = PROVINCES.flatMap((province) =>
  getDistrictsForProvince(province.code).map((district) => ({
    value: district.code,
    label: `อ.${district.nameTh}`,
    hint: `จ.${province.nameTh}`,
  })),
);

type Selections = {
  hqDistrictCodes: string[];
  categoryIds: string[];
  excludedSubIds: string[];
  includedProductIds: string[];
  excludedProductIds: string[];
};

function fromConfig(settings: LineRoutingSettings): Selections {
  return {
    hqDistrictCodes: settings.config.hqDistrictCodes,
    categoryIds: settings.config.factoryCategoryIds.map(String),
    excludedSubIds: settings.config.factoryExcludedSubCategoryIds.map(String),
    includedProductIds: settings.config.factoryIncludedProductIds.map(String),
    excludedProductIds: settings.config.factoryExcludedProductIds.map(String),
  };
}

/** ลำดับที่เลือกไม่มีความหมาย เรียงก่อนเทียบเพื่อไม่ให้การสลับลำดับนับเป็นการแก้ไข */
function serialize(selections: Selections): string {
  return Object.values(selections)
    .map((values) => [...values].sort().join(","))
    .join("|");
}

export function LineRoutingForm({
  settings,
  options,
}: {
  settings: LineRoutingSettings;
  options: LineRoutingOptions;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveLineRoutingAction, initialState);
  const handleSubmit = useNoResetSubmit(action);

  const [hqDistrictCodes, setHqDistrictCodes] = useState(settings.config.hqDistrictCodes);
  const [categoryIds, setCategoryIds] = useState(settings.config.factoryCategoryIds.map(String));
  const [excludedSubIds, setExcludedSubIds] = useState(
    settings.config.factoryExcludedSubCategoryIds.map(String),
  );
  const [includedProductIds, setIncludedProductIds] = useState(
    settings.config.factoryIncludedProductIds.map(String),
  );
  const [excludedProductIds, setExcludedProductIds] = useState(
    settings.config.factoryExcludedProductIds.map(String),
  );

  // เทียบกับค่าที่โหลดมาแทนการตั้งธงตอนแก้ — หลังบันทึกสำเร็จ props จะอัปเดตเป็นค่าใหม่
  // แล้วสถานะนี้กลับเป็น "ยังไม่ได้แก้" เอง ไม่ต้องรีเซ็ตด้วยมือ
  const dirty =
    serialize({
      hqDistrictCodes,
      categoryIds,
      excludedSubIds,
      includedProductIds,
      excludedProductIds,
    }) !== serialize(fromConfig(settings));

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  const categoryOptions: MultiSelectOption[] = useMemo(
    () => options.categories.map((category) => ({ value: String(category.id), label: category.nameTh })),
    [options.categories],
  );

  // แสดงเฉพาะหมวดย่อยของหมวดที่เลือกไว้ บวกหมวดย่อยที่เคยเลือกค้างไว้ ไม่งั้นชิปที่
  // เลือกอยู่จะหาชื่อไม่เจอเมื่อผู้ใช้เอาหมวดหลักออกก่อน
  const subCategoryOptions: MultiSelectOption[] = useMemo(
    () =>
      options.categories.flatMap((category) => {
        const relevant =
          categoryIds.includes(String(category.id)) ||
          category.subCategories.some((sub) => excludedSubIds.includes(String(sub.id)));
        if (!relevant) return [];
        return category.subCategories.map((sub) => ({
          value: String(sub.id),
          label: sub.nameTh,
          hint: category.nameTh,
        }));
      }),
    [options.categories, categoryIds, excludedSubIds],
  );

  const productOptions: MultiSelectOption[] = useMemo(
    () => options.products.map((product) => ({
      value: String(product.id),
      label: product.nameTh,
      hint: product.sku,
    })),
    [options.products],
  );

  const districtLabels = hqDistrictCodes
    .map((code) => DISTRICT_OPTIONS.find((option) => option.value === code)?.label ?? code)
    .join(" · ");
  const categoryLabels = categoryIds
    .map((id) => categoryOptions.find((option) => option.value === id)?.label ?? id)
    .join(" · ");
  const noFactorySource = categoryIds.length === 0 && includedProductIds.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="updatedAt" value={settings.updatedAt?.toISOString() ?? ""} />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline-lg font-semibold">กฎการส่งแจ้งเตือนกลุ่มไลน์ทีมขาย</h1>
          <p className="font-body-sm text-muted-foreground mt-1">
            กำหนดว่าคำขอใบเสนอราคาแต่ละใบควรเข้ากลุ่มไลน์ของทีมไหน มีผลกับทั้งการส่งอัตโนมัติและปุ่มส่งซ้ำทันทีที่บันทึก
          </p>
        </div>
        <Button type="submit" disabled={pending}>
          <Save className="size-4" />
          บันทึกกฎ
        </Button>
      </div>

      {state.conflict ? (
        <p className="rounded-md border border-destructive bg-error-container p-3 font-body-sm text-on-error-container">
          {state.message}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline-sm">พื้นที่ที่สำนักงานใหญ่ดูแล</CardTitle>
          <CardDescription className="font-body-sm">
            คำขอที่ให้จัดส่งไปอำเภอเหล่านี้จะเข้ากลุ่มสำนักงานใหญ่เสมอ ไม่ว่าจะสั่งสินค้าอะไร
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MultiSelectField
            id="hqDistrictCodes"
            name="hqDistrictCodes"
            label="อำเภอที่สำนักงานใหญ่รับผิดชอบ"
            placeholder="เลือกอำเภอ"
            searchPlaceholder="พิมพ์ชื่ออำเภอหรือจังหวัด"
            options={DISTRICT_OPTIONS}
            value={hqDistrictCodes}
            onChange={setHqDistrictCodes}
            description="ค้นได้ทั้งชื่ออำเภอและชื่อจังหวัด เลือกอำเภอนอกภูเก็ตได้ถ้าวันหนึ่งขยายพื้นที่ดูแล"
          />
          {hqDistrictCodes.length === 0 ? (
            <Warning>
              ยังไม่ได้เลือกอำเภอไว้เลย คำขอแบบจัดส่งจะไม่เข้ากลุ่มสำนักงานใหญ่อีกต่อไป
              (คำขอที่ลูกค้ามารับเองที่สำนักงานใหญ่ยังเข้าตามเดิม)
            </Warning>
          ) : null}
          <FieldError message={state.fieldErrors?.hqDistrictCodes?.[0]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline-sm">สินค้าที่โรงงานรับทำ</CardTitle>
          <CardDescription className="font-body-sm">
            คำขอที่จัดส่งนอกพื้นที่สำนักงานใหญ่ และ<strong>ทุกรายการในใบ</strong>เข้าเกณฑ์ด้านล่าง จะเข้ากลุ่มโรงงาน
            ถ้ามีสินค้านอกเกณฑ์รวมอยู่ด้วย จะเข้ากลุ่มสาขาถลาง
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MultiSelectField
            id="factoryCategoryIds"
            name="factoryCategoryIds"
            label="หมวดหลักที่โรงงานรับทำ"
            placeholder="เลือกหมวดสินค้า"
            options={categoryOptions}
            value={categoryIds}
            onChange={setCategoryIds}
          />

          <MultiSelectField
            id="factoryExcludedSubCategoryIds"
            name="factoryExcludedSubCategoryIds"
            label="หมวดย่อยที่ยกเว้น"
            placeholder={categoryIds.length ? "เลือกหมวดย่อย" : "เลือกหมวดหลักก่อน"}
            options={subCategoryOptions}
            value={excludedSubIds}
            onChange={setExcludedSubIds}
            description="หมวดย่อยในหมวดหลักข้างบนที่โรงงานไม่รับทำ"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <MultiSelectField
              id="factoryIncludedProductIds"
              name="factoryIncludedProductIds"
              label="สินค้าที่โรงงานรับทำเสมอ"
              placeholder="เลือกสินค้า"
              searchPlaceholder="พิมพ์ชื่อสินค้าหรือ SKU"
              options={productOptions}
              value={includedProductIds}
              onChange={setIncludedProductIds}
              description="ข้อยกเว้นรายตัว ใช้กับสินค้าที่อยู่ในหมวดย่อยที่ยกเว้นแต่โรงงานรับทำ"
            />
            <MultiSelectField
              id="factoryExcludedProductIds"
              name="factoryExcludedProductIds"
              label="สินค้าที่โรงงานไม่รับทำ"
              placeholder="เลือกสินค้า"
              searchPlaceholder="พิมพ์ชื่อสินค้าหรือ SKU"
              options={productOptions}
              value={excludedProductIds}
              onChange={setExcludedProductIds}
              description="ชนะทุกเงื่อนไข ใบที่มีสินค้าเหล่านี้จะไม่เข้ากลุ่มโรงงาน"
            />
          </div>

          {noFactorySource ? (
            <Warning>
              ยังไม่ได้เลือกหมวดหลักหรือสินค้าที่โรงงานรับทำไว้เลย จะไม่มีใบไหนเข้ากลุ่มโรงงานอีก
            </Warning>
          ) : null}
          <FieldError message={state.fieldErrors?.factoryCategoryIds?.[0]} />
          <FieldError message={state.fieldErrors?.factoryIncludedProductIds?.[0]} />
          <FieldError message={state.fieldErrors?.factoryExcludedProductIds?.[0]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline-sm">สรุปกฎที่จะใช้จริง</CardTitle>
          <CardDescription className="font-body-sm">
            ระบบจะไล่กฎจากบนลงล่างเสมอ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            <SummaryRow index={1} group="กลุ่มของสาขาที่ลูกค้าเลือก">
              ลูกค้าเลือกรับสินค้าเองที่สาขา
            </SummaryRow>
            <SummaryRow index={2} group="สำนักงานใหญ่">
              {hqDistrictCodes.length > 0 ? `จัดส่งไป ${districtLabels}` : "— ยังไม่ได้เลือกอำเภอไว้"}
            </SummaryRow>
            <SummaryRow index={3} group="โรงงาน">
              {noFactorySource
                ? "— ยังไม่ได้เลือกสินค้าที่โรงงานรับทำ"
                : `จัดส่งนอกพื้นที่ข้อ 2 และทุกรายการอยู่ในหมวด ${categoryLabels || "(เฉพาะสินค้าที่ระบุไว้)"}` +
                  (excludedSubIds.length ? ` ยกเว้น ${excludedSubIds.length} หมวดย่อย` : "") +
                  (includedProductIds.length || excludedProductIds.length
                    ? ` และมีข้อยกเว้นรายสินค้า ${includedProductIds.length + excludedProductIds.length} รายการ`
                    : "")}
            </SummaryRow>
            <SummaryRow index={4} group="ถลาง">
              นอกเหนือจากนั้นทั้งหมด
            </SummaryRow>
          </ol>
        </CardContent>
      </Card>
    </form>
  );
}

function SummaryRow({
  index,
  group,
  children,
}: {
  index: number;
  group: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-1 border-l-2 border-border pl-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <p className="font-body-sm">
        <span className="font-label-md text-muted-foreground">ข้อ {index} · </span>
        {children}
      </p>
      <p className="font-label-md shrink-0 text-primary">→ {group}</p>
    </li>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/5 p-3 font-body-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      {children}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 font-body-sm text-destructive">{message}</p>;
}
