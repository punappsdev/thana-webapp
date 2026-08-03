"use client";

import { getDistrictsForProvince } from "@/lib/districts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type District = {
  code: string;
  nameTh: string;
  nameEn: string;
};

export function DistrictCombobox({
  id,
  name,
  label,
  provinceCode,
  value,
  locale,
  placeholder,
  chooseProvinceText,
  describedBy,
  invalid,
  onValueChange,
}: {
  id: string;
  name: string;
  label: string;
  provinceCode: string;
  value: string;
  locale: "th" | "en";
  placeholder: string;
  chooseProvinceText: string;
  describedBy?: string;
  invalid?: boolean;
  onValueChange: (value: string) => void;
}) {
  const districts = getDistrictsForProvince(provinceCode);
  const selectedDistrict = findDistrict(districts, value);
  const selectedLabel = selectedDistrict
    ? locale === "en"
      ? selectedDistrict.nameEn
      : selectedDistrict.nameTh
    : value;
  const selectValue = provinceCode ? selectedLabel : "";

  return (
    <Select
      name={name}
      value={selectValue}
      onValueChange={onValueChange}
      disabled={!provinceCode}
    >
      <SelectTrigger
        id={id}
        className="w-full"
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
      >
        <SelectValue placeholder={provinceCode ? placeholder : chooseProvinceText} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {selectedLabel && !selectedDistrict && provinceCode && (
          <SelectItem value={selectedLabel} className="font-body-sm">
            {selectedLabel}
          </SelectItem>
        )}
        {districts.map((district) => {
          const optionLabel = locale === "en" ? district.nameEn : district.nameTh;

          return (
            <SelectItem key={district.code} value={optionLabel} className="font-body-sm">
              {optionLabel}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function findDistrict(districts: readonly District[], value: string): District | undefined {
  if (!value) return undefined;
  return districts.find(
    (district) =>
      district.code === value || district.nameTh === value || district.nameEn === value,
  );
}
