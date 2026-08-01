"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { MAX_QTY } from "@/lib/cart";
import { isProvinceCode } from "@/lib/provinces";

/**
 * The public quotation request. This is the only server action on the customer
 * side of the site, so it deliberately shares nothing with `lib/admin/*` — the
 * result type below is local rather than the admin `ActionResult`.
 */
export type QuoteFormResult = {
  success: boolean;
  /** Empty on the initial state; a translated sentence once the action has run. */
  message: string;
  /** Reference code shown on the success panel, e.g. QT-20260801-0042. */
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

/** How many requests one IP may send per hour before we start rejecting. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Only the identity of a line is trusted. Names, SKUs and images are re-read from
 * the database in `resolveItems` — the cart lives in localStorage, so everything
 * in this payload is user-writable (same reasoning as `parseItem` in lib/cart.ts).
 */
const itemsSchema = z
  .array(
    z.object({
      productId: z.number().int().positive(),
      variantId: z.number().int().positive().nullable(),
      qty: z.number().int().min(1).max(MAX_QTY),
    }),
  )
  .min(1)
  .max(100);

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Trims and collapses an optional text field to null when it is blank. */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value));

export async function submitQuoteRequest(
  _state: QuoteFormResult,
  formData: FormData,
): Promise<QuoteFormResult> {
  const rawLocale = String(formData.get("locale") ?? "th");
  const locale = rawLocale === "en" ? "en" : "th";
  const t = await getTranslations({ locale, namespace: "QuoteForm" });

  const needTaxInvoice = formData.get("needTaxInvoice") === "on";

  // Built per request because every message is translated at this point.
  const schema = z
    .object({
      firstName: z.string().trim().min(1, t("errorRequired")).max(120),
      lastName: z.string().trim().min(1, t("errorRequired")).max(120),
      phone: z
        .string()
        .trim()
        .min(1, t("errorRequired"))
        .refine((value) => {
          const digits = digitsOnly(value);
          return digits.length >= 9 && digits.length <= 10;
        }, t("errorPhone")),
      email: optionalText.refine(
        (value) => value === null || z.email().safeParse(value).success,
        t("errorEmail"),
      ),
      lineId: optionalText,
      companyName: optionalText,
      taxId: optionalText,
      addressLine: optionalText,
      subDistrict: optionalText,
      district: optionalText,
      province: optionalText,
      postalCode: optionalText,
      consent: z.literal("on", { message: t("errorConsent") }),
    })
    // At least one way to send the quotation back. Reported on `email` because
    // that is the first of the two fields on screen.
    .refine((data) => data.email !== null || data.lineId !== null, {
      path: ["email"],
      message: t("errorChannel"),
    })
    .superRefine((data, ctx) => {
      if (!needTaxInvoice) return;

      const required = [
        ["companyName", data.companyName],
        ["addressLine", data.addressLine],
        ["subDistrict", data.subDistrict],
        ["district", data.district],
        ["postalCode", data.postalCode],
      ] as const;
      for (const [field, value] of required) {
        if (value === null) {
          ctx.addIssue({ code: "custom", path: [field], message: t("errorRequired") });
        }
      }

      if (data.taxId === null || digitsOnly(data.taxId).length !== 13) {
        ctx.addIssue({ code: "custom", path: ["taxId"], message: t("errorTaxId") });
      }
      if (data.postalCode !== null && digitsOnly(data.postalCode).length !== 5) {
        ctx.addIssue({ code: "custom", path: ["postalCode"], message: t("errorPostalCode") });
      }
      if (data.province === null || !isProvinceCode(data.province)) {
        ctx.addIssue({ code: "custom", path: ["province"], message: t("errorProvince") });
      }
    });

  const parsed = schema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    lineId: formData.get("lineId") ?? "",
    companyName: formData.get("companyName") ?? "",
    taxId: formData.get("taxId") ?? "",
    addressLine: formData.get("addressLine") ?? "",
    subDistrict: formData.get("subDistrict") ?? "",
    district: formData.get("district") ?? "",
    province: formData.get("province") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    consent: formData.get("consent") ?? "",
  });

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    return {
      success: false,
      message: t("errorCheckFields"),
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    };
  }
  const d = parsed.data;

  const itemsResult = z
    .string()
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: t("errorItems") });
        return z.NEVER;
      }
    })
    .pipe(itemsSchema)
    .safeParse(formData.get("itemsJson") ?? "");

  if (!itemsResult.success) {
    return { success: false, message: t("errorEmptyCart") };
  }

  const prisma = getPrisma();

  const headerStore = await headers();
  const ipAddress = (
    headerStore.get("x-forwarded-for")?.split(",")[0] ||
    headerStore.get("x-real-ip") ||
    "unknown"
  )
    .trim()
    .slice(0, 64);
  const userAgent = headerStore.get("user-agent")?.slice(0, 255) ?? null;

  // Cheap spam guard. No extra table needed — the requests themselves are the log.
  if (ipAddress !== "unknown") {
    const recent = await prisma.quotationRequest.count({
      where: { ipAddress, createdAt: { gte: new Date(Date.now() - RATE_WINDOW_MS) } },
    });
    if (recent >= RATE_LIMIT) {
      return { success: false, message: t("errorTooMany") };
    }
  }

  const items = await resolveItems(itemsResult.data);
  if (items.length === 0) {
    return { success: false, message: t("errorUnavailable") };
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const request = await tx.quotationRequest.create({
        data: {
          // Replaced immediately below; the real code needs the generated id.
          code: "",
          firstName: d.firstName,
          lastName: d.lastName,
          phone: d.phone,
          email: d.email,
          lineId: d.lineId,
          needTaxInvoice,
          companyName: needTaxInvoice ? d.companyName : null,
          taxId: needTaxInvoice && d.taxId ? digitsOnly(d.taxId) : null,
          addressLine: needTaxInvoice ? d.addressLine : null,
          subDistrict: needTaxInvoice ? d.subDistrict : null,
          district: needTaxInvoice ? d.district : null,
          province: needTaxInvoice ? d.province : null,
          postalCode: needTaxInvoice && d.postalCode ? digitsOnly(d.postalCode) : null,
          consentAt: new Date(),
          locale,
          ipAddress,
          userAgent,
          items: { create: items },
        },
      });

      return tx.quotationRequest.update({
        where: { id: request.id },
        data: { code: buildCode(request.id, request.createdAt) },
        select: { code: true },
      });
    });

    revalidatePath("/admin/quotations");
    return { success: true, message: t("successTitle"), code: created.code };
  } catch (error) {
    console.error("Quotation request failed:", error);
    return { success: false, message: t("errorGeneric") };
  }
}

