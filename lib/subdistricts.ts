import sourceSubdistricts from "@/lib/data/thai-subdistricts.json";
import { findDistrictByCode } from "@/lib/districts";

export type Subdistrict = {
  code: string;
  nameTh: string;
  nameEn: string;
};

/**
 * ตำบลชุดข้อมูลที่รองรับการให้บริการ (ภาคใต้ ยกเว้น 3 จังหวัดชายแดน) เก็บเป็น
 * ไฟล์สถิตแบบเดียวกับจังหวัด/อำเภอ — `QuotationRequest.deliverySubDistrict` เก็บ
 * ชื่อที่แสดงผล ไม่ใช่รหัส เช่นเดียวกับอำเภอ
 */
const EXPECTED_SUBDISTRICT_COUNT = 834;

if (sourceSubdistricts.length !== EXPECTED_SUBDISTRICT_COUNT) {
  throw new Error(
    `Expected ${EXPECTED_SUBDISTRICT_COUNT} Southern subdistricts, found ${sourceSubdistricts.length}`,
  );
}

const subdistrictsByDistrictCode = new Map<string, Subdistrict[]>();
const subdistrictCodes = new Set<string>();
const knownSubdistrictNames = new Set<string>();
for (const subdistrict of sourceSubdistricts) {
  const code = String(subdistrict.subdistrictCode);
  const districtCode = String(subdistrict.districtCode);

  if (subdistrictCodes.has(code)) {
    throw new Error(`Duplicate source subdistrict code: ${code}`);
  }

  // ตำบลทุกตัวต้องสังกัดอำเภอที่มีอยู่จริง กันข้อมูล vendor ผิดชุดหลุดเข้ามา
  if (!findDistrictByCode(districtCode)) {
    throw new Error(`Subdistrict references unknown district: ${districtCode}`);
  }

  const subdistricts = subdistrictsByDistrictCode.get(districtCode) ?? [];
  subdistricts.push({
    code,
    nameTh: subdistrict.subdistrictNameTh,
    nameEn: subdistrict.subdistrictNameEn,
  });
  subdistrictsByDistrictCode.set(districtCode, subdistricts);
  subdistrictCodes.add(code);
  knownSubdistrictNames.add(subdistrict.subdistrictNameTh);
  knownSubdistrictNames.add(subdistrict.subdistrictNameEn);
}

const frozenSubdistrictsByDistrictCode = new Map<string, readonly Subdistrict[]>();
for (const [districtCode, subdistricts] of subdistrictsByDistrictCode) {
  frozenSubdistrictsByDistrictCode.set(districtCode, Object.freeze(subdistricts));
}

const EMPTY_SUBDISTRICTS: readonly Subdistrict[] = Object.freeze([]);

export function getSubdistrictsForDistrict(
  districtCode: string | null | undefined,
): readonly Subdistrict[] {
  if (!districtCode) return EMPTY_SUBDISTRICTS;
  return frozenSubdistrictsByDistrictCode.get(districtCode) ?? EMPTY_SUBDISTRICTS;
}

/**
 * Resolves a stored subdistrict back to its record. Mirrors `findDistrict`:
 * `deliverySubDistrict` keeps the *display name*, and which language that name is in
 * depends on the locale the customer filled the form in.
 */
export function findSubdistrict(
  districtCode: string | null | undefined,
  subdistrict: string | null | undefined,
): Subdistrict | null {
  if (typeof subdistrict !== "string") return null;
  const selectedName = subdistrict.trim();
  if (!selectedName) return null;

  return (
    getSubdistrictsForDistrict(districtCode).find(
      (candidate) => candidate.nameTh === selectedName || candidate.nameEn === selectedName,
    ) ?? null
  );
}

export function isSubdistrictForDistrict(
  districtCode: string | null | undefined,
  subdistrict: string | null | undefined,
): boolean {
  return findSubdistrict(districtCode, subdistrict) !== null;
}

/** True when a value is any subdistrict name in the source data, regardless of district. */
export function isKnownSubdistrictName(subdistrict: string | null | undefined): boolean {
  if (typeof subdistrict !== "string") return false;
  const selectedName = subdistrict.trim();
  return selectedName !== "" && knownSubdistrictNames.has(selectedName);
}
