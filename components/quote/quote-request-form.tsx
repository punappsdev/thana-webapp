"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  MessageSquareQuote,
  Package,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CartEmptyState } from "@/components/cart/cart-empty-state";
import { useCart } from "@/components/cart/use-cart";
import { DistrictCombobox } from "./district-combobox";
import { SubdistrictCombobox } from "./subdistrict-combobox";
import { QUOTE_BRANCH_MAP_URLS, type BranchCode } from "@/lib/branches";
import {
  CONTACT_STORAGE_KEY,
  CONTACT_STORAGE_KEYS,
  OBSOLETE_CONTACT_STORAGE_KEYS,
  emptyCompanyInvoice,
  emptyContact,
  emptyDelivery,
  emptyRememberedDetails,
  hasSavedDetails,
  parseSavedDetails,
  serializeRememberedDetails,
  type CompanyInvoiceDetails,
  type CompanyInvoiceField,
  type ContactDetails,
  type ContactField,
  type DeliveryDetails,
  type DeliveryField,
  type FulfillmentMethod,
  type RememberedDetails,
} from "@/lib/quote-remembered-details";
import { lineKey } from "@/lib/cart";
import { findDistrict, getDistrictsForProvince } from "@/lib/districts";
import { pick } from "@/lib/products";
import { PHUKET_CODE, SOUTHERN_PROVINCES } from "@/lib/provinces";
import { getSubdistrictsForDistrict } from "@/lib/subdistricts";
import { useNoResetSubmit } from "@/lib/use-no-reset-submit";
import { submitQuoteRequest, type QuoteFormResult } from "@/app/[locale]/quote/actions";
import { LegalDialog } from "@/components/legal/legal-dialog";
import { CheckField } from "./check-field";

const initialState: QuoteFormResult = { success: false, message: "" };
const MAX_BOQ_FILE_SIZE = 10 * 1024 * 1024;
const BOQ_FILE_ACCEPT =
  ".pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function readStorageValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readSavedDetails(): RememberedDetails {
  for (const key of CONTACT_STORAGE_KEYS) {
    const details = parseSavedDetails(readStorageValue(key), key);
    if (details) return details;
  }

  return emptyRememberedDetails();
}

function saveRememberedDetails(details: RememberedDetails): boolean {
  try {
    window.localStorage.setItem(
      CONTACT_STORAGE_KEY,
      serializeRememberedDetails(details),
    );
  } catch {
    return false;
  }

  let obsoleteKeysRemoved = true;
  for (const key of OBSOLETE_CONTACT_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      obsoleteKeysRemoved = false;
    }
  }

  return obsoleteKeysRemoved;
}

function deleteSavedDetails(): boolean {
  let deleted = true;

  for (const key of CONTACT_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      deleted = false;
    }
  }

  return deleted;
}

// Mirrors the magic-byte detection the server does in lib/quotation-boq.ts, so
// the browser never rejects a file the server would have accepted. XLSX is a
// zip, so this is deliberately looser than the server: anything that slips
// through is rejected server-side and reported through fieldErrors.boqFile.
async function hasBoqFileSignature(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const matches = (signature: number[]) => signature.every((byte, i) => header[i] === byte);
  return matches([0x25, 0x50, 0x44, 0x46]) || matches([0x50, 0x4b, 0x03, 0x04]);
}

function localizedDistrictValue(value: string, provinceCode: string, locale: "th" | "en"): string {
  if (!value) return "";

  const district = getDistrictsForProvince(provinceCode).find(
    (item) => item.code === value || item.nameTh === value || item.nameEn === value,
  );

  if (!district) return value;
  return locale === "en" ? district.nameEn : district.nameTh;
}

function localizedSubdistrictValue(
  value: string,
  districtCode: string,
  locale: "th" | "en",
): string {
  if (!value || !districtCode) return value;

  const subdistrict = getSubdistrictsForDistrict(districtCode).find(
    (item) => item.code === value || item.nameTh === value || item.nameEn === value,
  );

  if (!subdistrict) return value;
  return locale === "en" ? subdistrict.nameEn : subdistrict.nameTh;
}

