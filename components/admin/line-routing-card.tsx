import Link from "next/link";
import { Settings2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLineRoutingSettings } from "@/lib/admin/line-routing-data";
import { findDistrictByCode } from "@/lib/districts";
import { provinceName } from "@/lib/provinces";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" });

/**
 * สรุปกฎเลือกกลุ่มไลน์ทีมขายในหน้าตั้งค่า
 *
 * อ่านอย่างเดียว การแก้ไขอยู่ที่ /admin/settings/line-routing เพราะฟอร์มยาวเกินกว่า
 * จะยัดลงการ์ดในหน้ารวมโดยไม่กลบการตั้งค่าอื่น
 */
export async function LineRoutingCard() {
  const { config, updatedAt, selected } = await getLineRoutingSettings();

  const districtLabels = config.hqDistrictCodes.map((code) => {
    const found = findDistrictByCode(code);
    if (!found) return `รหัส ${code}`;
    const province = provinceName(found.provinceCode, "th");
    return `อ.${found.district.nameTh}${province ? ` จ.${province}` : ""}`;
  });

  const productExceptions =
    selected.includedProducts.length + selected.excludedProducts.length;
  const noFactorySource =
    selected.categories.length === 0 && selected.includedProducts.length === 0;

  const rows = [
    {
      label: "อำเภอที่สำนักงานใหญ่ดูแล",
      value: districtLabels.length ? districtLabels.join(" · ") : "ยังไม่ได้เลือก",
    },
    {
      label: "หมวดที่โรงงานรับทำ",
      value: selected.categories.length
        ? selected.categories.map((option) => option.label).join(" · ")
        : "ยังไม่ได้เลือก",
    },
    {
      label: "หมวดย่อยที่ยกเว้น",
      value: selected.excludedSubCategories.length
        ? selected.excludedSubCategories.map((option) => option.label).join(" · ")
        : "ไม่มี",
    },
    {
      label: "ข้อยกเว้นรายสินค้า",
      value: productExceptions
        ? `รับทำเสมอ ${selected.includedProducts.length} · ไม่รับทำ ${selected.excludedProducts.length}`
        : "ไม่มี",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>กฎการส่งแจ้งเตือนกลุ่มไลน์ทีมขาย</CardTitle>
        <CardDescription>
          ปรับเกณฑ์สำหรับการส่งแจ้งเตือนเข้ากลุ่มไลน์ทีมขาย
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="space-y-0.5">
              <dt className="font-label-sm text-muted-foreground">{row.label}</dt>
              <dd className="font-body-sm break-words">{row.value}</dd>
            </div>
          ))}
        </dl>

        {noFactorySource ? (
          <p className="flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/5 p-3 font-body-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            ยังไม่ได้ตั้งค่าสินค้าที่โรงงานรับทำ จึงไม่มีคำขอใบไหนถูกส่งเข้ากลุ่มโรงงาน
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="font-body-sm text-muted-foreground">
            {updatedAt ? `แก้ไขล่าสุด ${dateFormatter.format(updatedAt)}` : "ยังไม่เคยแก้ไข"}
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/settings/line-routing">
              <Settings2 className="size-4" />
              แก้ไขกฎการส่ง
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
