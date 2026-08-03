import { describe, expect, it } from "vitest";
import {
  CONTACT_STORAGE_KEYS,
  emptyRememberedDetails,
  hasSavedDetails,
  parseSavedDetails,
  serializeRememberedDetails,
  type RememberedDetails,
} from "@/lib/quote-remembered-details";

const CONTACT_FIELDS = {
  firstName: "สมชาย",
  lastName: "ใจดี",
  phone: "0812345678",
  email: "somchai@example.com",
  lineId: "@somchai",
};

const COMPANY_FIELDS = {
  needTaxInvoice: true,
  companyName: "บริษัท ตัวอย่าง จำกัด",
  taxId: "0105551234567",
  addressLine: "99/1 หมู่ 4",
  subDistrict: "ฉลอง",
  district: "เมืองภูเก็ต",
  province: "phuket",
  postalCode: "83130",
};

const DELIVERY_FIELDS = {
  deliveryAddressLine: "12 ถนนเพชรเกษม",
  deliverySubDistrict: "โคกกลอย",
  deliveryDistrict: "ตะกั่วทุ่ง",
  deliveryProvince: "phang-nga",
  deliveryPostalCode: "82140",
};

function full(overrides: Partial<RememberedDetails> = {}): RememberedDetails {
  return {
    ...CONTACT_FIELDS,
    ...COMPANY_FIELDS,
    ...DELIVERY_FIELDS,
    fulfillmentMethod: "pickup",
    contactBranch: "thalang",
    ...overrides,
  };
}

describe("parseSavedDetails — เวอร์ชันปัจจุบัน (v4)", () => {
  it("อ่านค่าที่เพิ่งเขียนกลับมาได้ครบทุกฟิลด์", () => {
    const details = full();
    expect(parseSavedDetails(serializeRememberedDetails(details), "thana-quote-contact-v4")).toEqual(
      details,
    );
  });

  it("จำวิธีรับสินค้าและสาขาที่ลูกค้าเลือกไว้รับของ", () => {
    const parsed = parseSavedDetails(
      serializeRememberedDetails(full({ fulfillmentMethod: "pickup", contactBranch: "headquarters" })),
      "thana-quote-contact-v4",
    );
    expect(parsed?.fulfillmentMethod).toBe("pickup");
    expect(parsed?.contactBranch).toBe("headquarters");
  });

  it("ทิ้งค่าที่ฟอร์มไม่รู้จัก เพราะ localStorage แก้ไขจากเบราว์เซอร์ได้", () => {
    const raw = JSON.stringify({
      ...CONTACT_FIELDS,
      ...COMPANY_FIELDS,
      ...DELIVERY_FIELDS,
      fulfillmentMethod: "teleport",
      contactBranch: "สาขาที่ไม่มีจริง",
    });
    const parsed = parseSavedDetails(raw, "thana-quote-contact-v4");
    expect(parsed?.fulfillmentMethod).toBe("");
    expect(parsed?.contactBranch).toBe("");
  });

  it("ไม่รับค่าที่ชนิดผิดหรือฟิลด์หาย", () => {
    const raw = JSON.stringify({ ...CONTACT_FIELDS, ...COMPANY_FIELDS, ...DELIVERY_FIELDS });
    expect(parseSavedDetails(raw, "thana-quote-contact-v4")).toBeNull();
    expect(parseSavedDetails("{ ไม่ใช่ json", "thana-quote-contact-v4")).toBeNull();
    expect(parseSavedDetails("[]", "thana-quote-contact-v4")).toBeNull();
    expect(parseSavedDetails(null, "thana-quote-contact-v4")).toBeNull();
  });
});

describe("parseSavedDetails — อ่านข้อมูลเวอร์ชันเก่า", () => {
  it("v3 ที่เคยเลือกจัดส่ง กลับมาเป็นวิธีรับสินค้าแบบจัดส่ง", () => {
    const raw = JSON.stringify({
      ...CONTACT_FIELDS,
      ...COMPANY_FIELDS,
      ...DELIVERY_FIELDS,
      needDelivery: true,
    });
    const parsed = parseSavedDetails(raw, "thana-quote-contact-v3");
    expect(parsed?.fulfillmentMethod).toBe("delivery");
    expect(parsed?.deliveryDistrict).toBe("ตะกั่วทุ่ง");
    expect(parsed?.contactBranch).toBe("");
  });

  it("v3 ที่ needDelivery เป็น false ปล่อยวิธีรับสินค้าว่างไว้ ไม่เดาแทนลูกค้า", () => {
    const raw = JSON.stringify({
      ...CONTACT_FIELDS,
      ...COMPANY_FIELDS,
      ...DELIVERY_FIELDS,
      needDelivery: false,
    });
    expect(parseSavedDetails(raw, "thana-quote-contact-v3")?.fulfillmentMethod).toBe("");
  });

  it("v2 ยังได้ข้อมูลติดต่อและใบกำกับภาษี ส่วนที่อยู่จัดส่งว่าง", () => {
    const raw = JSON.stringify({ ...CONTACT_FIELDS, ...COMPANY_FIELDS });
    const parsed = parseSavedDetails(raw, "thana-quote-contact-v2");
    expect(parsed?.companyName).toBe("บริษัท ตัวอย่าง จำกัด");
    expect(parsed?.deliveryAddressLine).toBe("");
    expect(parsed?.fulfillmentMethod).toBe("");
  });

  it("v1 ได้เฉพาะข้อมูลติดต่อ", () => {
    const parsed = parseSavedDetails(JSON.stringify(CONTACT_FIELDS), "thana-quote-contact-v1");
    expect(parsed?.phone).toBe("0812345678");
    expect(parsed?.needTaxInvoice).toBe(false);
    expect(parsed?.deliveryProvince).toBe("");
    expect(parsed?.fulfillmentMethod).toBe("");
  });

  it("อ่านข้อมูลเวอร์ชันเก่าด้วยรูปแบบของเวอร์ชันใหม่ไม่ได้ ผู้เรียกจะได้ลองคีย์ถัดไป", () => {
    const v3Raw = JSON.stringify({
      ...CONTACT_FIELDS,
      ...COMPANY_FIELDS,
      ...DELIVERY_FIELDS,
      needDelivery: true,
    });
    expect(parseSavedDetails(v3Raw, "thana-quote-contact-v4")).toBeNull();
  });

  it("คีย์เรียงจากใหม่ไปเก่า เพื่อให้อ่านเวอร์ชันล่าสุดที่มีก่อนเสมอ", () => {
    expect(CONTACT_STORAGE_KEYS[0]).toBe("thana-quote-contact-v4");
    expect([...CONTACT_STORAGE_KEYS]).toEqual([...CONTACT_STORAGE_KEYS].sort().reverse());
  });
});

describe("hasSavedDetails", () => {
  it("ค่าว่างล้วนแปลว่ายังไม่เคยบันทึก", () => {
    expect(hasSavedDetails(emptyRememberedDetails())).toBe(false);
  });

  it("เลือกไว้แค่วิธีรับสินค้าก็นับว่ามีข้อมูลบันทึกไว้แล้ว", () => {
    expect(
      hasSavedDetails({ ...emptyRememberedDetails(), fulfillmentMethod: "pickup" }),
    ).toBe(true);
  });

  it("ติ๊กใบกำกับภาษีไว้อย่างเดียวก็นับ", () => {
    expect(hasSavedDetails({ ...emptyRememberedDetails(), needTaxInvoice: true })).toBe(true);
  });
});