export function QuoteRequestForm() {
  const t = useTranslations("QuoteForm");
  const tCart = useTranslations("Cart");
  const locale = useLocale();
  const { items, count, hydrated, clear } = useCart();

  const [state, action, pending] = useActionState(submitQuoteRequest, initialState);

  const [consent, setConsent] = useState(false);
  const [contact, setContact] = useState<ContactDetails>(emptyContact);
  const [contactBranch, setContactBranch] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod | "">("");
  const [fulfillmentMethodError, setFulfillmentMethodError] = useState<string>();
  const [companyInvoice, setCompanyInvoice] = useState<CompanyInvoiceDetails>(emptyCompanyInvoice);
  const [delivery, setDelivery] = useState<DeliveryDetails>(emptyDelivery);
  const [useSameDeliveryAddress, setUseSameDeliveryAddress] = useState(false);
  const [rememberContact, setRememberContact] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [contactStorageStatus, setContactStorageStatus] = useState("");
  const [boqFile, setBoqFile] = useState<File | null>(null);
  const [boqClientError, setBoqClientError] = useState<string>();
  const boqFileInputRef = useRef<HTMLInputElement>(null);
  // Signature reading is async, so a stale check must not overwrite a newer pick.
  const boqCheckIdRef = useRef(0);
  const submittedDetailsRef = useRef<RememberedDetails>(emptyRememberedDetails());
  const submittedRememberContactRef = useRef(false);

  // Without this the browser wipes every field whenever validation fails, and the
  // customer has to retype the whole form. See lib/use-no-reset-submit.ts.
  const submitWithoutReset = useNoResetSubmit(action);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // A BOQ error never blocks submitting: the attachment is optional and the
    // file input was already cleared, so the request just goes out without one.
    if (!fulfillmentMethod) {
      event.preventDefault();
      setFulfillmentMethodError(t("errorFulfillmentMethod"));
      document.getElementById("fulfillment-delivery")?.focus();
      return;
    }

    submittedDetailsRef.current = {
      ...contact,
      ...companyInvoice,
      ...delivery,
      fulfillmentMethod,
      contactBranch,
    };
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
      const uiLocale = locale === "en" ? "en" : "th";
      const companyDistrict = localizedDistrictValue(
        savedDetails.district,
        savedDetails.province,
        uiLocale,
      );
      setCompanyInvoice({
        needTaxInvoice: savedDetails.needTaxInvoice,
        companyName: savedDetails.companyName,
        taxId: savedDetails.taxId,
        addressLine: savedDetails.addressLine,
        subDistrict: localizedSubdistrictValue(
          savedDetails.subDistrict,
          findDistrict(savedDetails.province, companyDistrict)?.code ?? "",
          uiLocale,
        ),
        district: companyDistrict,
        province: savedDetails.province,
        postalCode: savedDetails.postalCode,
      });
      const deliveryDistrict = localizedDistrictValue(
        savedDetails.deliveryDistrict,
        savedDetails.deliveryProvince,
        uiLocale,
      );
      setDelivery({
        deliveryAddressLine: savedDetails.deliveryAddressLine,
        deliverySubDistrict: localizedSubdistrictValue(
          savedDetails.deliverySubDistrict,
          findDistrict(savedDetails.deliveryProvince, deliveryDistrict)?.code ?? "",
          uiLocale,
        ),
        deliveryDistrict,
        deliveryProvince: savedDetails.deliveryProvince,
        deliveryPostalCode: savedDetails.deliveryPostalCode,
      });
      setFulfillmentMethod(savedDetails.fulfillmentMethod);
      setContactBranch(savedDetails.contactBranch);
      setHasSavedData(hasSavedDetails(savedDetails));
      setRememberContact(hasSavedDetails(savedDetails));
    });
  }, [locale]);

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

  const updateDelivery = (field: DeliveryField, value: string) => {
    setDelivery((current) => ({ ...current, [field]: value }));
  };

  const handleDeliveryProvinceChange = (value: string) => {
    setDelivery((current) => ({
      ...current,
      deliveryProvince: value,
      deliveryDistrict: "",
      deliverySubDistrict: "",
    }));
  };

  const handleDeliveryDistrictChange = (value: string) => {
    setDelivery((current) => ({
      ...current,
      deliveryDistrict: value,
      deliverySubDistrict: "",
    }));
  };

  const handleCompanyProvinceChange = (value: string) => {
    setCompanyInvoice((current) => ({
      ...current,
      province: value,
      district: "",
      subDistrict: "",
    }));
  };

  const handleCompanyDistrictChange = (value: string) => {
    setCompanyInvoice((current) => ({
      ...current,
      district: value,
      subDistrict: "",
    }));
  };

  const handleFulfillmentMethodChange = (value: string) => {
    if (value !== "delivery" && value !== "pickup") return;

    setFulfillmentMethod(value);
    setFulfillmentMethodError(undefined);
    if (value === "pickup") setUseSameDeliveryAddress(false);
  };

  const handleTaxInvoiceToggle = (checked: boolean) => {
    setCompanyInvoice((current) => ({ ...current, needTaxInvoice: checked }));
    if (!checked) setUseSameDeliveryAddress(false);
  };

  const handleSameDeliveryAddressToggle = (checked: boolean) => {
    setUseSameDeliveryAddress(checked);
    if (!checked) return;

    setCompanyInvoice((current) => ({
      ...current,
      addressLine: delivery.deliveryAddressLine,
      subDistrict: delivery.deliverySubDistrict,
      district: delivery.deliveryDistrict,
      province: delivery.deliveryProvince,
      postalCode: delivery.deliveryPostalCode,
    }));
  };

  const handleDeleteSavedDetails = () => {
    const deleted = deleteSavedDetails();
    setRememberContact(false);
    setHasSavedData(false);
    setContactStorageStatus(t(deleted ? "savedContactDeleted" : "savedContactDeleteFailed"));
  };

  const handleBoqFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // React clears currentTarget once the handler returns, so keep the node.
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    const checkId = ++boqCheckIdRef.current;
    setBoqClientError(undefined);

    if (!file) {
      setBoqFile(null);
      return;
    }

    const reject = (message: string) => {
      setBoqFile(null);
      setBoqClientError(message);
      input.value = "";
    };

    if (file.size > MAX_BOQ_FILE_SIZE) {
      reject(t("errorBoqFileTooLarge"));
      return;
    }

    if (file.size === 0) {
      reject(t("errorBoqFileEmpty"));
      return;
    }

    let hasSignature: boolean;
    try {
      hasSignature = await hasBoqFileSignature(file);
    } catch {
      if (checkId !== boqCheckIdRef.current) return;
      reject(t("errorBoqFileUnreadable"));
      return;
    }

    if (checkId !== boqCheckIdRef.current) return;

    if (!hasSignature) {
      reject(t("errorBoqFileType"));
      return;
    }

    setBoqFile(file);
  };

  const handleBoqFileRemove = () => {
    boqCheckIdRef.current += 1;
    setBoqFile(null);
    setBoqClientError(undefined);
    if (boqFileInputRef.current) boqFileInputRef.current.value = "";
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
  const fulfillmentError = fieldError("fulfillmentMethod") ?? fulfillmentMethodError;
  const boqError = fieldError("boqFile") ?? boqClientError;
  const boqDescribedBy = [
    "boqFile-hint",
    boqFile ? "boqFile-selected" : null,
    boqError ? "boqFile-error" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const showDeliveryNote =
    fulfillmentMethod === "delivery" &&
    delivery.deliveryProvince !== "" &&
    delivery.deliveryProvince !== PHUKET_CODE;

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="grid grid-cols-1 gap-8 lg:grid-cols-3"
    >
      <input type="hidden" name="locale" value={locale} />
      {/* Identity only — the action re-reads every name and SKU from the database.
          customValues is the one exception: nothing in the catalog can produce a
          number the customer typed, so the action re-validates it against the
          ProductCustomField it belongs to instead. */}
      <input
        type="hidden"
        name="itemsJson"
        readOnly
        value={JSON.stringify(
          items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            qty: item.qty,
            customValues: item.customValues ?? [],
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
              inputMode="numeric"
              maxLength={10}
              value={contact.phone}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 10);
                updateContact("phone", digits);
              }}
              autoComplete="tel"
            />
          </Field>
        </Section>

        <Section title={t("boqSection")} description={t("boqDescription")}>
          <div className="space-y-3 rounded-lg border border-dashed border-[#c4e2f5] bg-[#f3f3fc]/60 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 sm:shrink-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#dbe1ff] text-primary">
                  <FileSpreadsheet className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="boqFile" className="font-label-md text-[#434653]">
                    {t("boqLabel")} <span className="font-label-sm font-normal text-[#747684]">({t("optional")})</span>
                  </Label>
                  <p id="boqFile-hint" className="font-label-sm leading-relaxed text-[#747684]">
                    {t("boqHint")}
                  </p>
                </div>
              </div>

              <Input
                ref={boqFileInputRef}
                id="boqFile"
                name="boqFile"
                type="file"
                accept={BOQ_FILE_ACCEPT}
                onChange={handleBoqFileChange}
                aria-describedby={boqDescribedBy}
                aria-invalid={Boolean(boqError)}
                className="h-auto min-h-10 cursor-pointer px-3 py-2 file:mr-3 file:rounded-md file:bg-[#dbe1ff] file:px-3 file:py-1 file:font-label-sm file:font-medium file:text-primary w-full sm:max-w-sm"
              />
            </div>

            {boqFile && (
              <div
                id="boqFile-selected"
                role="status"
                aria-live="polite"
                className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-[#c4e2f5] bg-white px-3 py-2.5"
              >
                <p className="min-w-0 break-all font-body-sm text-[#434653]">
                  <span className="font-label-sm font-semibold text-primary">{t("boqSelectedFile")}</span>{" "}
                  {boqFile.name}
                </p>
                <button
                  type="button"
                  onClick={handleBoqFileRemove}
                  aria-label={t("boqRemoveFile")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-label-sm font-medium text-primary transition-colors hover:bg-[#dbe1ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <X className="size-4" aria-hidden="true" />
                  <span>{t("boqRemoveFile")}</span>
                </button>
              </div>
            )}

            {boqError && (
              <p id="boqFile-error" role="alert" className="font-label-sm text-[#ba1a1a]">
                {boqError}
              </p>
            )}
          </div>
        </Section>

        <Section title={t("deliverySection")} description={t("deliveryHint")}>
          <fieldset className="space-y-3">
            <legend id="fulfillment-method-label" className="sr-only">
              {t("fulfillmentMethodLabel")} <span className="text-[#ba1a1a]" aria-hidden="true">*</span>
            </legend>
            <p id="fulfillment-method-hint" className="sr-only">
              {t("fulfillmentMethodHint")}
            </p>
            <RadioGroup
              id="fulfillmentMethod"
              name="fulfillmentMethod"
              value={fulfillmentMethod}
              onValueChange={handleFulfillmentMethodChange}
              required
              aria-labelledby="fulfillment-method-label"
              aria-describedby={
                fulfillmentError
                  ? "fulfillment-method-hint fulfillment-method-error"
                  : "fulfillment-method-hint"
              }
              aria-invalid={Boolean(fulfillmentError)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <FulfillmentOption
                id="fulfillment-delivery"
                value="delivery"
                label={t("fulfillmentDelivery")}
                description={t("fulfillmentDeliveryHint")}
                icon={Truck}
              />
              <FulfillmentOption
                id="fulfillment-pickup"
                value="pickup"
                label={t("fulfillmentPickup")}
                description={t("fulfillmentPickupHint")}
                icon={Building2}
              />
            </RadioGroup>
            {fulfillmentError && (
              <p id="fulfillment-method-error" role="alert" className="font-label-sm text-[#ba1a1a]">
                {fulfillmentError}
              </p>
            )}
          </fieldset>

          {fulfillmentMethod === "delivery" && (
            <div className="space-y-4 border-t border-[#ededf7] pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("deliveryProvince")}
                  name="deliveryProvince"
                  error={fieldError("deliveryProvince")}
                  required
                >
                  <Select
                    name="deliveryProvince"
                    value={delivery.deliveryProvince}
                    onValueChange={handleDeliveryProvinceChange}
                  >
                    <SelectTrigger id="deliveryProvince" className="w-full">
                      <SelectValue placeholder={t("deliveryProvincePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {SOUTHERN_PROVINCES.map((item) => (
                        <SelectItem key={item.code} value={item.code} className="font-body-sm">
                          {locale === "en" ? item.nameEn : item.nameTh}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label={t("deliveryDistrict")}
                  name="deliveryDistrict"
                  error={fieldError("deliveryDistrict")}
                  required
                >
                  <DistrictCombobox
                    id="deliveryDistrict"
                    name="deliveryDistrict"
                    label={t("deliveryDistrict")}
                    provinceCode={delivery.deliveryProvince}
                    value={delivery.deliveryDistrict}
                    locale={locale === "en" ? "en" : "th"}
                    placeholder={t("districtPlaceholder")}
                    chooseProvinceText={t("districtChooseProvince")}
                    describedBy={fieldError("deliveryDistrict") ? "deliveryDistrict-error" : undefined}
                    invalid={Boolean(fieldError("deliveryDistrict"))}
                    onValueChange={handleDeliveryDistrictChange}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("deliverySubDistrict")}
                  name="deliverySubDistrict"
                  error={fieldError("deliverySubDistrict")}
                  required
                >
                  <SubdistrictCombobox
                    id="deliverySubDistrict"
                    name="deliverySubDistrict"
                    label={t("deliverySubDistrict")}
                    provinceCode={delivery.deliveryProvince}
                    districtValue={delivery.deliveryDistrict}
                    value={delivery.deliverySubDistrict}
                    locale={locale === "en" ? "en" : "th"}
                    placeholder={t("subDistrictPlaceholder")}
                    chooseDistrictText={t("subDistrictChooseDistrict")}
                    describedBy={fieldError("deliverySubDistrict") ? "deliverySubDistrict-error" : undefined}
                    invalid={Boolean(fieldError("deliverySubDistrict"))}
                    onValueChange={(value) => updateDelivery("deliverySubDistrict", value)}
                  />
                </Field>
                <Field
                  label={t("deliveryPostalCode")}
                  name="deliveryPostalCode"
                  error={fieldError("deliveryPostalCode")}
                  required
                >
                  <Input
                    id="deliveryPostalCode"
                    name="deliveryPostalCode"
                    value={delivery.deliveryPostalCode}
                    onChange={(event) => updateDelivery("deliveryPostalCode", event.target.value)}
                    inputMode="numeric"
                    maxLength={10}
                  />
                </Field>
              </div>

              <Field
                label={t("deliveryAddressLine")}
                name="deliveryAddressLine"
                error={fieldError("deliveryAddressLine")}
                required
              >
                <Input
                  id="deliveryAddressLine"
                  name="deliveryAddressLine"
                  value={delivery.deliveryAddressLine}
                  onChange={(event) => updateDelivery("deliveryAddressLine", event.target.value)}
                  autoComplete="street-address"
                />
              </Field>

              {showDeliveryNote && (
                <div
                  role="status"
                  className="flex items-center gap-3.5 rounded-xl border border-[#d0e1fd] bg-linear-to-r from-[#eff6ff] via-[#f0f4ff] to-[#f8fafc] p-4.5 sm:p-5 shadow-blue-sm transition-all hover:shadow-blue-md"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-[#0040ad] text-white shadow-blue-sm">
                    <Truck className="size-4.5" aria-hidden="true" />
                  </span>
                  <p className="min-w-0 flex-1 font-body-sm leading-relaxed text-[#434653]">
                    {t("deliveryNote")}
                  </p>
                </div>
              )}
            </div>
          )}

          {fulfillmentMethod === "pickup" && (
            <div className="space-y-4 border-t border-[#ededf7] pt-5">
              <fieldset className="space-y-3">
                <legend id="pickup-branch-label" className="font-label-lg text-[#434653]">
                  {t("pickupBranchLabel")} <span className="text-[#ba1a1a]" aria-hidden="true">*</span>
                </legend>
                <p id="pickup-branch-hint" className="font-body-sm text-[#747684]">
                  {t("pickupBranchHint")}
                </p>
                <RadioGroup
                  id="contactBranch"
                  name="contactBranch"
                  value={contactBranch}
                  onValueChange={setContactBranch}
                  aria-labelledby="pickup-branch-label"
                  aria-describedby={fieldError("contactBranch") ? "pickup-branch-hint contactBranch-error" : "pickup-branch-hint"}
                  aria-required="true"
                  aria-invalid={Boolean(fieldError("contactBranch"))}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <BranchOption
                    value="headquarters"
                    label={t("contactBranchHeadquarters")}
                    mapUrl={QUOTE_BRANCH_MAP_URLS.headquarters}
                    mapLinkLabel={t("viewBranchOnMaps", { branch: t("contactBranchHeadquarters") })}
                  />
                  <BranchOption
                    value="thalang"
                    label={t("contactBranchThalang")}
                    mapUrl={QUOTE_BRANCH_MAP_URLS.thalang}
                    mapLinkLabel={t("viewBranchOnMaps", { branch: t("contactBranchThalang") })}
                  />
                </RadioGroup>
                {fieldError("contactBranch") && (
                  <p id="contactBranch-error" role="alert" className="font-label-sm text-[#ba1a1a]">
                    {fieldError("contactBranch")}
                  </p>
                )}
              </fieldset>
            </div>
          )}
        </Section>

        <Section title={t("companySection")}>
          <CheckField
            name="needTaxInvoice"
            checked={companyInvoice.needTaxInvoice}
            onChange={handleTaxInvoiceToggle}
          >
            {t("needTaxInvoice")}
          </CheckField>

          {companyInvoice.needTaxInvoice && (
            <div className="space-y-4 border-t border-[#ededf7] pt-5">
              {fulfillmentMethod === "delivery" && (
                <CheckField
                  name="useDeliveryAddress"
                  checked={useSameDeliveryAddress}
                  onChange={handleSameDeliveryAddressToggle}
                >
                  {t("useDeliveryAddress")}
                </CheckField>
              )}

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
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 13);
                    updateCompanyInvoice("taxId", digits);
                  }}
                  inputMode="numeric"
                  maxLength={13}
                />
              </Field>
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
                    onValueChange={handleCompanyProvinceChange}
                  >
                    <SelectTrigger id="province" className="w-full">
                      <SelectValue placeholder={t("provincePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {SOUTHERN_PROVINCES.map((item) => (
                        <SelectItem key={item.code} value={item.code} className="font-body-sm">
                          {locale === "en" ? item.nameEn : item.nameTh}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("district")} name="district" error={fieldError("district")} required>
                  <DistrictCombobox
                    id="district"
                    name="district"
                    label={t("district")}
                    provinceCode={companyInvoice.province}
                    value={companyInvoice.district}
                    locale={locale === "en" ? "en" : "th"}
                    placeholder={t("districtPlaceholder")}
                    chooseProvinceText={t("districtChooseProvince")}
                    describedBy={fieldError("district") ? "district-error" : undefined}
                    invalid={Boolean(fieldError("district"))}
                    onValueChange={handleCompanyDistrictChange}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("subDistrict")}
                  name="subDistrict"
                  error={fieldError("subDistrict")}
                  required
                >
                  <SubdistrictCombobox
                    id="subDistrict"
                    name="subDistrict"
                    label={t("subDistrict")}
                    provinceCode={companyInvoice.province}
                    districtValue={companyInvoice.district}
                    value={companyInvoice.subDistrict}
                    locale={locale === "en" ? "en" : "th"}
                    placeholder={t("subDistrictPlaceholder")}
                    chooseDistrictText={t("subDistrictChooseDistrict")}
                    describedBy={fieldError("subDistrict") ? "subDistrict-error" : undefined}
                    invalid={Boolean(fieldError("subDistrict"))}
                    onValueChange={(value) => updateCompanyInvoice("subDistrict", value)}
                  />
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
            {t("consentBefore")} {" "}
            <LegalDialog
              document="privacy"
              label={t("consentPolicyLink")}
              triggerClassName="cursor-pointer font-semibold text-primary underline underline-offset-2 transition-colors hover:text-secondary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
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
        <p id={`${name}-error`} className="font-label-sm text-[#ba1a1a]">
          {error}
        </p>
      ) : hint ? (
        <p className="font-label-sm text-[#747684]">{hint}</p>
      ) : null}
    </div>
  );
}

function FulfillmentOption({
  id,
  value,
  label,
  description,
  icon: Icon,
}: {
  id: string;
  value: FulfillmentMethod;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Label
      htmlFor={id}
      className="flex min-h-24 cursor-pointer items-start gap-3 rounded-lg border border-[#c4e2f5] bg-white px-4 py-4 text-[#434653] shadow-blue-sm transition-[border-color,background-color,box-shadow] hover:border-[#078ee4] hover:bg-[#faf8ff] hover:shadow-blue-md has-data-[state=checked]:border-primary has-data-[state=checked]:bg-linear-to-r has-data-[state=checked]:from-[#f0f4ff] has-data-[state=checked]:to-[#f8fafc] has-data-[state=checked]:text-primary has-data-[state=checked]:shadow-blue-md focus-within:ring-3 focus-within:ring-ring/50"
    >
      <RadioGroupItem
        id={id}
        value={value}
        className="mt-0.5 size-5 border-2 border-[#c4e2f5] shadow-none data-[state=checked]:border-primary"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-label-md font-semibold">
          <Icon className="size-4 shrink-0 text-primary/70" aria-hidden="true" />
          {label}
        </span>
        <span className="mt-1 block font-label-sm leading-relaxed text-[#747684]">{description}</span>
      </span>
    </Label>
  );
}

/** `value` เป็น BranchCode เพื่อให้พิมพ์ผิดแล้วคำขอถูกส่งไปผิดสาขาไม่ผ่าน type check */
function BranchOption({
  value,
  label,
  mapUrl,
  mapLinkLabel,
}: {
  value: BranchCode;
  label: string;
  mapUrl: string;
  mapLinkLabel: string;
}) {
  const id = `contactBranch-${value}`;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border border-[#c4e2f5] bg-white px-4 py-4 font-body-sm text-[#434653] shadow-blue-sm transition-[border-color,background-color,box-shadow] hover:border-[#078ee4] hover:bg-[#faf8ff] hover:shadow-blue-md has-data-[state=checked]:border-primary has-data-[state=checked]:bg-linear-to-r has-data-[state=checked]:from-[#f0f4ff] has-data-[state=checked]:to-[#f8fafc] has-data-[state=checked]:text-primary has-data-[state=checked]:shadow-blue-md focus-within:ring-3 focus-within:ring-ring/50"
      >
        <RadioGroupItem
          id={id}
          value={value}
          className="size-5 border-2 border-[#c4e2f5] shadow-none data-[state=checked]:border-primary"
        />
        <span className="flex min-w-0 items-center gap-2 font-label-md font-semibold">
          <Building2 className="size-4 shrink-0 text-primary/70" aria-hidden="true" />
          {label}
        </span>
      </Label>
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={mapLinkLabel}
        className="inline-flex items-center gap-1.5 pl-4 font-label-sm font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ExternalLink className="size-3.5" aria-hidden="true" />
        {mapLinkLabel}
      </a>
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
