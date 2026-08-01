"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

type LegalSection = { heading: string; body: string };

type LegalDocument = {
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated: string;
};

export function LegalDialog({
  document,
  label,
  triggerClassName,
}: {
  document: "privacy" | "terms";
  label: string;
  triggerClassName: string;
}) {
  const t = useTranslations("Legal");
  const { title, intro, sections, lastUpdated } = t.raw(document) as LegalDocument;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          {label}
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] gap-0 overflow-y-auto overscroll-contain scroll-py-6 bg-white p-0 sm:max-w-3xl">
        <div className="px-6 pb-5 pt-6 pr-14 sm:px-8 sm:pb-6 sm:pt-8 sm:pr-16">
          <DialogHeader className="gap-3">
            <DialogTitle className="font-headline-md font-semibold leading-tight text-primary">
              {title}
            </DialogTitle>
            <DialogDescription className="font-body-sm whitespace-pre-line leading-relaxed text-[#434653]">
              {intro}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-8 px-6 pb-7 sm:px-8 sm:pb-9">
          {sections.map((section) => (
            <section key={section.heading} className="scroll-mt-6 space-y-2">
              <h3 className="font-headline-sm font-semibold leading-snug text-on-surface">
                {section.heading}
              </h3>
              <p className="font-body-sm whitespace-pre-line leading-relaxed text-[#434653]">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="border-t border-[#ededf7] bg-[#f3f3fc]/60 px-6 py-4 sm:px-8">
          <p className="font-label-sm text-[#747684]">{lastUpdated}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
