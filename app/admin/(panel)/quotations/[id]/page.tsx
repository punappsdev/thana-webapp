import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Download,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { LineIcon } from "@/components/icons/line-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteQuotationButton } from "@/components/admin/delete-quotation-button";
import { ResendLineNotificationButton } from "@/components/admin/resend-line-notification-button";
import { RetentionHoldToggle } from "@/components/admin/retention-hold-toggle";
import { requireAdminPage } from "@/lib/admin/auth";
import { getLineRoutingConfig } from "@/lib/admin/line-routing-data";
import { getQuotationDetail } from "@/lib/admin/quotation-data";
import { responsibleBranchLabel } from "@/lib/admin/quotation-filters";
import { quotationDeleteAt, QUOTATION_RETENTION_YEARS } from "@/lib/admin/retention";
import { branchLabelTh, saleGroupLabelTh } from "@/lib/branches";
import { customerTypeLabelTh } from "@/lib/customer-types";
import { resolveSaleGroup } from "@/lib/line/routing";
import { toRoutingInput } from "@/lib/line/routing-input";
import { isOutsidePhuket, provinceName } from "@/lib/provinces";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // getQuotationDetail and getLineRoutingConfig are both reused by the public
  // quote flow (lib/line/notify-quotation.ts), so neither can hold the check.
  // This page shows the customer's name, address and phone number — it asserts
  // the session itself.
  await requireAdminPage();

  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [request, routingConfig] = await Promise.all([
    getQuotationDetail(Number(id)),
    getLineRoutingConfig(),
  ]);
  if (!request) notFound();

  const outsidePhuket = request.needDelivery && isOutsidePhuket(request.deliveryProvince);
  // คำขอแบบจัดส่งไม่มีสาขาให้พูดถึง (contactBranch เป็น null) จึงบอกวิธีรับสินค้าแทน
  const fulfillmentLabel = request.needDelivery
    ? "จัดส่งไปยังที่อยู่หน้างาน"
    : `รับสินค้าเองที่${branchLabelTh(request.contactBranch)}`;
  // คำนวณสดด้วยกฎเดียวกับตอนส่งจริง เพื่อให้ปุ่มส่งซ้ำบอกได้ว่าจะเข้ากลุ่มไหน
  const lineRouting = resolveSaleGroup(toRoutingInput(request), routingConfig);
  // `responsibleBranch` คือสาขาที่ได้ใบไปจริงตอนแจ้งเข้ากลุ่มครั้งล่าสุด ต่างจากค่าที่
  // คำนวณสดข้างบนได้เมื่อกฎถูกแก้ทีหลัง หรือเมื่อที่อยู่จัดส่งถูกงาน retention ลบไปแล้ว
  // ตัวกรองในหน้ารวมใช้ค่าที่บันทึกไว้ หน้านี้จึงต้องบอกให้ชัดว่าสองค่าไม่ตรงกัน
  const routingChanged =
    request.responsibleBranch !== null && request.responsibleBranch !== lineRouting.group;
  const boqAttachment =
    request.boqOriginalName && request.boqSize !== null && request.boqDownloadToken
      ? {
          originalName: request.boqOriginalName,
          size: request.boqSize,
          downloadToken: request.boqDownloadToken,
        }
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{request.needTaxInvoice ? "นามบริษัท" : "บุคคลธรรมดา"}</Badge>
            {request.anonymizedAt ? <Badge variant="outline">ลบข้อมูลส่วนบุคคลแล้ว</Badge> : null}
            {request.retainUntil ? <Badge variant="outline">เก็บข้อมูล 10 ปี</Badge> : null}
          </div>
          <h1 className="mt-3 font-headline-lg font-semibold">{request.code}</h1>
          <p className="font-body-sm text-muted-foreground">
            ส่งเมื่อ {request.createdAt.toLocaleString("th-TH")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/quotations">
              <ArrowLeft className="size-4" />
              กลับไปหน้ารายการ
            </Link>
          </Button>
          <DeleteQuotationButton id={request.id} code={request.code} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">รายการสินค้าที่ขอใบเสนอราคา</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {/* The link is dropped once the product is gone — the
                            snapshotted name below still identifies what was asked for. */}
                        {item.productId ? (
                          <Link
                            href={`/products/${item.slug}`}
                            target="_blank"
                            className="font-label-md font-semibold text-primary hover:underline"
                          >
                            {item.productNameTh}
                          </Link>
                        ) : (
                          <span className="font-label-md font-semibold">{item.productNameTh}</span>
                        )}
                        <p className="font-body-sm text-muted-foreground">{item.productNameEn}</p>
                        {item.optionsTh ? (
                          <p className="mt-1 font-body-sm text-muted-foreground">{item.optionsTh}</p>
                        ) : null}
                        {/* ขนาดที่ลูกค้ากรอกเอง เน้นให้ต่างจากตัวเลือกที่เลือกจากรายการ
                            เพราะเป็นตัวเลขที่ต้องส่งต่อให้โรงงานตัดจริง */}
                        {item.customFieldsTh ? (
                          <p className="mt-1 font-body-sm font-semibold text-primary">
                            {item.customFieldsTh}
                          </p>
                        ) : null}
                        {!item.productId ? (
                          <p className="mt-1 font-body-sm text-muted-foreground">
                            (สินค้านี้ถูกลบออกจากแคตตาล็อกแล้ว)
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-body-sm">{item.sku || "—"}</TableCell>
                      <TableCell className="text-right font-label-md font-semibold">
                        {item.qty}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">ข้อมูลการจัดส่ง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="วิธีรับสินค้า" value={fulfillmentLabel} />
              {request.needDelivery ? (
                <>
                  <DetailRow label="ที่อยู่สำหรับจัดส่ง" value={request.deliveryAddressLine} />
                  <DetailRow label="ตำบล / แขวง" value={request.deliverySubDistrict} />
                  <DetailRow label="อำเภอ / เขต" value={request.deliveryDistrict} />
                  <DetailRow label="จังหวัด" value={provinceName(request.deliveryProvince, "th")} />
                  <DetailRow label="รหัสไปรษณีย์" value={request.deliveryPostalCode} />
                </>
              ) : null}

              {outsidePhuket ? (
                <p className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary/5 p-3 font-body-sm text-foreground">
                  <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
                  จัดส่งนอกจังหวัดภูเก็ต — มีค่าบริการจัดส่ง ยกเว้นกระจกเทมเปอร์และกระจกลามิเนต
                </p>
              ) : null}
            </CardContent>
          </Card>

          {request.needTaxInvoice ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline-sm">ข้อมูลออกใบเสร็จในนามบริษัท</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="ชื่อบริษัท" value={request.companyName} />
                <DetailRow label="เลขประจำตัวผู้เสียภาษี" value={request.taxId} />
                <DetailRow label="ที่อยู่" value={request.addressLine} />
                <DetailRow label="ตำบล / แขวง" value={request.subDistrict} />
                <DetailRow label="อำเภอ / เขต" value={request.district} />
                <DetailRow label="จังหวัด" value={provinceName(request.province, "th")} />
                <DetailRow label="รหัสไปรษณีย์" value={request.postalCode} />

              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">ข้อมูลผู้ติดต่อ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="ชื่อ-นามสกุล" value={`${request.firstName} ${request.lastName}`} />
              <DetailRow label="ประเภทลูกค้า" value={customerTypeLabelTh(request.customerType)} />
              {/* คำขอแบบจัดส่งเก็บ contactBranch เป็น null เพราะลูกค้าไม่ได้เลือกสาขา */}
              {request.needDelivery ? null : (
                <DetailRow label="สาขาที่รับสินค้า" value={branchLabelTh(request.contactBranch)} />
              )}
              <div className="space-y-1">
                <p className="font-label-sm text-muted-foreground">ช่องทางติดต่อ</p>
                <p className="flex items-center gap-2 font-body-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                    {request.phone}
                  </a>
                </p>
                {request.email ? (
                  <p className="flex items-center gap-2 font-body-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                      {request.email}
                    </a>
                  </p>
                ) : null}
                {request.lineId ? (
                  <p className="flex items-center gap-2 font-body-sm">
                    <LineIcon className="size-4" />
                    {request.lineId}
                  </p>
                ) : null}
              </div>
              <DetailRow label="ภาษาที่ลูกค้าใช้" value={request.locale === "en" ? "English" : "ไทย"} />
            </CardContent>
          </Card>

          {boqAttachment ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline-sm">
                  <FileText className="size-4 text-primary" aria-hidden="true" />
                  เอกสาร BOQ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="space-y-3 rounded-lg border border-primary/15 bg-primary/5 p-3">
                  <div>
                    <dt className="font-label-sm text-muted-foreground">ชื่อไฟล์</dt>
                    <dd className="mt-1 break-words font-body-sm font-medium">{boqAttachment.originalName}</dd>
                  </div>
                  <div>
                    <dt className="font-label-sm text-muted-foreground">ขนาดไฟล์</dt>
                    <dd className="mt-1 font-body-sm">{formatFileSize(boqAttachment.size)}</dd>
                  </div>
                </dl>
                <Button asChild variant="outline" className="w-full">
                  <a
                    href={`/api/quotation-attachments/${boqAttachment.downloadToken}`}
                    download
                  >
                    <Download className="size-4" aria-hidden="true" />
                    ดาวน์โหลดไฟล์ BOQ
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">แจ้งเตือนกลุ่มไลน์ทีมขาย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {routingChanged ? (
                <>
                  <div className="space-y-0.5">
                    <p className="font-label-sm text-muted-foreground">สาขาที่รับผิดชอบตอนนี้</p>
                    <p className="font-body-sm break-words">
                      {responsibleBranchLabel(request.responsibleBranch)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-label-sm text-muted-foreground">
                      กลุ่มปลายทางถ้ากดส่งซ้ำตอนนี้
                    </p>
                    <p className="font-body-sm break-words">
                      {saleGroupLabelTh(lineRouting.group)}
                    </p>
                    <p className="font-body-sm text-muted-foreground">{lineRouting.reason}</p>
                  </div>
                  {/* ต่อประโยคด้วย template string ไม่ใช่หลาย ๆ บรรทัดใน JSX
                      เพราะ JSX จะแทรกช่องว่างระหว่างบรรทัด ซึ่งผิดหลักภาษาไทย */}
                  <p className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary/5 p-3 font-body-sm text-foreground">
                    <ArrowRightLeft className="mt-0.5 size-4 shrink-0 text-primary" />
                    {`กฎการเลือกกลุ่มถูกแก้หลังจากใบนี้ถูกจัดสาขาไปแล้ว ในตารางและตัวกรองใบนี้จึงยังนับเป็นของ${responsibleBranchLabel(request.responsibleBranch)} กดส่งซ้ำเพื่อย้ายไปเป็นของ${saleGroupLabelTh(lineRouting.group)}`}
                  </p>
                </>
              ) : (
                <div className="space-y-0.5">
                  <p className="font-label-sm text-muted-foreground">กลุ่มปลายทาง</p>
                  <p className="font-body-sm break-words">{saleGroupLabelTh(lineRouting.group)}</p>
                  <p className="font-body-sm text-muted-foreground">{lineRouting.reason}</p>
                </div>
              )}
              {request.lineNotifiedAt ? (
                <>
                  <Badge>ส่งเข้ากลุ่มแล้ว</Badge>
                  <p className="font-body-sm text-muted-foreground">
                    ส่งสำเร็จเมื่อ {request.lineNotifiedAt.toLocaleString("th-TH")}
                  </p>
                </>
              ) : request.lineNotifyCount > 0 ? (
                <>
                  <Badge variant="destructive">ส่งไม่สำเร็จ</Badge>
                  <p className="flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/5 p-3 font-body-sm break-words">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                    {request.lineNotifyError || "ไม่ทราบสาเหตุ"}
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="secondary">ยังไม่ได้ส่ง</Badge>
                  <p className="font-body-sm text-muted-foreground">
                    คำขอนี้ยังไม่เคยถูกแจ้งเข้ากลุ่มไลน์ของ{saleGroupLabelTh(lineRouting.group)}
                  </p>
                </>
              )}
              <ResendLineNotificationButton
                id={request.id}
                sent={request.lineNotifiedAt !== null}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">บันทึกความยินยอมและกำหนดเก็บข้อมูล</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="flex items-start gap-2.5 font-body-sm">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                ยินยอมตามนโยบายความเป็นส่วนตัวเมื่อ {request.consentAt.toLocaleString("th-TH")}
              </p>
              <DetailRow label="IP Address" value={request.ipAddress} />

              <div className="space-y-3 border-t pt-3">
                {request.anonymizedAt ? (
                  <p className="font-body-sm text-muted-foreground">
                    ลบข้อมูลส่วนบุคคลไปแล้วเมื่อ {request.anonymizedAt.toLocaleDateString("th-TH")}
                    ตามนโยบาย เหลือไว้เฉพาะรหัสอ้างอิงและรายการสินค้า
                  </p>
                ) : (
                  <>
                    <p className="font-body-sm text-muted-foreground">
                      {request.retainUntil
                        ? `จะลบข้อมูลลูกค้าอัตโนมัติหลัง ${request.retainUntil.toLocaleDateString("th-TH")}`
                        : `จะลบข้อมูลลูกค้าอัตโนมัติหลัง ${quotationDeleteAt(request.createdAt).toLocaleDateString("th-TH")} (${QUOTATION_RETENTION_YEARS} ปีนับจากวันที่ส่งคำขอ)`}
                    </p>
                    <RetentionHoldToggle
                      id={request.id}
                      held={request.retainUntil !== null}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="font-label-sm text-muted-foreground">{label}</p>
      <p className="font-body-sm break-words">{value || "—"}</p>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toLocaleString("th-TH", { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
}
