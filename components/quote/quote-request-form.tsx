"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, MessageSquareQuote, Package, Truck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CartEmptyState } from "@/components/cart/cart-empty-state";
import { useCart } from "@/components/cart/use-cart";
import { lineKey } from "@/lib/cart";
import { pick } from "@/lib/products";
import { PHUKET_CODE, PROVINCES } from "@/lib/provinces";
import { useNoResetSubmit } from "@/lib/use-no-reset-submit";
import { submitQuoteRequest, type QuoteFormResult } from "@/app/[locale]/quote/actions";
import { CheckField } from "./check-field";
import { PrivacyPolicyDialog } from "./privacy-policy-dialog";

const initialState: QuoteFormResult = { success: false, message: "" };
const CONTACT_STORAGE_KEY = "thana-quote-contact-v2";
const LEGACY_CONTACT_STORAGE_KEY = "thana-quote-contact-v1";

const EMPTY_CONTACT = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  lineId: "",
};

const EMPTY_COMPANY_INVOICE = {
  needTaxInvoice: false,
  companyName: "",
  taxId: "",
  addressLine: "",
  subDistrict: "",
  district: "",
  province: "",
  postalCode: "",
};

type ContactDetails = typeof EMPTY_CONTACT;
type ContactField = keyof ContactDetails;
type CompanyInvoiceDetails = typeof EMPTY_COMPANY_INVOICE;
type CompanyInvoiceField = Exclude<keyof CompanyInvoiceDetails, "needTaxInvoice">;
type RememberedDetails = ContactDetails & CompanyInvoiceDetails;

function emptyContact(): ContactDetails {
  return { ...EMPTY_CONTACT };
}

function emptyCompanyInvoice(): CompanyInvoiceDetails {
  return { ...EMPTY_COMPANY_INVOICE };
}