/** e.g. QT-20260801-0042 — date for scanning, id for uniqueness. */
function buildCode(id: number, createdAt: Date): string {
  const stamp = [
    createdAt.getFullYear(),
    String(createdAt.getMonth() + 1).padStart(2, "0"),
    String(createdAt.getDate()).padStart(2, "0"),
  ].join("");
  return `QT-${stamp}-${String(id).padStart(4, "0")}`;
}

type ResolvedItem = {
  productId: number;
  variantId: number | null;
  productNameTh: string;
  productNameEn: string;
  slug: string;
  sku: string | null;
  optionsTh: string | null;
  optionsEn: string | null;
  qty: number;
  sortOrder: number;
};

/**
 * Turns the submitted identities into rows built entirely from database values.
 * Lines whose product is gone or unpublished are dropped rather than failing the
 * whole request — a catalog change between adding to the cart and submitting is
 * the customer's problem to hear about, not a reason to lose the other lines.
 */
async function resolveItems(
  input: { productId: number; variantId: number | null; qty: number }[],
): Promise<ResolvedItem[]> {
  const prisma = getPrisma();
  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(input.map((line) => line.productId))] }, published: true },
    select: {
      id: true,
      slug: true,
      sku: true,
      nameTh: true,
      nameEn: true,
      variants: {
        select: {
          id: true,
          sku: true,
          attributeValues: {
            select: {
              attributeValue: {
                select: {
                  valueTh: true,
                  valueEn: true,
                  attribute: { select: { nameTh: true, nameEn: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));
  const resolved: ResolvedItem[] = [];

  for (const [index, line] of input.entries()) {
    const product = byId.get(line.productId);
    if (!product) continue;

    const variant =
      line.variantId === null
        ? null
        : product.variants.find((candidate) => candidate.id === line.variantId);
    // A variant id that no longer belongs to this product is a stale cart line.
    if (line.variantId !== null && !variant) continue;

    const options = variant?.attributeValues ?? [];
    resolved.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      productNameTh: product.nameTh,
      productNameEn: product.nameEn,
      slug: product.slug,
      sku: variant?.sku ?? product.sku,
      optionsTh: formatOptions(options, "th"),
      optionsEn: formatOptions(options, "en"),
      qty: line.qty,
      sortOrder: index,
    });
  }

  return resolved;
}

type VariantOptionRow = {
  attributeValue: {
    valueTh: string;
    valueEn: string;
    attribute: { nameTh: string; nameEn: string };
  };
};

/** "ความหนา: 6 มม. · สี: ใส" — one readable line, so admin needs no extra joins. */
function formatOptions(options: VariantOptionRow[], locale: "th" | "en"): string | null {
  if (options.length === 0) return null;
  const parts = options.map(({ attributeValue }) =>
    locale === "en"
      ? `${attributeValue.attribute.nameEn}: ${attributeValue.valueEn}`
      : `${attributeValue.attribute.nameTh}: ${attributeValue.valueTh}`,
  );
  return parts.join(" · ").slice(0, 500);
}
