import { describe, expect, it } from "vitest";
import {
  monthKey,
  monthKeysBetween,
  monthLabelTh,
  monthRange,
  quotationFulfillmentLabel,
  quotationMonthWhere,
  responsibleBranchLabel,
  responsibleBranchOptions,
  responsibleBranchWhere,
} from "@/lib/admin/quotation-filters";

describe("responsibleBranchWhere", () => {
  it("ไม่กรองเมื่อเป็น all หรือค่าที่ไม่รู้จัก", () => {
    expect(responsibleBranchWhere("all")).toEqual({});
    expect(responsibleBranchWhere(undefined)).toEqual({});
    expect(responsibleBranchWhere("สาขาที่ปิดไปแล้ว")).toEqual({});
  });

  it("กรองด้วยสาขาที่บันทึกไว้ตอนแจ้งเข้ากลุ่ม ไม่ใช่สาขาที่ลูกค้าเลือก", () => {
    expect(responsibleBranchWhere("headquarters")).toEqual({ responsibleBranch: "headquarters" });
    // โรงงานเลือกเองไม่ได้จากฟอร์ม แต่เป็นปลายทางที่กฎเลือกให้ได้
    expect(responsibleBranchWhere("factory")).toEqual({ responsibleBranch: "factory" });
  });

  it("หาใบที่ยังไม่เคยผ่านการเลือกกลุ่ม รวมถึงค่าที่อ่านไม่ออก", () => {
    expect(responsibleBranchWhere("unassigned")).toEqual({
      OR: [
        { responsibleBranch: null },
        { responsibleBranch: { notIn: ["headquarters", "thalang", "factory"] } },
      ],
    });
  });
});

describe("responsibleBranchOptions", () => {
  it("มีครบทุกกลุ่มปลายทาง บวกทั้งหมดและใบที่ยังไม่ได้ระบุ", () => {
    expect(responsibleBranchOptions().map((option) => option.value)).toEqual([
      "all",
      "headquarters",
      "thalang",
      "factory",
      "unassigned",
    ]);
  });
});

describe("responsibleBranchLabel", () => {
  it("แปลงรหัสกลุ่มเป็นชื่อสาขา", () => {
    expect(responsibleBranchLabel("factory")).toBe("สาขาโรงงาน");
  });

  it("คำขอเก่าที่ยังไม่มีค่า และค่าที่อ่านไม่ออก อ่านออกว่ายังไม่ได้ระบุ", () => {
    expect(responsibleBranchLabel(null)).toBe("ยังไม่ได้ระบุสาขา");
    expect(responsibleBranchLabel("สาขาที่ปิดไปแล้ว")).toBe("ยังไม่ได้ระบุสาขา");
  });
});

describe("quotationFulfillmentLabel", () => {
  it("บอกวิธีรับสินค้าเป็นบรรทัดรอง", () => {
    expect(quotationFulfillmentLabel({ needDelivery: true })).toBe("จัดส่งถึงหน้างาน");
    expect(quotationFulfillmentLabel({ needDelivery: false })).toBe("ลูกค้ามารับเอง");
  });
});

describe("monthRange", () => {
  it("คืนช่วงตั้งแต่ต้นเดือนถึงต้นเดือนถัดไป ตามเวลาเครื่อง", () => {
    const range = monthRange("2026-08")!;
    expect(range.gte).toEqual(new Date(2026, 7, 1));
    expect(range.lt).toEqual(new Date(2026, 8, 1));
  });

  it("ข้ามปีได้", () => {
    const range = monthRange("2026-12")!;
    expect(range.lt).toEqual(new Date(2027, 0, 1));
  });

  it("ปฏิเสธค่าที่ไม่ใช่รูปแบบเดือน", () => {
    for (const value of ["", "all", "2026-13", "2026-00", "2026-8", "26-08", "2026-08-01"]) {
      expect(monthRange(value)).toBeNull();
    }
  });
});

describe("quotationMonthWhere", () => {
  it("ไม่กรองเมื่อค่าใช้ไม่ได้", () => {
    expect(quotationMonthWhere("all")).toEqual({});
    expect(quotationMonthWhere(undefined)).toEqual({});
  });

  it("กรองด้วยช่วง createdAt", () => {
    expect(quotationMonthWhere("2026-08")).toEqual({
      createdAt: { gte: new Date(2026, 7, 1), lt: new Date(2026, 8, 1) },
    });
  });
});

describe("monthKey", () => {
  it("เติมศูนย์หน้าเดือนหลักเดียว", () => {
    expect(monthKey(new Date(2026, 0, 31, 23, 59))).toBe("2026-01");
  });
});

describe("monthKeysBetween", () => {
  it("เรียงจากใหม่ไปเก่าและครอบทั้งสองปลาย", () => {
    expect(monthKeysBetween(new Date(2025, 10, 20), new Date(2026, 1, 3))).toEqual([
      "2026-02",
      "2026-01",
      "2025-12",
      "2025-11",
    ]);
  });

  it("คืนเดือนเดียวเมื่อคำขอทั้งหมดอยู่ในเดือนเดียวกัน", () => {
    expect(monthKeysBetween(new Date(2026, 7, 1), new Date(2026, 7, 28))).toEqual(["2026-08"]);
  });

  it("มีเพดานกันข้อมูลวันที่เพี้ยนทำให้ลิสต์ยาวไม่รู้จบ", () => {
    expect(monthKeysBetween(new Date(1970, 0, 1), new Date(2200, 0, 1))).toHaveLength(240);
  });
});

describe("monthLabelTh", () => {
  it("แสดงเป็นชื่อเดือนไทยกับปีพุทธศักราช", () => {
    expect(monthLabelTh("2026-08")).toBe("สิงหาคม 2569");
  });
});