function emptyRememberedDetails(): RememberedDetails {
  return { ...EMPTY_CONTACT, ...EMPTY_COMPANY_INVOICE };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStorageValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseSavedDetails(raw: string | null, includesCompanyInvoice: boolean): RememberedDetails | null {
  try {
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    if (
      typeof parsed.firstName !== "string" ||
      typeof parsed.lastName !== "string" ||
      typeof parsed.phone !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.lineId !== "string"
    ) {
      return null;
    }

    if (!includesCompanyInvoice) {
      return {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        phone: parsed.phone,
        email: parsed.email,
        lineId: parsed.lineId,
        ...emptyCompanyInvoice(),
      };
    }

    if (
      typeof parsed.needTaxInvoice !== "boolean" ||
      typeof parsed.companyName !== "string" ||
      typeof parsed.taxId !== "string" ||
      typeof parsed.addressLine !== "string" ||
      typeof parsed.subDistrict !== "string" ||
      typeof parsed.district !== "string" ||
      typeof parsed.province !== "string" ||
      typeof parsed.postalCode !== "string"
    ) {
      return null;
    }

    return {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      phone: parsed.phone,
      email: parsed.email,
      lineId: parsed.lineId,
      needTaxInvoice: parsed.needTaxInvoice,
      companyName: parsed.companyName,
      taxId: parsed.taxId,
      addressLine: parsed.addressLine,
      subDistrict: parsed.subDistrict,
      district: parsed.district,
      province: parsed.province,
      postalCode: parsed.postalCode,
    };
  } catch {
    return null;
  }
}

function readSavedDetails(): RememberedDetails {
  const currentDetails = parseSavedDetails(readStorageValue(CONTACT_STORAGE_KEY), true);
  if (currentDetails) return currentDetails;

  const legacyContact = parseSavedDetails(readStorageValue(LEGACY_CONTACT_STORAGE_KEY), false);
  return legacyContact ?? emptyRememberedDetails();
}

function saveRememberedDetails(details: RememberedDetails): boolean {
  try {
    window.localStorage.setItem(
      CONTACT_STORAGE_KEY,
      JSON.stringify({
        firstName: details.firstName,
        lastName: details.lastName,
        phone: details.phone,
        email: details.email,
        lineId: details.lineId,
        needTaxInvoice: details.needTaxInvoice,
        companyName: details.companyName,
        taxId: details.taxId,
        addressLine: details.addressLine,
        subDistrict: details.subDistrict,
        district: details.district,
        province: details.province,
        postalCode: details.postalCode,
      }),
    );
    window.localStorage.removeItem(LEGACY_CONTACT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function deleteSavedDetails(): boolean {
  let deleted = true;

  for (const key of [CONTACT_STORAGE_KEY, LEGACY_CONTACT_STORAGE_KEY]) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      deleted = false;
    }
  }

  return deleted;
}

function hasSavedDetails(details: RememberedDetails): boolean {
  return Object.values(details).some((value) => value === true || (typeof value === "string" && value !== ""));
}

export function QuoteRequestForm() {
  const t = useTranslations("QuoteForm");
  const tCart = useTranslations("Cart");
  const locale = useLocale();
  const { items, count, hydrated, clear } = useCart();

  const [state, action, pending] = useActionState(submitQuoteRequest, initialState);

  const [consent, setConsent] = useState(false);
  const [contact, setContact] = useState<ContactDetails>(emptyContact);
  const [companyInvoice, setCompanyInvoice] = useState<CompanyInvoiceDetails>(emptyCompanyInvoice);
  const [rememberContact, setRememberContact] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [contactStorageStatus, setContactStorageStatus] = useState("");
  const submittedDetailsRef = useRef<RememberedDetails>(emptyRememberedDetails());
  const submittedRememberContactRef = useRef(false);

  // Without this the browser wipes every field whenever validation fails, and the
  // customer has to retype the whole form. See lib/use-no-reset-submit.ts.
  const submitWithoutReset = useNoResetSubmit(action);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    submittedDetailsRef.current = { ...contact, ...companyInvoice };
    submittedRememberContactRef.current = rememberContact;
    submitWithoutReset(event);
  };

  // localStorage is browser-only. Keeping the initial state empty makes the
  // server and first client render identical, then fills the controlled fields.
  useEffect(() => {
    const savedDetails = readSavedDetails();
    queueMicrotask(() => {
      setContact({
        firstName: savedDetails.firstName,
        lastName: savedDetails.lastName,
        phone: savedDetails.phone,
        email: savedDetails.email,
        lineId: savedDetails.lineId,
      });
      setCompanyInvoice({
        needTaxInvoice: savedDetails.needTaxInvoice,
        companyName: savedDetails.companyName,
        taxId: savedDetails.taxId,
        addressLine: savedDetails.addressLine,
        subDistrict: savedDetails.subDistrict,
        district: savedDetails.district,
        province: savedDetails.province,
        postalCode: savedDetails.postalCode,
      });
      setHasSavedData(hasSavedDetails(savedDetails));
      setRememberContact(hasSavedDetails(savedDetails));
    });
  }, []);

  // The request is recorded server side, so the browser copy has done its job.
  // `clear` is a module-level store function, so its identity never changes.
  useEffect(() => {
    if (!state.success) return;

    if (submittedRememberContactRef.current) {
      saveRememberedDetails(submittedDetailsRef.current);
    } else {
      deleteSavedDetails();
    }

    clear();
  }, [state.success, clear]);

  const updateContact = (field: ContactField, value: string) => {
    setContact((current) => ({ ...current, [field]: value }));
  };

  const updateCompanyInvoice = (field: CompanyInvoiceField, value: string) => {
    setCompanyInvoice((current) => ({ ...current, [field]: value }));
  };

  const handleDeleteSavedDetails = () => {
    const deleted = deleteSavedDetails();
    setRememberContact(false);
    setHasSavedData(false);
    setContactStorageStatus(t(deleted ? "savedContactDeleted" : "savedContactDeleteFailed"));
  };

  // Checked before the cart branches below: emptying the cart would otherwise
  // drop straight to the empty state and hide the reference code.
  if (state.success) return <SuccessPanel code={state.code} />;

  // The cart only exists in the browser, so the server renders nothing here.
  if (!hydrated) {
    return (
      <div className="space-y-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-[#f3f3fc]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[#c4e2f5] bg-white">
        <CartEmptyState />
      </div>
    );
  }

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  const showDeliveryNote =
    companyInvoice.needTaxInvoice &&
    companyInvoice.province !== "" &&
    companyInvoice.province !== PHUKET_CODE;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <input type="hidden" name="locale" value={locale} />
      {/* Identity only — the action re-reads every name and SKU from the database */}
      <input
        type="hidden"
        name="itemsJson"
        readOnly
        value={JSON.stringify(
          items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            qty: item.qty,
          })),
        )}
      />

      <div className="space-y-6 lg:col-span-2">
        <Section title={t("contactSection")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("firstName")} name="firstName" error={fieldError("firstName")} required>
              <Input
                id="firstName"
                name="firstName"
                value={contact.firstName}
                onChange={(event) => updateContact("firstName", event.target.value)}
                autoComplete="given-name"
              />
            </Field>
            <Field label={t("lastName")} name="lastName" error={fieldError("lastName")} required>
              <Input
                id="lastName"
                name="lastName"
                value={contact.lastName}
                onChange={(event) => updateContact("lastName", event.target.value)}
                autoComplete="family-name"
              />
            </Field>
          </div>
          <Field
            label={t("phone")}
            name="phone"
            error={fieldError("phone")}
            hint={t("phoneHint")}
            required
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              value={contact.phone}
              onChange={(event) => updateContact("phone", event.target.value)}
              autoComplete="tel"
            />
          </Field>

        </Section>

        <Section title={t("companySection")}>
          <CheckField
            name="needTaxInvoice"
            checked={companyInvoice.needTaxInvoice}
            onChange={(checked) =>
              setCompanyInvoice((current) => ({ ...current, needTaxInvoice: checked }))
            }
          >
            {t("needTaxInvoice")}
          </CheckField>

          {companyInvoice.needTaxInvoice && (
            <div className="space-y-4 border-t border-[#ededf7] pt-5">
              <Field
                label={t("companyName")}
                name="companyName"
                error={fieldError("companyName")}
                required
              >
                <Input
                  id="companyName"
                  name="companyName"
                  value={companyInvoice.companyName}
                  onChange={(event) => updateCompanyInvoice("companyName", event.target.value)}
                  autoComplete="organization"
                />
              </Field>
              <Field
                label={t("taxId")}
                name="taxId"
                error={fieldError("taxId")}
                hint={t("taxIdHint")}
                required
              >
                <Input
                  id="taxId"
                  name="taxId"
                  value={companyInvoice.taxId}
                  onChange={(event) => updateCompanyInvoice("taxId", event.target.value)}
                  inputMode="numeric"
                  maxLength={20}
                />
              </Field>
              <Field
                label={t("addressLine")}
                name="addressLine"
                error={fieldError("addressLine")}
                required
              >
                <Input
                  id="addressLine"
                  name="addressLine"
                  value={companyInvoice.addressLine}
                  onChange={(event) => updateCompanyInvoice("addressLine", event.target.value)}
                  autoComplete="street-address"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("subDistrict")}
                  name="subDistrict"
                  error={fieldError("subDistrict")}
                  required
                >
                  <Input
                    id="subDistrict"
                    name="subDistrict"
                    value={companyInvoice.subDistrict}
                    onChange={(event) => updateCompanyInvoice("subDistrict", event.target.value)}
                  />
                </Field>
                <Field label={t("district")} name="district" error={fieldError("district")} required>
                  <Input
                    id="district"
                    name="district"
                    value={companyInvoice.district}
                    onChange={(event) => updateCompanyInvoice("district", event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("province")}
                  name="province"
                  error={fieldError("province")}
                  required
                >
                  <Select
                    name="province"
                    value={companyInvoice.province}
                    onValueChange={(value) => updateCompanyInvoice("province", value)}
                  >
                    <SelectTrigger id="province" className="w-full">
                      <SelectValue placeholder={t("provincePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {PROVINCES.map((item) => (
                        <SelectItem key={item.code} value={item.code} className="font-body-sm">
                          {locale === "en" ? item.nameEn : item.nameTh}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label={t("postalCode")}
                  name="postalCode"
                  error={fieldError("postalCode")}
                  required
                >
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={companyInvoice.postalCode}
                    onChange={(event) => updateCompanyInvoice("postalCode", event.target.value)}
                    inputMode="numeric"
                    maxLength={10}
                  />
                </Field>
              </div>

              {showDeliveryNote && (
                <p
                  role="status"
                  className="flex items-start gap-2.5 rounded-md border border-[#c4e2f5] bg-[#f3f3fc] p-4 font-body-sm leading-relaxed text-[#434653]"
                >
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {t("deliveryNote")}
                </p>
              )}
            </div>
          )}
        </Section>

        <Section title={t("channelSection")} description={t("channelHint")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("email")} name="email" error={fieldError("email")}>
              <Input
                id="email"
                name="email"
                type="email"
                value={contact.email}
                onChange={(event) => updateContact("email", event.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label={t("lineId")} name="lineId" error={fieldError("lineId")}>
              <Input
                id="lineId"
                name="lineId"
                value={contact.lineId}
                onChange={(event) => updateContact("lineId", event.target.value)}
              />
            </Field>
          </div>
        </Section>

        <div className="space-y-3 border-t border-[#ededf7] pt-5">
          <CheckField name="rememberContact" checked={rememberContact} onChange={setRememberContact}>
            <span className="block">
              <span className="block font-label-md text-[#434653]">{t("rememberContact")}</span>
              <span className="mt-1 block font-label-sm leading-relaxed text-[#747684]">
                {t("rememberContactHint")}
              </span>
            </span>
          </CheckField>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-8">
            <button
              type="button"
              disabled={!hasSavedData}
              onClick={handleDeleteSavedDetails}
              className="rounded-md border border-[#c4e2f5] px-3 py-2 font-label-sm text-primary transition-colors hover:border-primary hover:bg-[#f3f3fc] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#c4e2f5] disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("deleteSavedContact")}
            </button>
            {contactStorageStatus && (
              <p role="status" aria-live="polite" className="font-label-sm text-[#434653]">
                {contactStorageStatus}
              </p>
            )}
          </div>
        </div>

        <Section title={t("consentSection")}>
          <CheckField name="consent" checked={consent} onChange={setConsent}>
            {t("consentBefore")} <PrivacyPolicyDialog label={t("consentPolicyLink")} />
          </CheckField>
          {fieldError("consent") && (
            <p className="font-label-sm text-[#ba1a1a]">{fieldError("consent")}</p>
          )}
        </Section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="space-y-4 rounded-lg border border-[#c4e2f5] bg-[#f3f3fc] p-6">
          <h2 className="font-headline-sm font-semibold text-on-surface">{t("summaryTitle")}</h2>

          <div className="border-b border-[#c4e2f5] pb-3">
            <span className="font-body-sm text-[#434653]">{tCart("itemCount", { count })}</span>
          </div>

          <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={lineKey(item)} className="flex gap-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#c4e2f5] bg-white">
                  {item.image ? (
                    <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Package className="h-4 w-4 text-[#747684]" aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-label-sm font-semibold text-on-surface">
                    {pick(item, "name", locale)}
                  </span>
                  <span className="block font-label-sm text-[#747684]">× {item.qty}</span>
                </span>
              </li>
            ))}
          </ul>

          {state.message && !state.success && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-error-container px-3 py-2 font-body-sm text-on-error-container"
            >
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-b from-[#078ee4] to-primary-container px-6 py-3 font-label-md font-semibold text-white shadow-blue-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
          >
            <MessageSquareQuote className="h-4 w-4" aria-hidden="true" />
            {pending ? t("submitting") : t("submit")}
          </button>

          <Link
            href="/cart"
            className="inline-flex w-full items-center justify-center gap-2 font-label-md font-medium text-primary transition-colors hover:text-secondary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("editCart")}
          </Link>
        </div>
      </aside>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-lg border border-[#c4e2f5] bg-white p-6">
      <div className="space-y-1">
        <h2 className="font-headline-sm font-semibold text-on-surface">{title}</h2>
        {description && <p className="font-body-sm text-[#747684]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="font-label-md text-[#434653]">
        {label}
        {required && (
          <span className="text-[#ba1a1a]" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p className="font-label-sm text-[#ba1a1a]">{error}</p>
      ) : hint ? (
        <p className="font-label-sm text-[#747684]">{hint}</p>
      ) : null}
    </div>
  );
}

function SuccessPanel({ code }: { code?: string }) {
  const t = useTranslations("QuoteForm");

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-[#c4e2f5] bg-white p-8 text-center sm:p-12">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f3fc]">
        <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden="true" />
      </span>

      <h2 className="mt-6 font-headline-md font-semibold text-on-surface">{t("successTitle")}</h2>
      <p className="mt-3 font-body-sm leading-relaxed text-[#434653]">{t("successBody")}</p>

      {code && (
        <div className="mt-6 rounded-md border border-[#c4e2f5] bg-[#f3f3fc] px-5 py-4">
          <p className="font-label-sm text-[#747684]">{t("successCodeLabel")}</p>
          <p className="mt-1 font-headline-sm font-bold tracking-wide text-primary">{code}</p>
          <p className="mt-2 font-label-sm text-[#747684]">{t("successHint")}</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-md bg-linear-to-b from-[#078ee4] to-primary-container px-6 py-3 font-label-md font-semibold text-white shadow-blue-sm transition-all hover:brightness-110"
        >
          {t("backToProducts")}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-primary px-6 py-3 font-label-md font-semibold text-primary transition-all hover:bg-[#f3f3fc]"
        >
          {t("backToHome")}
        </Link>
      </div>
    </div>
  );
}
