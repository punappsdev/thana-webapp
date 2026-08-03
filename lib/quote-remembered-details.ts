import { isBranchCode } from "@/lib/branches";

/**
 * ข้อมูลที่ฟอร์มขอใบเสนอราคาจำไว้บนเครื่องลูกค้า เมื่อติ๊ก "จดจำข้อมูลบนอุปกรณ์นี้"
 *
 * แยกออกจากตัวคอมโพเนนต์เพราะการอ่านข้อมูลเวอร์ชันเก่ากลับมาเป็นตรรกะที่พังแบบเงียบ ๆ
 * ได้ง่าย — ลูกค้าเสียข้อมูลที่บันทึกไว้โดยไม่มีอะไรฟ้อง จึงต้องมีเทสต์คุม
 * (แนวเดียวกับ `lib/admin/auth-policy.ts` ที่แยกออกจาก `lib/admin/auth.ts`)
 *
 * ไฟล์นี้ไม่แตะ `window` เลย ฝั่งคอมโพเนนต์เป็นคนอ่าน/เขียน localStorage เอง
 */

/**
 * คีย์ของแต่ละเวอร์ชัน เรียงจากใหม่ไปเก่า เพิ่มเวอร์ชันใหม่ทุกครั้งที่ชุดฟิลด์เปลี่ยน
 *
 * v1 ข้อมูลติดต่อ · v2 + ใบกำกับภาษี · v3 + ที่อยู่จัดส่ง · v4 + วิธีรับสินค้าและสาขาที่รับ
 */
export const CONTACT_STORAGE_KEYS = [
  "thana-quote-contact-v4",
  "thana-quote-contact-v3",
  "thana-quote-contact-v2",
  "thana-quote-contact-v1",
] as const;

export type SavedShape = (typeof CONTACT_STORAGE_KEYS)[number];

/** คีย์ที่ใช้เขียนเสมอ เวอร์ชันเก่าที่เหลือมีไว้อ่านย้อนหลังแล้วลบทิ้ง */
export const CONTACT_STORAGE_KEY: SavedShape = CONTACT_STORAGE_KEYS[0];
export const OBSOLETE_CONTACT_STORAGE_KEYS = CONTACT_STORAGE_KEYS.slice(1);

export const EMPTY_CONTACT = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  lineId: "",
};

export const EMPTY_COMPANY_INVOICE = {
  needTaxInvoice: false,
  companyName: "",
  taxId: "",
  addressLine: "",
  subDistrict: "",
  district: "",
  province: "",
  postalCode: "",
};

export const EMPTY_DELIVERY = {
  deliveryAddressLine: "",
  deliverySubDistrict: "",
  deliveryDistrict: "",
  deliveryProvince: "",
  deliveryPostalCode: "",
};

export type FulfillmentMethod = "delivery" | "pickup";

/**
 * เก็บวิธีรับสินค้าเป็นสามสถานะ ไม่ใช่ boolean `needDelivery` แบบ v3 เพราะ "ยังไม่ได้
 * เลือก" กับ "เลือกรับเองที่สาขา" ต่างกัน — boolean แยกสองอย่างนี้ไม่ออก ทำให้ลูกค้า
 * ที่เคยเลือกรับเองต้องกดใหม่ทุกครั้งที่กลับมา และสาขาที่เลือกก็ไม่เคยถูกจำเลย
 */
export const EMPTY_FULFILLMENT = {
  fulfillmentMethod: "" as FulfillmentMethod | "",
  contactBranch: "",
};

export type ContactDetails = typeof EMPTY_CONTACT;
export type ContactField = keyof ContactDetails;
export type CompanyInvoiceDetails = typeof EMPTY_COMPANY_INVOICE;
export type CompanyInvoiceField = Exclude<keyof CompanyInvoiceDetails, "needTaxInvoice">;
export type DeliveryDetails = typeof EMPTY_DELIVERY;
export type DeliveryField = keyof DeliveryDetails;
export type FulfillmentDetails = typeof EMPTY_FULFILLMENT;
export type RememberedDetails = ContactDetails &
  CompanyInvoiceDetails &
  DeliveryDetails &
  FulfillmentDetails;

export function emptyContact(): ContactDetails {
  return { ...EMPTY_CONTACT };
}

export function emptyCompanyInvoice(): CompanyInvoiceDetails {
  return { ...EMPTY_COMPANY_INVOICE };
}

export function emptyDelivery(): DeliveryDetails {
  return { ...EMPTY_DELIVERY };
}

export function emptyFulfillment(): FulfillmentDetails {
  return { ...EMPTY_FULFILLMENT };
}

