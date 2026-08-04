"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type MultiSelectOption = {
  value: string;
  label: string;
  /** ข้อความรองท้ายรายการ เช่น จังหวัดของอำเภอ หรือ SKU ของสินค้า ค้นหาได้ด้วย */
  hint?: string;
};

/**
 * ช่องเลือกได้หลายค่าพร้อมค้นหา ส่งค่าออกเป็น hidden input เดียวคั่นด้วยจุลภาค
 *
 * กรองรายการเองแทนที่จะใช้ตัวกรองในตัวของ cmdk เพราะรายการอำเภอมี 928 รายการ
 * การ render ทั้งหมดลง DOM ทุกครั้งที่เปิดทำให้หน่วง จึงตัดให้เหลือ `maxVisible`
 * รายการแรกที่ตรงคำค้น
 */
export function MultiSelectField({
  id,
  name,
  label,
  description,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "พิมพ์เพื่อค้นหา",
  emptyText = "ไม่พบรายการที่ค้นหา",
  maxVisible = 50,
}: {
  id: string;
  name: string;
  label: string;
  description?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxVisible?: number;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const optionByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );

  const matches = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(keyword) ||
        option.hint?.toLowerCase().includes(keyword),
    );
  }, [options, search]);

  const visible = matches.slice(0, maxVisible);
  const hiddenCount = matches.length - visible.length;

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((current) => current !== optionValue)
        : [...value, optionValue],
    );
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-label-md">
        {label}
      </Label>
      <input type="hidden" name={name} value={value.join(",")} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-body-sm"
          >
            <span className="truncate">
              {value.length > 0 ? `เลือกไว้ ${value.length} รายการ` : placeholder}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-0"
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
            />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {visible.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    data-checked={value.includes(option.value) ? "true" : "false"}
                    onSelect={() => toggle(option.value)}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="shrink-0 font-label-sm text-muted-foreground">
                        {option.hint}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
              {hiddenCount > 0 ? (
                <p className="px-3 py-2 font-label-sm text-muted-foreground">
                  ยังมีอีก {hiddenCount} รายการ พิมพ์เพื่อค้นหาให้แคบลง
                </p>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((selectedValue) => {
            const option = optionByValue.get(selectedValue);
            return (
              <li key={selectedValue}>
                <Badge variant="secondary" className="gap-1 pr-1">
                  <span className="truncate">{option?.label ?? selectedValue}</span>
                  <button
                    type="button"
                    onClick={() => toggle(selectedValue)}
                    aria-label={`เอา ${option?.label ?? selectedValue} ออก`}
                    className="rounded-full p-0.5 hover:bg-foreground/10"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              </li>
            );
          })}
        </ul>
      ) : null}

      {description ? (
        <p className="font-body-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
