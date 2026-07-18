"use client";

import { useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";

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
  labels: { heading: string; all: string; allSubCategories: string };
}

// Shared pill style — mirrors `CategoryFilter` so the sidebar reads as the
// same component family across pages.
function chipClass(isActive: boolean): string {
  return `shrink-0 px-4 py-2 font-label-sm rounded-md font-semibold transition-all border whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078ee4] ${
    isActive
      ? "bg-primary text-white border-primary shadow-blue-sm"
      : "bg-white text-[#434653] border-[#c4e2f5] hover:bg-[#f3f3fc]"
  }`;
}

// Hide scrollbars on horizontal chip rows while keeping scroll behavior.
// No snap — snap-x makes free scrolling to the first item feel stuck.
const scrollRowClass =
  "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain";

// Desktop sidebar rows
const rowBase =
  "flex items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#078ee4] focus-visible:ring-offset-1 focus-visible:ring-offset-white";
const rowActive = "bg-primary text-white shadow-blue-sm font-semibold";
const rowInactive = "text-[#434653] hover:bg-[#f3f3fc]";

/**
 * Mobile sticky chip bar — replaces the disclosure panel. Two rows of
 * horizontally scrollable pills: top-level categories and, when a parent
 * is selected, its sub-categories. Sticky below the fixed header so users
 * can change filters without scrolling back to the top of the catalog.
 *
 * On page load (after clicking a chip triggers a server navigation), the
 * active chip auto-scrolls into view so users always see what's selected.
 */
export function MobileCategoryChips({
  categories,
  activeCategory,
  activeSub,
  labels,
}: CategorySidebarProps) {
  const activeParent = categories.find((c) => c.slug === activeCategory);
  const subs = activeParent?.subCategories ?? [];

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const subScrollRef = useRef<HTMLDivElement>(null);
  const activeMainRef = useRef<HTMLAnchorElement>(null);
  const activeSubRef = useRef<HTMLAnchorElement>(null);

  // Scroll the active main chip into view — only if it's outside the
  // visible area, so we don't override user scroll position needlessly.
  useEffect(() => {
    const container = mainScrollRef.current;
    const chip = activeMainRef.current;
    if (!container || !chip) return;

    const cLeft = container.scrollLeft;
    const cRight = cLeft + container.clientWidth;
    const chipLeft = chip.offsetLeft;
    const chipRight = chipLeft + chip.offsetWidth;

    if (chipLeft < cLeft) {
      container.scrollTo({ left: Math.max(0, chipLeft - 16), behavior: "smooth" });
    } else if (chipRight > cRight) {
      container.scrollTo({ left: chipRight - container.clientWidth + 16, behavior: "smooth" });
    }
  }, [activeCategory]);

  // Same for the active sub chip
  useEffect(() => {
    const container = subScrollRef.current;
    const chip = activeSubRef.current;
    if (!container || !chip) return;

    const cLeft = container.scrollLeft;
    const cRight = cLeft + container.clientWidth;
    const chipLeft = chip.offsetLeft;
    const chipRight = chipLeft + chip.offsetWidth;

    if (chipLeft < cLeft) {
      container.scrollTo({ left: Math.max(0, chipLeft - 16), behavior: "smooth" });
    } else if (chipRight > cRight) {
      container.scrollTo({ left: chipRight - container.clientWidth + 16, behavior: "smooth" });
    }
  }, [activeSub]);

  return (
    <div className="md:hidden sticky top-[72px] z-30 bg-background/95 backdrop-blur-md border-b border-[#c4e2f5] px-4 pt-3 pb-3">
      <div ref={mainScrollRef} className={scrollRowClass} aria-label={labels.heading} role="tablist">
        <Link
          href="/products"
          aria-current={!activeCategory ? "page" : undefined}
          className={chipClass(!activeCategory)}
          ref={!activeCategory ? activeMainRef : undefined}
        >
          {labels.all}
        </Link>
        {categories.map((c) => {
          const isActive = activeCategory === c.slug;
          return (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              aria-current={isActive ? "page" : undefined}
              className={chipClass(isActive)}
              ref={isActive ? activeMainRef : undefined}
            >
              {c.name}
            </Link>
          );
        })}
      </div>

      {subs.length > 0 && (
        <div
          ref={subScrollRef}
          className={`${scrollRowClass} mt-2 pt-2 border-t border-[#c4e2f5]/60`}
          aria-label={labels.allSubCategories}
          role="tablist"
        >
          <Link
            href={`/products?category=${activeParent!.slug}`}
            aria-current={!activeSub ? "page" : undefined}
            className={chipClass(!activeSub)}
            ref={!activeSub ? activeSubRef : undefined}
          >
            {labels.allSubCategories}
          </Link>
          {subs.map((s) => {
            const isActive = activeSub === s.slug;
            return (
              <Link
                key={s.slug}
                href={`/products?category=${activeParent!.slug}&sub=${s.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={chipClass(isActive)}
                ref={isActive ? activeSubRef : undefined}
              >
                {s.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Desktop sidebar — a vertical nav with all categories and their counts.
 * Sub-categories reveal only under the active parent.
 */
export function CategorySidebar({
  categories,
  activeCategory,
  activeSub,
  totalCount,
  labels,
}: CategorySidebarProps) {
  return (
    <aside className="hidden md:block md:sticky md:top-24 md:self-start">
      <nav
        aria-label={labels.heading}
        className="rounded-lg border border-[#c4e2f5] bg-white p-3"
      >
        <h2 className="px-3 pt-1 pb-3 font-label-lg font-semibold text-on-surface">
          {labels.heading}
        </h2>

        <ul className="space-y-0.5">
          <li>
            <Link
              href="/products"
              aria-current={!activeCategory ? "page" : undefined}
              className={`${rowBase} ${!activeCategory ? rowActive : rowInactive}`}
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
    </aside>
  );
}
