import Form from "next/form";
import Link from "next/link";
import { Eye, Mail, MessageCircle, ReceiptText, Search, TriangleAlert } from "lucide-react";
import { AdminSelect } from "@/components/admin/admin-select";
import { DeleteQuotationButton } from "@/components/admin/delete-quotation-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminQuotations } from "@/lib/admin/quotation-data";
import {
  ALL_FILTER_VALUE,
  monthLabelTh,
  quotationFulfillmentLabel,
  responsibleBranchLabel,
  responsibleBranchOptions,
} from "@/lib/admin/quotation-filters";

export default async function AdminQuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    customerType?: string;
    branch?: string;
    month?: string;
    page?: string;
  }>;
}) {
  const filters = await searchParams;
  const result = await getAdminQuotations({
    query: filters.query,
    customerType: filters.customerType,
    branch: filters.branch,
    month: filters.month,
    page: Number(filters.page) || 1,
  });
  const isSet = (value: string | undefined) => Boolean(value) && value !== ALL_FILTER_VALUE;
  const hasFilter =
    Boolean(filters.query) ||
    isSet(filters.customerType) ||
    isSet(filters.branch) ||
    isSet(filters.month);

  // Keep the active filters when paging, otherwise page 2 would reset the search.
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    if (filters.customerType) params.set("customerType", filters.customerType);
    if (filters.branch) params.set("branch", filters.branch);
    if (filters.month) params.set("month", filters.month);
    params.set("page", String(page));
    return `?${params}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="flex items-center gap-3 font-headline-lg font-semibold">
            <ReceiptText className="size-7 text-primary" />
            ใบเสนอราคา
          </h1>
          <p className="font-body-sm text-muted-foreground">
            {hasFilter
              ? `พบ ${result.total} รายการตามตัวกรอง`
              : `คำขอจากลูกค้าทั้งหมด ${result.total} รายการ`}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* next/form ไม่ใช่ <form> เปล่า ๆ — action="" ทำ client-side navigation ไป
              ที่ path เดิมพร้อม search params ใหม่ ถ้าใช้ <form> ธรรมดาเบราว์เซอร์จะ
              โหลดหน้าใหม่ทั้งหน้า แล้วเห็นตัวกรองกระพริบทุกครั้งที่กดค้นหา */}
          <Form action="" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_repeat(3,190px)_auto]">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="query"
                defaultValue={filters.query}
                placeholder="รหัสอ้างอิง, ชื่อ, เบอร์โทร, อีเมล หรือชื่อบริษัท"
                className="pl-9 font-body-sm"
              />
            </div>
            <AdminSelect
              name="branch"
              defaultValue={filters.branch || ALL_FILTER_VALUE}
              className="w-full"
              options={responsibleBranchOptions()}
            />
            <AdminSelect
              name="month"
              defaultValue={filters.month || ALL_FILTER_VALUE}
              className="w-full"
              options={[
                { value: ALL_FILTER_VALUE, label: "ทุกเดือน" },
                ...result.months.map((month) => ({ value: month, label: monthLabelTh(month) })),
              ]}
            />
            <AdminSelect
              name="customerType"
              defaultValue={filters.customerType || ALL_FILTER_VALUE}
              className="w-full"
              options={[
                { value: ALL_FILTER_VALUE, label: "ลูกค้าทุกประเภท" },
                { value: "company", label: "ออกใบเสร็จนามบริษัท" },
                { value: "individual", label: "บุคคลธรรมดา" },
              ]}
            />
            <Button type="submit" variant="outline">ค้นหา</Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {result.items.length ? (
            <Table className="min-w-[1020px]">
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสอ้างอิง</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>ช่องทางติดต่อ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สาขาที่รับผิดชอบ</TableHead>
                  <TableHead>รายการ</TableHead>
                  <TableHead>ส่งเมื่อ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-label-md font-semibold whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        {request.code}
                        {/* เตือนเฉพาะใบที่เคยพยายามส่งแล้วพลาด ใบที่ยังไม่เคยส่งเลย
                            (เช่นคำขอเก่าก่อนมีระบบนี้) ไม่ควรขึ้นเตือนทั้งตาราง */}
                        {request.lineNotifiedAt === null && request.lineNotifyCount > 0 ? (
                          <TriangleAlert
                            className="size-4 text-destructive"
                            aria-label="แจ้งเตือนเข้ากลุ่มไลน์ไม่สำเร็จ"
                          />
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-label-md font-semibold">
                        {request.firstName} {request.lastName}
                      </p>
                      <p className="font-body-sm text-muted-foreground">{request.phone}</p>
                    </TableCell>
                    <TableCell className="font-body-sm">
                      <div className="space-y-0.5">
                        {request.email ? (
                          <p className="flex items-center gap-1.5">
                            <Mail className="size-3.5 text-muted-foreground" />
                            {request.email}
                          </p>
                        ) : null}
                        {request.lineId ? (
                          <p className="flex items-center gap-1.5">
                            <MessageCircle className="size-3.5 text-muted-foreground" />
                            {request.lineId}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={request.needTaxInvoice ? "default" : "secondary"}>
                        {request.needTaxInvoice ? "นามบริษัท" : "บุคคลธรรมดา"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="font-body-sm">
                        {responsibleBranchLabel(request.responsibleBranch)}
                      </p>
                      <p className="font-body-sm text-muted-foreground">
                        {quotationFulfillmentLabel(request)}
                      </p>
                    </TableCell>
                    <TableCell className="font-body-sm">{request._count.items}</TableCell>
                    <TableCell className="font-body-sm whitespace-nowrap">
                      {request.createdAt.toLocaleString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon-sm">
                          <Link href={`/admin/quotations/${request.id}`} aria-label={`ดูคำขอ ${request.code}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <DeleteQuotationButton id={request.id} code={request.code} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-16 text-center font-body-sm text-muted-foreground">
              {hasFilter
                ? "ไม่พบคำขอที่ตรงกับการค้นหา"
                : "ยังไม่มีคำขอใบเสนอราคา เมื่อลูกค้าส่งคำขอจากหน้าเว็บ รายการจะแสดงที่นี่"}
            </p>
          )}
        </CardContent>
      </Card>

      {result.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="font-body-sm text-muted-foreground">
            หน้า {result.page} จาก {result.totalPages}
          </p>
          <div className="flex gap-2">
            <Button asChild={result.page > 1} variant="outline" disabled={result.page <= 1}>
              {result.page > 1 ? <Link href={pageHref(result.page - 1)}>ก่อนหน้า</Link> : <span>ก่อนหน้า</span>}
            </Button>
            <Button
              asChild={result.page < result.totalPages}
              variant="outline"
              disabled={result.page >= result.totalPages}
            >
              {result.page < result.totalPages ? <Link href={pageHref(result.page + 1)}>ถัดไป</Link> : <span>ถัดไป</span>}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