export function emptyRememberedDetails(): RememberedDetails {
  return {
    ...EMPTY_CONTACT,
    ...EMPTY_COMPANY_INVOICE,
    ...EMPTY_DELIVERY,
    ...EMPTY_FULFILLMENT,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFulfillmentMethod(value: string): value is FulfillmentMethod {
  return value === "delivery" || value === "pickup";
}

/** ฟิลด์ที่หายไปหรือชนิดผิดแปลว่าอ่านไม่ได้ ผู้เรียกจะไปลองเวอร์ชันเก่ากว่าต่อ */
export function parseSavedDetails(raw: string | null, shape: SavedShape): RememberedDetails | null {
  try {
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    if (
      typeof parsed.firstName !== "string" ||
      typeof parsed.lastName !== "string" ||
      typeof parsed.phone !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.lineId !== "string"
    ) {
      return null;
    }

    const contact = {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      phone: parsed.phone,
      email: parsed.email,
      lineId: parsed.lineId,
    };

    if (shape === "thana-quote-contact-v1") {
      return {
        ...contact,
        ...emptyCompanyInvoice(),
        ...emptyDelivery(),
        ...emptyFulfillment(),
      };
    }

    if (
      typeof parsed.needTaxInvoice !== "boolean" ||
      typeof parsed.companyName !== "string" ||
      typeof parsed.taxId !== "string" ||
      typeof parsed.addressLine !== "string" ||
      typeof parsed.subDistrict !== "string" ||
      typeof parsed.district !== "string" ||
      typeof parsed.province !== "string" ||
      typeof parsed.postalCode !== "string"
    ) {
      return null;
    }

    const withCompanyInvoice = {
      ...contact,
      needTaxInvoice: parsed.needTaxInvoice,
      companyName: parsed.companyName,
      taxId: parsed.taxId,
      addressLine: parsed.addressLine,
      subDistrict: parsed.subDistrict,
      district: parsed.district,
      province: parsed.province,
      postalCode: parsed.postalCode,
    };

    if (shape === "thana-quote-contact-v2") {
      return { ...withCompanyInvoice, ...emptyDelivery(), ...emptyFulfillment() };
    }

    if (
      typeof parsed.deliveryAddressLine !== "string" ||
      typeof parsed.deliverySubDistrict !== "string" ||
      typeof parsed.deliveryDistrict !== "string" ||
      typeof parsed.deliveryProvince !== "string" ||
      typeof parsed.deliveryPostalCode !== "string"
    ) {
      return null;
    }

    const withDelivery = {
      ...withCompanyInvoice,
      deliveryAddressLine: parsed.deliveryAddressLine,
      deliverySubDistrict: parsed.deliverySubDistrict,
      deliveryDistrict: parsed.deliveryDistrict,
      deliveryProvince: parsed.deliveryProvince,
      deliveryPostalCode: parsed.deliveryPostalCode,
    };

    if (shape === "thana-quote-contact-v3") {
      if (typeof parsed.needDelivery !== "boolean") return null;

      // v3 เก็บได้แค่ boolean จึงกู้คืนได้เฉพาะฝั่ง "จัดส่ง" — false อาจแปลว่ายังไม่ได้
      // เลือกหรือเลือกรับเองก็ได้ จึงปล่อยว่างไว้ให้ลูกค้าเลือกเอง ดีกว่าเดาผิด
      return {
        ...withDelivery,
        ...emptyFulfillment(),
        fulfillmentMethod: parsed.needDelivery ? "delivery" : "",
      };
    }

    if (typeof parsed.fulfillmentMethod !== "string" || typeof parsed.contactBranch !== "string") {
      return null;
    }

    return {
      ...withDelivery,
      // ค่าที่อ่านมาจากเครื่องลูกค้าแก้ไขได้ จึงรับเฉพาะค่าที่ฟอร์มรู้จักจริง
      fulfillmentMethod: isFulfillmentMethod(parsed.fulfillmentMethod)
        ? parsed.fulfillmentMethod
        : "",
      contactBranch: isBranchCode(parsed.contactBranch) ? parsed.contactBranch : "",
    };
  } catch {
    return null;
  }
}

/** เขียนเฉพาะฟิลด์ที่รู้จัก ไม่ปล่อย state อื่นของฟอร์มรั่วลง localStorage */
export function serializeRememberedDetails(details: RememberedDetails): string {
  return JSON.stringify({
    firstName: details.firstName,
    lastName: details.lastName,
    phone: details.phone,
    email: details.email,
    lineId: details.lineId,
    needTaxInvoice: details.needTaxInvoice,
    companyName: details.companyName,
    taxId: details.taxId,
    addressLine: details.addressLine,
    subDistrict: details.subDistrict,
    district: details.district,
    province: details.province,
    postalCode: details.postalCode,
    deliveryAddressLine: details.deliveryAddressLine,
    deliverySubDistrict: details.deliverySubDistrict,
    deliveryDistrict: details.deliveryDistrict,
    deliveryProvince: details.deliveryProvince,
    deliveryPostalCode: details.deliveryPostalCode,
    fulfillmentMethod: details.fulfillmentMethod,
    contactBranch: details.contactBranch,
  });
}

export function hasSavedDetails(details: RememberedDetails): boolean {
  return Object.values(details).some(
    (value) => value === true || (typeof value === "string" && value !== ""),
  );
}
