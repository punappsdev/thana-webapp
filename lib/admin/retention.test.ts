import { describe, expect, it } from "vitest";
import {
  anonymizedQuotationFields,
  customerRetainUntil,
  expiredQuotationWhere,
  quotationCutoff,
  subtractDays,
  subtractYears,
} from "@/lib/admin/retention";

const NOW = new Date("2026-08-04T03:00:00.000Z");

describe("quotationCutoff", () => {
  it("ย้อนหลัง 3 ปีตามนโยบายความเป็นส่วนตัว", () => {
    expect(quotationCutoff(NOW).toISOString()).toBe("2023-08-04T03:00:00.000Z");
  });

  it("ไม่แก้ไข Date ที่รับเข้ามา", () => {
    const input = new Date(NOW);
    subtractYears(input, 3);
    subtractDays(input, 30);
    expect(input.toISOString()).toBe(NOW.toISOString());
  });
});

describe("customerRetainUntil", () => {
  it("นับ 10 ปีจากวันที่ลูกค้าส่งคำขอ", () => {
    expect(customerRetainUntil(new Date("2026-08-04T03:00:00.000Z")).toISOString()).toBe(
      "2036-08-04T03:00:00.000Z",
    );
  });
});

describe("anonymizedQuotationFields", () => {
  const fields = anonymizedQuotationFields(NOW);

  it("ล้างข้อมูลติดต่อและข้อมูลบริษัททุกช่อง", () => {
    for (const key of [
      "email",
      "lineId",
      "companyName",
      "taxId",
      "addressLine",
      "subDistrict",
      "district",
      "postalCode",
      "deliveryAddressLine",
      "deliverySubDistrict",
      "deliveryDistrict",
      "deliveryPostalCode",
      "ipAddress",
      "userAgent",
      "adminNote",
    ] as const) {
      expect(fields[key], key).toBeNull();
    }
  });

  it("เขียนทับช่องที่เป็น NOT NULL แทนการใส่ null", () => {
    expect(fields.firstName).toBe("ลบข้อมูลตามนโยบายแล้ว");
    expect(fields.lastName).toBe("");
    expect(fields.phone).toBe("");
  });

  it("ล้าง token ดาวน์โหลด BOQ เพื่อให้ลิงก์เก่าในแชท LINE ใช้ไม่ได้อีก", () => {
    expect(fields.boqDownloadToken).toBeNull();
    expect(fields.boqStoragePath).toBeNull();
    expect(fields.boqOriginalName).toBeNull();
    expect(fields.boqMimeType).toBeNull();
    expect(fields.boqSize).toBeNull();
  });

  it("ประทับเวลา anonymizedAt ไว้กันการทำซ้ำ", () => {
    expect(fields.anonymizedAt).toBe(NOW);
  });

  it("ไม่แตะคอลัมน์ที่ไม่ระบุตัวบุคคล จึงยังดูสถิติย้อนหลังได้", () => {
    for (const key of ["code", "createdAt", "consentAt", "contactBranch", "locale", "province"]) {
      expect(fields).not.toHaveProperty(key);
    }
  });
});

describe("expiredQuotationWhere", () => {
  const where = expiredQuotationWhere(NOW);

  it("เลือกเฉพาะแถวที่ยังไม่เคยถูกลบข้อมูล", () => {
    expect(where.anonymizedAt).toBeNull();
  });

  it("เลือกเฉพาะแถวที่เก่ากว่าเกณฑ์", () => {
    expect(where.createdAt.lt.toISOString()).toBe(quotationCutoff(NOW).toISOString());
  });

  it("ข้ามแถวที่ทีมงานสั่งให้เก็บต่อและยังไม่ถึงกำหนด", () => {
    expect(where.OR).toEqual([{ retainUntil: null }, { retainUntil: { lt: NOW } }]);
  });
});
