"use client";

import * as React from "react";
import Image from "next/image";
import { Command as CommandPrimitive } from "cmdk";
import { ArrowRight, Clock, LayoutGrid, Package, Search, Tag, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useConsent } from "@/components/consent/use-consent";
import {
  readRecentSearches,
  writeRecentSearches,
} from "@/lib/search-history";
import type { SearchGroupItem, SearchResponse, SearchSuggestion } from "@/app/api/products/search/route";

/**
 * Header product search: an input that opens a live suggestion panel, and an
 * Enter key that falls through to the full catalog results at /products?q=.
 *
 * Built on cmdk (already in the project) so arrow-key navigation, roving focus
 * and listbox ARIA come for free. The panel is hand-positioned rather than put
 * in a Popover because a Popover moves focus off the input on open.
 */

interface ProductSearchBoxProps {
  /** Desktop sits in the header bar; mobile sits inside the nav drawer. */
  variant: "desktop" | "mobile";
  className?: string;
  /** Extra classes for the input itself — the header uses this to animate width. */
  inputClassName?: string;
  /** Lets the header collapse its nav while the box has focus. */
  onFocusChange?: (focused: boolean) => void;
  /** Fires after any navigation, so the mobile drawer can close itself. */
  onNavigate?: () => void;
}

const DEBOUNCE_MS = 250;
const RECENT_LIMIT = 5;
/** Bound on the per-session response cache, so a long session cannot grow it forever. */
const CACHE_LIMIT = 60;

const EMPTY_RESULT: SearchResponse = { products: [], categories: [], brands: [], total: 0 };

