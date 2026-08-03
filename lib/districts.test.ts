import { describe, expect, it } from "vitest";
import { PHUKET_CODE, PROVINCES } from "@/lib/provinces";
import {
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

  it("distinguishes unknown legacy text from known district names", () => {
    const legacyDistrict = "ตำบลเก่าที่ไม่อยู่ในข้อมูลอ้างอิง";

    expect(isKnownDistrictName(legacyDistrict)).toBe(false);
    expect(isDistrictForProvince(PHUKET_CODE, legacyDistrict)).toBe(false);
    expect(isDistrictForProvince(PHUKET_CODE, "Unknown District")).toBe(false);
    expect(isDistrictForProvince(PHUKET_CODE, " ")).toBe(false);
    expect(isDistrictForProvince(PHUKET_CODE, null)).toBe(false);
  });
});
