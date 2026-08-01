import Link from "next/link";
import { Eye, Mail, MessageCircle, ReceiptText, Search } from "lucide-react";
import { AdminSelect } from "@/components/admin/admin-select";
import { DeleteQuotationButton } from "@/components/admin/delete-quotation-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminQuotations } from "@/lib/admin/quotation-data";

export default async function AdminQuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; customerType?: string; page?: string }>;
}) {
  const filters = await searchParams;
  const result = await getAdminQuotations({
    query: filters.query,
    customerType: filters.customerType,
    page: Number(filters.page) || 1,
  });
  const hasFilter =
    Boolean(filters.query) || (filters.customerType && filters.customerType !== "all");

  // Keep the active filters when paging, otherwise page 2 would reset the search.
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    if (filters.customerType) params.set("customerType", filters.customerType);
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
            คำขอจากลูกค้าทั้งหมด {result.total} รายการ
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="query"
                defaultValue={filters.query}
                placeholder="รหัสอ้างอิง, ชื่อ, เบอร์โทร, อีเมล หรือชื่อบริษัท"
                className="pl-9 font-body-sm"
              />
            </div>
            <AdminSelect
              name="customerType"
              defaultValue={filters.customerType || "all"}
              className="w-full"
              options={[
                { value: "all", label: "ลูกค้าทุกประเภท" },
                { value: "company", label: "ออกใบเสร็จนามบริษัท" },
                { value: "individual", label: "บุคคลธรรมดา" },
              ]}
            />
            <Button type="submit" variant="outline">ค้นหา</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {result.items.length ? (
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสอ้างอิง</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>ช่องทางติดต่อ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>รายการ</TableHead>
                  <TableHead>ส่งเมื่อ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-label-md font-semibold whitespace-nowrap">
                      {request.code}
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
