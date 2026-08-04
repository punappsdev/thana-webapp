import "server-only";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";

export type QuotationCustomerType = "all" | "company" | "individual";

export async function getAdminQuotations(input: {
  query?: string;
  customerType?: string;
  page?: number;
}) {
  await requireAdmin();
  const page = Math.max(1, input.page || 1);
  const take = 10;
  const query = input.query?.trim();

  const where = {
    ...(input.customerType === "company"
      ? { needTaxInvoice: true }
      : input.customerType === "individual"
        ? { needTaxInvoice: false }
        : {}),
    ...(query
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
      : {}),
  };

  const [items, total] = await Promise.all([
    getPrisma().quotationRequest.findMany({
      where,
      skip: (page - 1) * take,
      take,
      // Newest first — staff work the queue from the top.
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    }),
    getPrisma().quotationRequest.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / take)) };
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
