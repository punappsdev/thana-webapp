"use client";

import { useRouter } from "@/i18n/routing";

export interface CategoryFilterItem {
  key: string;
  label: string;
  href: string;
}

interface CategoryFilterProps {
  items: CategoryFilterItem[];
  activeKey?: string;
}

export function CategoryFilter({ items, activeKey }: CategoryFilterProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => router.push(item.href, { scroll: false })}
            className={`px-4 py-2 font-label-sm rounded-md font-semibold transition-all border ${
              isActive
                ? "bg-primary text-white border-primary shadow-blue-sm"
                : "bg-white text-[#434653] border-[#c4e2f5] hover:bg-[#f3f3fc]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
