import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

/**
 * Public origin used for canonical URLs, hreflang and structured data.
 * Override per deployment with NEXT_PUBLIC_SITE_URL.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.thana-glass.com"
).replace(/\/+$/, "");

export const SITE_NAME = "Thana Glass";

/** Logo used by structured data and social cards. */
export const SITE_LOGO = `${SITE_URL}/main-logo.png`;

/**
 * Mirrors the router's `as-needed` prefix strategy: the default locale (`th`)
 * has no prefix, every other locale does. Query strings are preserved.
 */
export function localePath(locale: string, path = "/") {
  const [rawPath, query] = path.split("?");
  const clean = rawPath.replace(/^\/+|\/+$/g, "");
  const base =
    locale === routing.defaultLocale
      ? clean
        ? `/${clean}`
        : "/"
      : clean
        ? `/${locale}/${clean}`
        : `/${locale}`;
  return query ? `${base}?${query}` : base;
}

/** Same as {@link localePath} but absolute — required inside JSON-LD. */
export function absoluteUrl(locale: string, path = "/") {
  return `${SITE_URL}${localePath(locale, path)}`;
}

/**
 * Canonical + hreflang for a page. Pass the *canonical* path: filtered listings
 * should hand in their clean URL so every filter permutation consolidates onto
 * one indexable address instead of competing with it.
 */
export function alternatesFor(locale: string, path = "/"): Metadata["alternates"] {
  return {
    canonical: localePath(locale, path),
    languages: {
      th: localePath("th", path),
      en: localePath("en", path),
      "x-default": localePath(routing.defaultLocale, path),
    },
  };
}

/** Branch entry as authored in `ContactPage.branches`. */
export interface BranchInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

/**
 * One organisation node plus a business node per branch, so search engines can
 * tie the physical locations back to a single company entity. Shared by the
 * homepage and the contact page — both describe the same entities, and repeating
 * the markup with stable `@id`s consolidates rather than duplicates them.
 */
export function organizationGraph(
  locale: string,
  branches: BranchInfo[],
  description: string
) {
  const locality = locale === "en" ? "Phuket" : "ภูเก็ต";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        legalName: branches[0]?.name,
        url: absoluteUrl(locale, "/"),
        logo: SITE_LOGO,
        description,
        email: branches[0]?.email,
        telephone: branches[0]?.phone.split(",")[0].trim(),
      },
      ...branches.map((branch, index) => ({
        "@type": "HomeAndConstructionBusiness",
        "@id": `${SITE_URL}/#branch-${index}`,
        name: branch.name,
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
        url: absoluteUrl(locale, "/contact"),
        image: SITE_LOGO,
        // The Thai catalogue prefixes addresses with the literal word "ที่อยู่"
        // for display; structured data wants the address alone.
        address: {
          "@type": "PostalAddress",
          streetAddress: branch.address.replace(/^ที่อยู่\s*/, ""),
          addressLocality: locality,
          addressRegion: locality,
          addressCountry: "TH",
        },
        telephone: branch.phone.split(",")[0].trim(),
        email: branch.email,
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "08:00",
          closes: "17:00",
        },
      })),
    ],
  };
}

interface Crumb {
  name: string;
  /** Locale-relative path; omit on the final crumb (the current page). */
  path?: string;
}

/** BreadcrumbList structured data, always rooted at the homepage. */
export function breadcrumbLd(locale: string, crumbs: Crumb[], homeLabel: string) {
  const items = [{ name: homeLabel, path: "/" }, ...crumbs];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      // The last item is the current page and carries no `item` per Google's
      // guidance; intermediate crumbs need absolute URLs.
      ...(crumb.path ? { item: absoluteUrl(locale, crumb.path) } : {}),
    })),
  };
}
