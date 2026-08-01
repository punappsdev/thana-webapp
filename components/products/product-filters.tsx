"use client";

import * as React from "react";
import { SlidersHorizontal, Check, RotateCcw } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BrandItem {
  slug: string;
  name: string;
}

interface ProductSortAndFilterProps {
  brands: BrandItem[];
  currentParams: {
    sort?: string;
    brand?: string;
  };
  locale: string;
  /** A search term is active, so relevance becomes an option — and the default. */
  hasQuery?: boolean;
  labels: {
    sortBy: string;
    filterButton: string;
    sortRelevance: string;
    sortFeatured: string;
    sortNameAsc: string;
    sortNameDesc: string;
    apply: string;
    clearFilters: string;
    brandHeading: string;
  };
}

export function ProductSortAndFilter({
  brands,
  currentParams,
  locale,
  hasQuery = false,
  labels,
}: ProductSortAndFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = React.useState(false);

  // Parse initial state from props. While searching, an absent `sort` means
  // relevance — the server orders by match quality unless told otherwise.
  const defaultSort = hasQuery ? "relevance" : "featured";
  const activeSort = currentParams.sort || defaultSort;
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>(
    typeof currentParams.brand === "string" ? currentParams.brand.split(",") : []
  );

  // Sync state if parameters change externally (e.g. locale or link change)
  React.useEffect(() => {
    setSelectedBrands(typeof currentParams.brand === "string" ? currentParams.brand.split(",") : []);
  }, [currentParams.brand]);

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(window.location.search);
    if (newSort && newSort !== defaultSort) {
      params.set("sort", newSort);
    } else {
      params.delete("sort");
    }
    params.delete("page"); // Reset page
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleBrandToggle = (slug: string) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((b) => b !== slug) : [...prev, slug]
    );
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams(window.location.search);

    if (selectedBrands.length > 0) {
      params.set("brand", selectedBrands.join(","));
    } else {
      params.delete("brand");
    }

    params.delete("page"); // Reset page
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedBrands([]);

    const params = new URLSearchParams(window.location.search);
    params.delete("brand");
    params.delete("page"); // Reset page

    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const isFilterActive = selectedBrands.length > 0;

  return (
    <div className="flex items-center gap-3">
      {/* Filter Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-2 px-3 py-1.5 h-8 font-label-sm font-semibold rounded-md border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078ee4] ${
              isFilterActive
                ? "bg-primary text-white border-primary shadow-blue-sm"
                : "bg-white text-[#434653] border-[#c4e2f5] hover:bg-[#f3f3fc]"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{labels.filterButton}</span>
            {isFilterActive && (
              <span className="flex items-center justify-center bg-secondary text-white text-[10px] leading-none h-4 min-w-4 rounded-full px-1">
                {selectedBrands.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-72 bg-white border border-[#c4e2f5] rounded-xl p-4 shadow-lg focus-visible:outline-none"
          style={{ boxShadow: "0 10px 30px -10px rgba(0, 64, 173, 0.08)" }}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#ededf7] pb-2">
              <span className="font-label-md font-bold text-on-surface">
                {labels.filterButton}
              </span>
              {isFilterActive && (
                <button
                  onClick={handleClearFilters}
                  className="font-label-sm text-[#747684] hover:text-error flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>{labels.clearFilters}</span>
                </button>
              )}
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="space-y-2">
                <span className="font-label-sm font-bold text-on-surface block">
                  {labels.brandHeading}
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
                  {brands.map((brand) => {
                    const isChecked = selectedBrands.includes(brand.slug);
                    return (
                      <label
                        key={brand.slug}
                        className="flex items-center gap-2.5 py-1 px-1 rounded-md hover:bg-[#f3f3fc] cursor-pointer transition-colors group select-none"
                      >
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => handleBrandToggle(brand.slug)}
                          />
                          <div
                            className={`h-4 w-4 rounded-sm border flex items-center justify-center transition-all ${
                              isChecked
                                ? "bg-primary border-primary text-white"
                                : "border-[#c4e2f5] bg-white group-hover:border-[#078ee4]"
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <span className="font-body-sm text-[#434653] font-medium leading-none">
                          {brand.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[#ededf7]">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 h-9 inline-flex items-center justify-center font-label-sm font-bold rounded-md border border-[#e2e2eb] text-[#434653] bg-white hover:bg-[#f3f3fc] cursor-pointer transition-colors"
              >
                {locale === "th" ? "ยกเลิก" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 h-9 inline-flex items-center justify-center font-label-sm font-bold rounded-md text-white bg-linear-to-b from-[#078ee4] to-primary shadow-blue-sm hover:brightness-110 cursor-pointer transition-all"
              >
                {labels.apply}
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Select value={activeSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-fit h-8 !font-label-sm !font-semibold !px-3 border-[#c4e2f5] hover:bg-[#f3f3fc] bg-white rounded-md text-[#434653] cursor-pointer flex items-center gap-1.5">
          <SelectValue placeholder={labels.sortBy} />
        </SelectTrigger>
        <SelectContent align="end" className="bg-white border border-[#c4e2f5] rounded-lg shadow-md">
          {hasQuery && (
            <SelectItem value="relevance" className="cursor-pointer !font-body-sm font-medium hover:bg-[#f3f3fc]">
              {labels.sortRelevance}
            </SelectItem>
          )}
          <SelectItem value="featured" className="cursor-pointer !font-body-sm font-medium hover:bg-[#f3f3fc]">
            {labels.sortFeatured}
          </SelectItem>
          <SelectItem value="name-asc" className="cursor-pointer !font-body-sm font-medium hover:bg-[#f3f3fc]">
            {labels.sortNameAsc}
          </SelectItem>
          <SelectItem value="name-desc" className="cursor-pointer !font-body-sm font-medium hover:bg-[#f3f3fc]">
            {labels.sortNameDesc}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
