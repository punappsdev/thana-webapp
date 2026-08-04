import type { RoutingInput } from "@/lib/line/routing";

/**
 * แปลงคำขอใบเสนอราคาที่อ่านจากฐานข้อมูลให้อยู่ในรูปที่ `resolveSaleGroup()` รับ
 *
 * มีสองที่ที่ต้องตัดสินกลุ่มปลายทาง — ตอนส่งจริง (`lib/line/notify-quotation.ts`) กับ
 * ตอนแสดงในหน้าหลังบ้าน (`/admin/quotations/[id]`) ทั้งสองต้องได้คำตอบตรงกันเสมอ
 * ไม่งั้นหน้าหลังบ้านจะบอกกลุ่มหนึ่งแต่ข้อความวิ่งไปอีกกลุ่ม
 *
 * รับพารามิเตอร์แบบ structural type ไม่ผูกกับชนิดของ Prisma เพื่อให้ไฟล์นี้ยังเป็น
 * โมดูลบริสุทธิ์เหมือน `lib/line/routing.ts`
 */
export function toRoutingInput(request: {
  needDelivery: boolean;
  contactBranch: string;
  deliveryProvince: string | null;
  deliveryDistrict: string | null;
  items: {
    product: {
      id: number;
      categoryId: number | null;
      subCategoryId: number | null;
    } | null;
  }[];
}): RoutingInput {
  return {
    needDelivery: request.needDelivery,
    contactBranch: request.contactBranch,
    deliveryProvince: request.deliveryProvince,
    deliveryDistrict: request.deliveryDistrict,
    // `product` เป็น null เองเมื่อสินค้าถูกลบ เพราะ productId ตั้งเป็น SetNull
    items: request.items.map((item) => ({
      productId: item.product?.id ?? null,
      categoryId: item.product?.categoryId ?? null,
      subCategoryId: item.product?.subCategoryId ?? null,
    })),
  };
}
