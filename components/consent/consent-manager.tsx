"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Cookie,
  Megaphone,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LegalDialog } from "@/components/legal/legal-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useConsent } from "@/components/consent/use-consent";
import {
  COOKIE_SETTINGS_EVENT,
  setConsentPreferences,
  type ConsentPreferences,
} from "@/lib/consent-store";
import { setFunctionalLocale, type AppLocale } from "@/lib/functional-locale";

const OPTIONAL_DISABLED: ConsentPreferences = {
  functional: false,
  analytics: false,
  marketing: false,
};

const OPTIONAL_ENABLED: ConsentPreferences = {
  functional: true,
  analytics: true,
  marketing: true,
};

export function ConsentManager() {
  const t = useTranslations("Consent");
  const locale = useLocale() as AppLocale;
  const consent = useConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentPreferences>(OPTIONAL_DISABLED);

  const openSettings = useCallback(() => {
    setDraft({
      functional: consent.functional,
      analytics: consent.analytics,
      marketing: consent.marketing,
    });
    setSettingsOpen(true);
  }, [consent.functional, consent.analytics, consent.marketing]);

  useEffect(() => {
    const handleOpen = () => openSettings();
    window.addEventListener(COOKIE_SETTINGS_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, handleOpen);
  }, [openSettings]);

  const applyConsent = (preferences: ConsentPreferences) => {
    const saved = setConsentPreferences(preferences);
    if (saved.functional) setFunctionalLocale(locale, saved.expiresAt);
    setSettingsOpen(false);
  };

  const updateDraft = (category: keyof ConsentPreferences, checked: boolean) => {
    setDraft((current) => ({ ...current, [category]: checked }));
  };

  const showBanner =
    consent.hydrated && consent.status === "unset" && !settingsOpen;

  return (
    <>
      {showBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6"
          role="region"
          aria-label={t("bannerAriaLabel")}
        >
          <Card className="relative mx-auto max-h-[calc(100dvh-2rem)] max-w-5xl overflow-y-auto overscroll-contain border border-[#c4c6d5] bg-white/95 py-0 shadow-[0_18px_60px_rgba(0,44,125,0.18)] backdrop-blur-xl">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden />
            <CardContent className="grid gap-5 px-5 py-5 pl-7 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-6 md:px-7 md:py-6 md:pl-9">
              <div className="hidden size-12 items-center justify-center rounded-full border border-[#c4e2f5] bg-[#f3f3fc] text-primary md:flex" aria-hidden>
                <Cookie className="size-6" />
              </div>

              <div className="space-y-1.5">
                <h2 className="font-headline-sm font-semibold text-foreground">
                  {t("bannerTitle")}
                </h2>
                <p className="max-w-2xl font-body-sm leading-relaxed text-muted-foreground">
                  {t("bannerBody")} {" "}
                  <LegalDialog
                    document="privacy"
                    label={t("privacyPolicy")}
                    triggerClassName="cursor-pointer font-body-sm font-medium text-primary underline underline-offset-4 transition-colors hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  />
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
                <Button type="button" variant="outline" size="lg" onClick={openSettings}>
                  {t("manage")}
                </Button>
                <Button type="button" size="lg" onClick={() => applyConsent(OPTIONAL_ENABLED)}>
                  {t("accept")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent
          overlayClassName="z-[70]"
          className="z-[70] max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto overscroll-contain bg-white p-0 sm:max-w-2xl"
        >
          <div className="border-b border-[#ededf7] px-6 pb-5 pt-6 pr-14 sm:px-8 sm:pb-6 sm:pt-8 sm:pr-16">
            <DialogHeader className="gap-3">
              <div className="flex size-11 items-center justify-center rounded-full border border-[#c4e2f5] bg-[#f3f3fc] text-primary" aria-hidden>
                <Cookie className="size-5" />
              </div>
              <DialogTitle className="font-headline-md font-semibold leading-tight text-primary">
                {t("dialogTitle")}
              </DialogTitle>
              <DialogDescription className="font-body-sm leading-relaxed text-muted-foreground">
                {t("dialogBody")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-3 px-6 py-5 sm:px-8 sm:py-6">
            <ConsentCategory
              category="necessary"
              icon={ShieldCheck}
              title={t("necessaryTitle")}
              description={t("necessaryDescription")}
              checked
              disabled
              statusLabel={t("alwaysOn")}
            />
            <ConsentCategory
              category="functional"
              icon={SlidersHorizontal}
              title={t("functionalTitle")}
              description={t("functionalDescription")}
              checked={draft.functional}
              onCheckedChange={(checked) => updateDraft("functional", checked)}
              statusLabel={draft.functional ? t("on") : t("off")}
            />
            <ConsentCategory
              category="analytics"
              icon={BarChart3}
              title={t("analyticsTitle")}
              description={t("analyticsDescription")}
              checked={draft.analytics}
              onCheckedChange={(checked) => updateDraft("analytics", checked)}
              statusLabel={draft.analytics ? t("on") : t("off")}
            />
            <ConsentCategory
              category="marketing"
              icon={Megaphone}
              title={t("marketingTitle")}
              description={t("marketingDescription")}
              checked={draft.marketing}
              onCheckedChange={(checked) => updateDraft("marketing", checked)}
              statusLabel={draft.marketing ? t("on") : t("off")}
            />

            <p className="font-body-sm leading-relaxed text-muted-foreground">
              {t("learnMore")} {" "}
              <LegalDialog
                document="privacy"
                label={t("privacyPolicy")}
                triggerClassName="cursor-pointer font-body-sm font-medium text-primary underline underline-offset-4 transition-colors hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </p>
          </div>

          <DialogFooter className="m-0 flex-col-reverse gap-2 rounded-none rounded-b-xl px-6 py-4 sm:flex-row sm:px-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => applyConsent(OPTIONAL_DISABLED)}
            >
              {t("reject")}
            </Button>
            <Button type="button" size="lg" onClick={() => applyConsent(draft)}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type ConsentCategoryProps = {
  category: "necessary" | keyof ConsentPreferences;
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  statusLabel: string;
  onCheckedChange?: (checked: boolean) => void;
};

function ConsentCategory({
  category,
  icon: Icon,
  title,
  description,
  checked,
  disabled = false,
  statusLabel,
  onCheckedChange,
}: ConsentCategoryProps) {
  const switchId = `consent-${category}`;

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border border-[#c4c6d5] bg-[#faf8ff] p-4">
      <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-[#dbe1ff] text-primary" aria-hidden>
        <Icon className="size-4" />
      </div>
      <label
        htmlFor={switchId}
        className={`min-w-0 space-y-1 ${disabled ? "cursor-default" : "cursor-pointer"}`}
      >
        <span className="block font-label-md font-semibold text-foreground">{title}</span>
        <span className="block font-body-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </label>
      <div className="flex flex-col items-end gap-1.5">
        <Switch
          id={switchId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          aria-label={title}
        />
        <span className="font-label-sm text-muted-foreground">{statusLabel}</span>
      </div>
    </div>
  );
}
