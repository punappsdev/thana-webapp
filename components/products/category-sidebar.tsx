"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { ChevronDown } from "lucide-react";

export interface SidebarSubCategory {
  slug: string;
  name: string;
  count: number;
}

export interface SidebarCategory {
  slug: string;
  name: string;
  count: number;
  subCategories: SidebarSubCategory[];
}

interface CategorySidebarProps {
  categories: SidebarCategory[];
  activeCategory: string | null;
  activeSub: string | null;
  totalCount: number;
  labels: { heading: string; all: string };
}

export function CategorySidebar({
  categories,
  activeCategory,
  activeSub,
  totalCount,
  labels,
}: CategorySidebarProps) {
  const [open, setOpen] = useState(false);

  const activeName =
    categories.find((c) => c.slug === activeCategory)?.name ?? labels.all;

  // Mirror the CategoryFilter pill styles so the sidebar reads as the same
  // component family: white surface, primary active, light hover for inactive.
  const rowBase =
    "flex items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#078ee4] focus-visible:ring-offset-1 focus-visible:ring-offset-white";
  const rowActive = "bg-primary text-white shadow-blue-sm font-semibold";
  const rowInactive = "text-[#434653] hover:bg-[#f3f3fc]";

  return (
    <aside className="md:sticky md:top-24 md:self-start">
      {/* Mobile disclosure — the panel below is always mounted so it stays
          keyboard-reachable and simply expands, rather than mounting on toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="product-category-nav"
        className="md:hidden w-full flex items-center justify-between gap-3 rounded-lg border border-[#c4e2f5] bg-white px-4 py-3 font-label-md font-semibold text-on-surface transition-colors duration-150 hover:bg-[#f3f3fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078ee4]"
      >
        <span className="flex items-center gap-2">
          {labels.heading}
          <span className="font-label-sm font-normal text-[#434653]">{activeName}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none md:grid-rows-[1fr] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden md:overflow-visible">
          <nav
            id="product-category-nav"
            aria-label={labels.heading}
            className="mt-2 md:mt-0 rounded-lg border border-[#c4e2f5] bg-white p-3"
          >
            <h2 className="hidden md:block px-3 pt-1 pb-3 font-label-lg font-semibold text-on-surface">
              {labels.heading}
            </h2>

            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/products"
                  aria-current={!activeCategory ? "page" : undefined}
                  className={`${rowBase} ${
                    !activeCategory ? rowActive : rowInactive
                  }`}
                >
                  <span className="font-body-sm">{labels.all}</span>
                  <span
                    className={`font-label-sm tabular-nums ${
                      !activeCategory ? "text-white/80" : "text-[#434653]"
                    }`}
                  >
                    {totalCount}
                  </span>
                </Link>
              </li>

              {categories.map((cat) => {
                const isActive = activeCategory === cat.slug;

                return (
                  <li key={cat.slug}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      aria-current={isActive && !activeSub ? "page" : undefined}
                      className={`${rowBase} ${
                        isActive && !activeSub ? rowActive : rowInactive
                      }`}
                    >
                      <span className="font-body-sm">{cat.name}</span>
                      <span
                        className={`font-label-sm tabular-nums ${
                          isActive && !activeSub ? "text-white/80" : "text-[#434653]"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </Link>

                    {/* Sub-categories reveal only under the open category, indented
                        rather than rule-marked to keep the panel quiet */}
                    {isActive && cat.subCategories.length > 0 && (
                      <ul className="mt-0.5 mb-1 ml-3 space-y-0.5">
                        {cat.subCategories.map((sub) => {
                          const subActive = activeSub === sub.slug;
                          return (
                            <li key={sub.slug}>
                              <Link
                                href={`/products?category=${cat.slug}&sub=${sub.slug}`}
                                aria-current={subActive ? "page" : undefined}
                                className={`${rowBase} py-1.5 ${
                                  subActive ? rowActive : rowInactive
                                }`}
                              >
                                <span className="font-label-sm">{sub.name}</span>
                                <span
                                  className={`font-label-sm tabular-nums ${
                                    subActive ? "text-white/80" : "text-[#434653]"
                                  }`}
                                >
                                  {sub.count}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  );
}
