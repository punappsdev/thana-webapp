"use client";

import { getSubdistrictsForDistrict } from "@/lib/subdistricts";
import { findDistrict } from "@/lib/districts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Subdistrict = {
  code: string;
  nameTh: string;
  nameEn: string;
};

const LEGACY_VALUE = "__legacy_subdistrict__";

export function SubdistrictCombobox({
  id,
  name,
  label,
  provinceCode,
  districtValue,
  value,
  locale,
  placeholder,
  chooseDistrictText,
  describedBy,
  invalid,
  onValueChange,
}: {
  id: string;
  name: string;
  label: string;
  provinceCode: string;
  districtValue: string;
  value: string;
  locale: "th" | "en";
  placeholder: string;
  chooseDistrictText: string;
  describedBy?: string;
  invalid?: boolean;
  onValueChange: (value: string) => void;
}) {
  const districtCode = findDistrict(provinceCode, districtValue)?.code ?? "";
  const subdistricts = getSubdistrictsForDistrict(districtCode);
  const selectedSubdistrict = findSubdistrict(subdistricts, value);
  const selectedLabel = selectedSubdistrict
    ? locale === "en"
      ? selectedSubdistrict.nameEn
      : selectedSubdistrict.nameTh
    : value;
  const selectValue = districtCode
    ? selectedSubdistrict?.code ?? (value ? LEGACY_VALUE : "")
    : "";
  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === LEGACY_VALUE) {
      onValueChange(value);
      return;
    }

    const subdistrict = subdistricts.find((item) => item.code === selectedValue);
    if (!subdistrict) return;

    onValueChange(locale === "en" ? subdistrict.nameEn : subdistrict.nameTh);
  };

  return (
    <>
      <Select value={selectValue} onValueChange={handleValueChange} disabled={!districtCode}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-label={label}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
        >
          <SelectValue placeholder={districtCode ? placeholder : chooseDistrictText} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {selectedLabel && !selectedSubdistrict && districtCode && (
            <SelectItem value={LEGACY_VALUE} className="font-body-sm">
              {selectedLabel}
            </SelectItem>
          )}
          {subdistricts.map((subdistrict) => {
            const optionLabel = locale === "en" ? subdistrict.nameEn : subdistrict.nameTh;

            return (
              <SelectItem key={subdistrict.code} value={subdistrict.code} className="font-body-sm">
                {optionLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <input
        type="hidden"
        name={name}
        value={districtCode ? selectedLabel : ""}
        disabled={!districtCode}
        readOnly
      />
    </>
  );
}

function findSubdistrict(
  subdistricts: readonly Subdistrict[],
  value: string,
): Subdistrict | undefined {
  if (!value) return undefined;
  return subdistricts.find(
    (subdistrict) =>
      subdistrict.code === value || subdistrict.nameTh === value || subdistrict.nameEn === value,
  );
}
