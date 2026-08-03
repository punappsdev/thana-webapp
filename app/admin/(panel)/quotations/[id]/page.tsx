import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone, ShieldCheck, TriangleAlert, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteQuotationButton } from "@/components/admin/delete-quotation-button";
import { ResendLineNotificationButton } from "@/components/admin/resend-line-notification-button";
import { getQuotationDetail } from "@/lib/admin/quotation-data";
import { branchLabelTh } from "@/lib/branches";
import { isOutsidePhuket, provinceName } from "@/lib/provinces";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const request = await getQuotationDetail(Number(id));
  if (!request) notFound();

  const outsidePhuket = request.needDelivery && isOutsidePhuket(request.deliveryProvince);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="secondary">{request.needTaxInvoice ? "นามบริษัท" : "บุคคลธรรมดา"}</Badge>
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
              <DetailRow label="สถานะ" value={request.needDelivery ? "ต้องการจัดส่ง" : "ไม่ต้องการจัดส่ง"} />
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
              <DetailRow label="สาขาที่ติดต่อ" value={branchLabelTh(request.contactBranch)} />
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
                    <MessageCircle className="size-4 text-muted-foreground" />
                    {request.lineId}
                  </p>
                ) : null}
              </div>
              <DetailRow label="ภาษาที่ลูกค้าใช้" value={request.locale === "en" ? "English" : "ไทย"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline-sm">แจ้งเตือนกลุ่มไลน์สาขา</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                    คำขอนี้ยังไม่เคยถูกแจ้งเข้ากลุ่มไลน์ของ{branchLabelTh(request.contactBranch)}
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
              <CardTitle className="font-headline-sm">บันทึกความยินยอม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="flex items-start gap-2.5 font-body-sm">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                ยินยอมตามนโยบายความเป็นส่วนตัวเมื่อ {request.consentAt.toLocaleString("th-TH")}
              </p>
              <DetailRow label="IP Address" value={request.ipAddress} />
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
