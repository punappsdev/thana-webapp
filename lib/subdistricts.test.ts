import { describe, expect, it } from "vitest";
import { getDistrictsForProvince } from "@/lib/districts";
import { SOUTHERN_PROVINCES } from "@/lib/provinces";
import {
  findSubdistrict,
  getSubdistrictsForDistrict,
  isKnownSubdistrictName,
  isSubdistrictForDistrict,
} from "@/lib/subdistricts";

const MUEANG_PHUKET = "8301";
const KATHU = "8302";

describe("Thai subdistrict data", () => {
  it("has subdistricts for every Southern district", () => {
    for (const province of SOUTHERN_PROVINCES) {
      for (const district of getDistrictsForProvince(province.code)) {
        expect(getSubdistrictsForDistrict(district.code).length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps subdistrict codes unique", () => {
    const subdistricts = SOUTHERN_PROVINCES.flatMap((province) =>
      getDistrictsForProvince(province.code).flatMap((district) =>
        getSubdistrictsForDistrict(district.code),
      ),
    );
    const codes = subdistricts.map((subdistrict) => subdistrict.code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  it("returns no subdistricts for unknown or empty district codes", () => {
    expect(getSubdistrictsForDistrict("0000")).toHaveLength(0);
    expect(getSubdistrictsForDistrict("")).toHaveLength(0);
    expect(getSubdistrictsForDistrict(null)).toHaveLength(0);
  });

  it("accepts Thai and English names of a Mueang Phuket subdistrict", () => {
    const [subdistrict] = getSubdistrictsForDistrict(MUEANG_PHUKET);

    expect(subdistrict).toBeDefined();
    expect(isSubdistrictForDistrict(MUEANG_PHUKET, subdistrict.nameTh)).toBe(true);
    expect(isSubdistrictForDistrict(MUEANG_PHUKET, subdistrict.nameEn)).toBe(true);
  });

  it("resolves a stored subdistrict back to its code", () => {
    const [subdistrict] = getSubdistrictsForDistrict(MUEANG_PHUKET);

    expect(findSubdistrict(MUEANG_PHUKET, subdistrict.nameTh)?.code).toBe(subdistrict.code);
    expect(findSubdistrict(MUEANG_PHUKET, subdistrict.nameEn)?.code).toBe(subdistrict.code);
    expect(findSubdistrict(MUEANG_PHUKET, "does-not-exist")).toBeNull();
    expect(findSubdistrict(MUEANG_PHUKET, null)).toBeNull();
  });

  it("rejects recognized cross-district subdistrict names", () => {
    const [subdistrict] = getSubdistrictsForDistrict(KATHU);

    expect(subdistrict).toBeDefined();
    expect(isKnownSubdistrictName(subdistrict.nameTh)).toBe(true);
    expect(isKnownSubdistrictName(subdistrict.nameEn)).toBe(true);
    expect(isSubdistrictForDistrict(MUEANG_PHUKET, subdistrict.nameTh)).toBe(false);
    expect(isSubdistrictForDistrict(MUEANG_PHUKET, subdistrict.nameEn)).toBe(false);
  });

  it("distinguishes unknown legacy text from known subdistrict names", () => {
    const legacy = "ตำบลเก่าที่ไม่อยู่ในข้อมูลอ้างอิง";

    expect(isKnownSubdistrictName(legacy)).toBe(false);
    expect(isSubdistrictForDistrict(MUEANG_PHUKET, legacy)).toBe(false);
    expect(isSubdistrictForDistrict(MUEANG_PHUKET, " ")).toBe(false);
    expect(isSubdistrictForDistrict(MUEANG_PHUKET, null)).toBe(false);
  });
});
