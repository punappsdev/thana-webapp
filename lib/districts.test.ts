import { describe, expect, it } from "vitest";
import { PHUKET_CODE, PROVINCES } from "@/lib/provinces";
import {
  findDistrictByCode,
  getDistrictsForProvince,
  isDistrictForProvince,
  isKnownDistrictName,
} from "@/lib/districts";

describe("Thai district data", () => {
  it("has districts for every app province", () => {
    for (const province of PROVINCES) {
      expect(getDistrictsForProvince(province.code).length).toBeGreaterThan(0);
    }
  });

  it("keeps district codes unique", () => {
    const districts = PROVINCES.flatMap((province) => getDistrictsForProvince(province.code));
    const codes = districts.map((district) => district.code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  it("accepts Thai and English Phuket district names", () => {
    expect(isDistrictForProvince(PHUKET_CODE, "เมืองภูเก็ต")).toBe(true);
    expect(isDistrictForProvince(PHUKET_CODE, "Mueang Phuket")).toBe(true);
  });

  it("rejects recognized cross-province district names", () => {
    expect(isKnownDistrictName("เมืองกระบี่")).toBe(true);
    expect(isKnownDistrictName("Mueang Krabi")).toBe(true);
    expect(isDistrictForProvince(PHUKET_CODE, "เมืองกระบี่")).toBe(false);
    expect(isDistrictForProvince(PHUKET_CODE, "Mueang Krabi")).toBe(false);
  });

  // กฎเลือกกลุ่มไลน์เก็บ "รหัสอำเภอ" ไว้ในฐานข้อมูล จึงต้องแปลงกลับเป็นชื่อและจังหวัดได้
  it("resolves a district code back to its district and province", () => {
    // 8301 = อ.เมืองภูเก็ต ตามค่าตั้งต้นของกฎเลือกกลุ่มไลน์ทีมขาย
    const found = findDistrictByCode("8301");

    expect(found?.district.nameTh).toBe("เมืองภูเก็ต");
    expect(found?.provinceCode).toBe(PHUKET_CODE);
  });

  it("returns null for codes that do not exist", () => {
    expect(findDistrictByCode("0000")).toBeNull();
    expect(findDistrictByCode("")).toBeNull();
    expect(findDistrictByCode(null)).toBeNull();
  });

  it("distinguishes unknown legacy text from known district names", () => {
    const legacyDistrict = "ตำบลเก่าที่ไม่อยู่ในข้อมูลอ้างอิง";

    expect(isKnownDistrictName(legacyDistrict)).toBe(false);
    expect(isDistrictForProvince(PHUKET_CODE, legacyDistrict)).toBe(false);
    expect(isDistrictForProvince(PHUKET_CODE, "Unknown District")).toBe(false);
    expect(isDistrictForProvince(PHUKET_CODE, " ")).toBe(false);
    expect(isDistrictForProvince(PHUKET_CODE, null)).toBe(false);
  });
});
