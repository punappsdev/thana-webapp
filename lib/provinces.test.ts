import { describe, expect, it } from "vitest";
import { isSouthernProvinceCode, SOUTHERN_PROVINCES } from "@/lib/provinces";

describe("Southern province scope", () => {
  it("serves exactly the 11 Southern provinces, excluding the 3 border provinces", () => {
    expect(SOUTHERN_PROVINCES.map((province) => province.code).sort()).toEqual([
      "chumphon",
      "krabi",
      "nakhon-si-thammarat",
      "phang-nga",
      "phatthalung",
      "phuket",
      "ranong",
      "satun",
      "songkhla",
      "surat-thani",
      "trang",
    ]);
  });

  it("excludes the three southern-border provinces", () => {
    expect(isSouthernProvinceCode("yala")).toBe(false);
    expect(isSouthernProvinceCode("narathiwat")).toBe(false);
    expect(isSouthernProvinceCode("pattani")).toBe(false);
  });

  it("recognizes a Southern province and rejects a non-Southern one", () => {
    expect(isSouthernProvinceCode("phuket")).toBe(true);
    expect(isSouthernProvinceCode("bangkok")).toBe(false);
  });
});