export function ProductSearchBox({
  variant,
  className,
  inputClassName,
  onFocusChange,
  onNavigate,
}: ProductSearchBoxProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Products");
  const tHeader = useTranslations("Header");
  const { functional } = useConsent();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [storedRecent, setStoredRecent] = React.useState<string[]>([]);
  const recent = functional ? storedRecent : [];

  /**
   * Every response this session, keyed by locale + query. Held in state rather
   * than a ref so results can be derived during render — a response can then
   * never be shown against a query it does not answer.
   */
  const [cache, setCache] = React.useState<Record<string, SearchResponse>>({});

  // cmdk highlights its first item as soon as the list changes. That would make
  // Enter open a product when the user only meant to see all results, so the
  // highlight is suppressed until they actually move through the list.
  const [selected, setSelected] = React.useState("");
  // The ref is read synchronously from the keydown handler; the state drives the
  // styling that hides cmdk's phantom highlight until the list is really in use.
  const [hasNavigated, setHasNavigated] = React.useState(false);
  const navigatedRef = React.useRef(false);

  const markNavigated = React.useCallback(() => {
    navigatedRef.current = true;
    setHasNavigated(true);
  }, []);

  const abortRef = React.useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const cacheKey = trimmed ? `${locale}:${trimmed.toLowerCase()}` : "";

  // Backspacing to something typed earlier this session renders straight from
  // the cache, with no request and no spinner.
  const results = cacheKey ? cache[cacheKey] ?? null : null;
  const loading = !!trimmed && results === null;

  React.useEffect(() => {
    if (!cacheKey || results) return;

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const remember = (data: SearchResponse) => {
        if (controller.signal.aborted) return;
        setCache((previous) => ({
          // Drop the whole cache rather than tracking eviction order; a session
          // that types 60 distinct queries can afford to refetch.
          ...(Object.keys(previous).length >= CACHE_LIMIT ? {} : previous),
          [cacheKey]: data,
        }));
      };

      fetch(`/api/products/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? (response.json() as Promise<SearchResponse>) : EMPTY_RESULT))
        .then(remember)
        // An abort is the expected outcome of typing another character.
        .catch(() => remember(EMPTY_RESULT));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [cacheKey, results, trimmed, locale]);

  // Close when the click lands anywhere outside the box.
  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  /** Typing invalidates any highlight, so a bare Enter goes back to meaning "see all". */
  const handleQueryChange = React.useCallback((value: string) => {
    navigatedRef.current = false;
    setHasNavigated(false);
    setSelected("");
    setQuery(value);
  }, []);

  const rememberSearch = React.useCallback((term: string) => {
    if (!functional) return;
    const next = [
      term,
      ...readRecentSearches(functional).filter((item) => item !== term),
    ].slice(0, RECENT_LIMIT);
    setStoredRecent(next);
    writeRecentSearches(next, functional);
  }, [functional]);

  const closeAndLeave = React.useCallback(() => {
    setOpen(false);
    inputRef.current?.blur();
    onFocusChange?.(false);
    onNavigate?.();
  }, [onFocusChange, onNavigate]);

  const submitSearch = React.useCallback(
    (term: string) => {
      const value = term.trim();
      if (!value) return;
      rememberSearch(value);
      setQuery(value);
      closeAndLeave();
      router.push(`/products?q=${encodeURIComponent(value)}`);
    },
    [closeAndLeave, rememberSearch, router]
  );

  const goTo = React.useCallback(
    (href: string) => {
      closeAndLeave();
      router.push(href);
    },
    [closeAndLeave, router]
  );

  const clearRecent = React.useCallback(() => {
    setStoredRecent([]);
    writeRecentSearches([], functional);
    inputRef.current?.focus();
  }, [functional]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      markNavigated();
      if (!open) setOpen(true);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }

    if (event.key === "Enter") {
      // Only defer to cmdk once the user has actually picked a row; a bare Enter
      // always means "show me every result".
      if (navigatedRef.current && selected) return;
      event.preventDefault();
      event.stopPropagation();
      submitSearch(query);
    }
  };

  const showRecent = !trimmed && recent.length > 0;
  const hasResults =
    !!results && (results.products.length > 0 || results.categories.length > 0 || results.brands.length > 0);
  const showPanel = open && (showRecent || !!trimmed);
  const isMobile = variant === "mobile";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Command
        shouldFilter={false}
        loop
        value={selected}
        // Ignoring cmdk's own first-item selection is what keeps a bare Enter
        // pointed at the results page.
        onValueChange={(value) => {
          if (navigatedRef.current) setSelected(value);
        }}
        className="overflow-visible bg-transparent p-0"
      >
        <div className="relative">
          <CommandPrimitive.Input
            ref={inputRef}
            value={query}
            onValueChange={handleQueryChange}
            placeholder={tHeader("searchPlaceholder")}
            aria-label={tHeader("searchAriaLabel")}
            onFocus={() => {
              // Read on focus rather than on mount: localStorage is unavailable
              // during SSR, and reading it in an effect would flash an empty list.
              setStoredRecent(readRecentSearches(functional));
              setOpen(true);
              onFocusChange?.(true);
            }}
            onBlur={() => onFocusChange?.(false)}
            onKeyDown={handleKeyDown}
            className={cn(
              "bg-muted border border-border rounded-full pl-4 py-2 font-label-md xl:font-body-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300",
              query ? "pr-16" : "pr-10",
              inputClassName
            )}
          />
          {query && (
            <button
              type="button"
              // Keep focus in the input so the panel does not flash closed.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                handleQueryChange("");
                inputRef.current?.focus();
              }}
              aria-label={tHeader("searchClear")}
              className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#747684] hover:bg-[#ededf7] hover:text-primary transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Search
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none",
              isMobile ? "h-5 w-5" : "h-5 w-5 xl:h-6 xl:w-6"
            )}
            aria-hidden="true"
          />
        </div>

        {showPanel && (
          <div
            className={cn(
              "absolute z-50 mt-2 rounded-xl border border-[#c4e2f5] bg-white shadow-blue-lg overflow-hidden",
              isMobile ? "left-0 right-0 top-full" : "right-0 top-full w-[420px]"
            )}
          >
            <CommandList
              className={cn(
                "max-h-[60vh] md:max-h-[22rem] p-0",
                // cmdk highlights its first item on every list change. Until the
                // user drives the list, that highlight would wrongly suggest
                // Enter opens that row, so it is painted out.
                !hasNavigated && "[&_[data-slot=command-item][data-selected=true]]:bg-transparent"
              )}
              // Capture phase, so the flag is set before cmdk's own item
              // mousemove handler pushes a new selection through.
              onPointerMoveCapture={markNavigated}
            >
              {showRecent && (
                <CommandGroup
                  heading={
                    <span className="flex items-center justify-between gap-2">
                      <span>{t("searchRecent")}</span>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={clearRecent}
                        className="font-label-sm text-[#747684] hover:text-error transition-colors cursor-pointer"
                      >
                        {t("searchClearRecent")}
                      </button>
                    </span>
                  }
                >
                  {recent.map((term) => (
                    <CommandItem
                      key={term}
                      value={`recent-${term}`}
                      onSelect={() => submitSearch(term)}
                      className="cursor-pointer gap-2.5 py-2"
                    >
                      <Clock className="h-4 w-4 text-[#747684]" aria-hidden="true" />
                      <span className="truncate text-[#434653]">{term}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!!trimmed && loading && !hasResults && <SuggestionSkeletons label={t("searchLoading")} />}

              {!!trimmed && !loading && !hasResults && (
                <div className="px-4 py-10 text-center">
                  <Package className="mx-auto h-8 w-8 text-[#c4c6d5]" aria-hidden="true" />
                  <p className="mt-3 font-body-sm text-[#747684]">{t("searchEmpty")}</p>
                </div>
              )}

              {results && results.products.length > 0 && (
                <CommandGroup heading={t("searchGroupProducts")}>
                  {results.products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onSelect={() => goTo(`/products/${product.slug}`)}
                    />
                  ))}
                </CommandGroup>
              )}

              {results && results.categories.length > 0 && (
                <CommandGroup heading={t("searchGroupCategories")}>
                  {results.categories.map((category) => (
                    <TaxonomyRow
                      key={`category-${category.parentSlug ?? ""}-${category.slug}`}
                      item={category}
                      icon={<LayoutGrid className="h-4 w-4 text-primary" aria-hidden="true" />}
                      onSelect={() =>
                        goTo(
                          category.parentSlug
                            ? `/products?category=${category.parentSlug}&sub=${category.slug}`
                            : `/products?category=${category.slug}`
                        )
                      }
                    />
                  ))}
                </CommandGroup>
              )}

              {results && results.brands.length > 0 && (
                <CommandGroup heading={t("searchGroupBrands")}>
                  {results.brands.map((brand) => (
                    <TaxonomyRow
                      key={`brand-${brand.slug}`}
                      item={brand}
                      icon={<Tag className="h-4 w-4 text-primary" aria-hidden="true" />}
                      onSelect={() => goTo(`/products?brand=${brand.slug}`)}
                    />
                  ))}
                </CommandGroup>
              )}

            </CommandList>

            {/* Pinned below the scroll area rather than as a last list row: it is
                the primary action and what a bare Enter already does, so it must
                stay visible however long the suggestions run. */}
            {results && results.total > 0 && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submitSearch(query)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 border-t border-[#ededf7] bg-white px-3 py-3 font-label-md font-semibold text-primary transition-colors hover:bg-[#f3f3fc]"
              >
                <span className="truncate">{t("searchViewAll", { count: results.total })}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </Command>
    </div>
  );
}

function ProductRow({
  product,
  onSelect,
}: {
  product: SearchSuggestion;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={`product-${product.id}`}
      onSelect={onSelect}
      className="cursor-pointer gap-3 py-2"
    >
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[#e2e2eb]">
        {product.coverImage ? (
          <Image src={product.coverImage} alt="" fill className="object-cover" sizes="40px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Package className="h-4 w-4 text-[#747684]" aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-label-md font-semibold text-primary">{product.name}</span>
        <span className="block truncate font-label-sm text-[#747684]">
          {product.sku}
          {product.categoryName ? ` · ${product.categoryName}` : ""}
        </span>
      </span>
    </CommandItem>
  );
}

function TaxonomyRow({
  item,
  icon,
  onSelect,
}: {
  item: SearchGroupItem;
  icon: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={`${item.parentSlug ?? ""}-${item.slug}-${item.name}`}
      onSelect={onSelect}
      className="cursor-pointer gap-2.5 py-2"
    >
      {icon}
      <span className="truncate text-[#434653]">{item.name}</span>
    </CommandItem>
  );
}

function SuggestionSkeletons({ label }: { label: string }) {
  return (
    <div className="p-2" role="status" aria-label={label}>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
