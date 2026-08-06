import "server-only";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import {
  monthKey,
  monthKeysBetween,
  monthRange,
  quotationMonthWhere,
  responsibleBranchWhere,
} from "@/lib/admin/quotation-filters";

export type QuotationCustomerType = "all" | "company" | "individual";

export async function getAdminQuotations(input: {
  query?: string;
  customerType?: string;
  branch?: string;
  month?: string;
  page?: number;
}) {
  await requireAdmin();
  const page = Math.max(1, input.page || 1);
  const take = 10;
  const query = input.query?.trim();

  // ต่อกันด้วย AND แทนการ spread ทุกเงื่อนไขรวมในอ็อบเจกต์เดียว เพราะทั้งช่องค้นหา
  // และตัวกรองสาขาต่างก็ใช้คีย์ `OR` ถ้า spread รวมกันอันหลังจะทับอันแรกเงียบ ๆ
  const where = {
    AND: [
      input.customerType === "company"
        ? { needTaxInvoice: true }
        : input.customerType === "individual"
          ? { needTaxInvoice: false }
          : {},
      responsibleBranchWhere(input.branch),
      quotationMonthWhere(input.month),
      query
        ? {
            OR: [
              { code: { contains: query } },
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { phone: { contains: query } },
              { email: { contains: query } },
              { lineId: { contains: query } },
              { companyName: { contains: query } },
            ],
          }
        : {},
    ],
  };

  const [items, total, span] = await Promise.all([
    getPrisma().quotationRequest.findMany({
      where,
      skip: (page - 1) * take,
      take,
      // Newest first — staff work the queue from the top.
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    }),
    getPrisma().quotationRequest.count({ where }),
    // ตัวเลือกเดือนคิดจากคำขอทั้งตาราง ไม่ใช่เฉพาะที่ผ่านตัวกรอง ไม่อย่างนั้นการ
    // เลือกสาขาจะทำให้เดือนที่กำลังเลือกอยู่หายไปจากดรอปดาวน์เอง
    // (createdAt มี index อยู่แล้ว min/max จึงไม่ต้องสแกนทั้งตาราง)
    getPrisma().quotationRequest.aggregate({
      _min: { createdAt: true },
      _max: { createdAt: true },
    }),
  ]);

  const months =
    span._min.createdAt && span._max.createdAt
      ? monthKeysBetween(span._min.createdAt, span._max.createdAt)
      : [];
  // เดือนที่ถูกเลือกมาทาง URL อาจอยู่นอกช่วงข้างบน (เช่นพิมพ์เอง หรือคำขอเดือนนั้น
  // ถูกลบไปหมดแล้ว) ต้องคงไว้ในลิสต์ ไม่งั้น Select จะแสดงเป็นค่าว่าง
  const selectedRange = monthRange(input.month);
  const selectedMonth = selectedRange ? monthKey(selectedRange.gte) : null;
  if (selectedMonth && !months.includes(selectedMonth)) {
    months.push(selectedMonth);
    months.sort().reverse();
  }

  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / take)), months };
}

export async function getQuotationDetail(id: number) {
  return getPrisma().quotationRequest.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        // id หมวดหมู่ปัจจุบันของสินค้า ใช้เลือกกลุ่ม LINE ปลายทาง (lib/line/routing.ts)
        // `product` เป็น null เองเมื่อสินค้าถูกลบ เพราะ productId ตั้งเป็น SetNull
        include: {
          product: {
            select: {
              id: true,
              nameTh: true,
              categoryId: true,
              subCategoryId: true,
              category: { select: { slug: true } },
              subCategory: { select: { slug: true } },
            },
          },
        },
      },
    },
  });
}
