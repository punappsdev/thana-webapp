"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PolicySection = { heading: string; body: string };

/**
 * The PDPA notice the consent checkbox links to. Sections come from the message
 * files as structured data (the same `t.raw` approach the contact page uses for
 * its branch list), so the wording can be revised without touching this file.
 */
export function PrivacyPolicyDialog({ label }: { label: string }) {
  const t = useTranslations("QuoteForm");
  const sections = t.raw("policy.sections") as PolicySection[];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="cursor-pointer font-semibold text-primary underline underline-offset-2 transition-colors hover:text-secondary"
        >
          {label}
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline-sm text-primary">
            {t("policy.title")}
          </DialogTitle>
          <DialogDescription className="font-body-sm text-[#434653]">
            {t("policy.intro")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-1.5">
              <h3 className="font-label-lg font-semibold text-on-surface">{section.heading}</h3>
              <p className="font-body-sm leading-relaxed text-[#434653]">{section.body}</p>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
