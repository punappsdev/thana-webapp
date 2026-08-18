"use client";

import { Check } from "lucide-react";

/**
 * A checkbox styled to match the public site. shadcn's `checkbox` is not
 * installed, and the brand filters in `components/products/product-filters.tsx`
 * already establish this pattern: a visually hidden native input carrying the
 * form value, with a styled box drawn beside it.
 */
export function CheckField({
  name,
  checked,
  onChange,
  children,
  disabled = false,
}: {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 select-none ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <span className="relative mt-0.5 flex items-center">
        <input
          type="checkbox"
          name={name}
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-all ${
            checked
              ? "border-primary bg-primary text-white"
              : disabled
                ? "border-[#c4e2f5] bg-[#ededf7]"
                : "border-[#c4e2f5] bg-white hover:border-[#078ee4]"
          }`}
        >
          {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </span>
      </span>
      <span className="font-body-sm leading-relaxed text-[#434653]">{children}</span>
    </label>
  );
}
