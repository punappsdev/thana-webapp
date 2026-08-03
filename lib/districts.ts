import sourceDistricts from "@/lib/data/thai-districts.json";
import sourceProvinces from "@/lib/data/thai-provinces.json";
import { PROVINCES } from "@/lib/provinces";

export type District = {
  code: string;
  nameTh: string;
  nameEn: string;
};

const EXPECTED_PROVINCE_COUNT = 77;
const EXPECTED_DISTRICT_COUNT = 928;

if (PROVINCES.length !== EXPECTED_PROVINCE_COUNT) {
  throw new Error(
    `Expected ${EXPECTED_PROVINCE_COUNT} app provinces, found ${PROVINCES.length}`,
  );
}

if (sourceProvinces.length !== EXPECTED_PROVINCE_COUNT) {
  throw new Error(
    `Expected ${EXPECTED_PROVINCE_COUNT} source provinces, found ${sourceProvinces.length}`,
  );
}

if (sourceDistricts.length !== EXPECTED_DISTRICT_COUNT) {
  throw new Error(
    `Expected ${EXPECTED_DISTRICT_COUNT} source districts, found ${sourceDistricts.length}`,
  );
}

const sourceProvinceCodeByThaiName = new Map<string, number>();
const sourceProvinceCodes = new Set<number>();
for (const province of sourceProvinces) {
  if (sourceProvinceCodeByThaiName.has(province.provinceNameTh)) {
    throw new Error(`Duplicate source province name: ${province.provinceNameTh}`);
  }
  if (sourceProvinceCodes.has(province.provinceCode)) {
    throw new Error(`Duplicate source province code: ${province.provinceCode}`);
  }
  sourceProvinceCodeByThaiName.set(province.provinceNameTh, province.provinceCode);
  sourceProvinceCodes.add(province.provinceCode);
}

const sourceCodeByAppProvinceCode = new Map<string, number>();
for (const province of PROVINCES) {
  const sourceCode = sourceProvinceCodeByThaiName.get(province.nameTh);
  if (sourceCode === undefined) {
    throw new Error(`No source province matches Thai name: ${province.nameTh}`);
  }
  sourceCodeByAppProvinceCode.set(province.code, sourceCode);
}

if (sourceCodeByAppProvinceCode.size !== EXPECTED_PROVINCE_COUNT) {
  throw new Error(
    `Expected mappings for ${EXPECTED_PROVINCE_COUNT} app provinces, found ${sourceCodeByAppProvinceCode.size}`,
  );
}

const districtsBySourceProvinceCode = new Map<number, District[]>();
const districtCodes = new Set<string>();
const knownDistrictNames = new Set<string>();
for (const district of sourceDistricts) {
  const code = String(district.districtCode);
  if (districtCodes.has(code)) {
    throw new Error(`Duplicate source district code: ${code}`);
  }
  if (!sourceProvinceCodes.has(district.provinceCode)) {
    throw new Error(`District references unknown source province: ${district.provinceCode}`);
  }

  const districts = districtsBySourceProvinceCode.get(district.provinceCode) ?? [];
  districts.push({
    code,
    nameTh: district.districtNameTh,
    nameEn: district.districtNameEn,
  });
  districtsBySourceProvinceCode.set(district.provinceCode, districts);
  districtCodes.add(code);
  knownDistrictNames.add(district.districtNameTh);
  knownDistrictNames.add(district.districtNameEn);
}

const districtsByProvinceCode = new Map<string, readonly District[]>();
for (const province of PROVINCES) {
  const sourceCode = sourceCodeByAppProvinceCode.get(province.code);
  if (sourceCode === undefined) {
    throw new Error(`No source code mapped for app province: ${province.code}`);
  }

  const districts = districtsBySourceProvinceCode.get(sourceCode);
  if (!districts || districts.length === 0) {
    throw new Error(`No source districts mapped for app province: ${province.code}`);
  }
  districtsByProvinceCode.set(province.code, Object.freeze(districts));
}

const EMPTY_DISTRICTS: readonly District[] = Object.freeze([]);

export function getDistrictsForProvince(
  provinceCode: string | null | undefined,
): readonly District[] {
  if (!provinceCode) return EMPTY_DISTRICTS;
  return districtsByProvinceCode.get(provinceCode) ?? EMPTY_DISTRICTS;
}

/**
 * Resolves a stored district back to its record. `QuotationRequest.deliveryDistrict`
 * keeps the *display name* rather than a code, and which language that name is in
 * depends on the locale the customer filled the form in — so anything that needs a
 * stable identity for a district has to come back through here.
 */
export function findDistrict(
  provinceCode: string | null | undefined,
  district: string | null | undefined,
): District | null {
  if (typeof district !== "string") return null;
  const selectedName = district.trim();
  if (!selectedName) return null;

  return (
    getDistrictsForProvince(provinceCode).find(
      (candidate) => candidate.nameTh === selectedName || candidate.nameEn === selectedName,
    ) ?? null
  );
}

export function isDistrictForProvince(
  provinceCode: string | null | undefined,
  district: string | null | undefined,
): boolean {
  return findDistrict(provinceCode, district) !== null;
}

/** True when a value is any district name in the source data, regardless of province. */
export function isKnownDistrictName(district: string | null | undefined): boolean {
  if (typeof district !== "string") return false;
  const selectedName = district.trim();
  return selectedName !== "" && knownDistrictNames.has(selectedName);
}
