"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart, ShoppingBasket, FileText, FileCheck, ArrowRight, ArrowDown } from "lucide-react";
import React from "react";
import { LineIcon } from "@/components/icons/line-icon";

const GmailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

export function QuotationSteps() {
  const t = useTranslations("QuotationSteps");

  const steps = [
    {
      icon: <ShoppingCart className="h-7 w-7 text-white" />,
      badge: null,
      isEnd: false,
    },
    {
      icon: <ShoppingBasket className="h-7 w-7 text-white" />,
      badge: "1",
      isEnd: false,
    },
    {
      icon: <FileText className="h-7 w-7 text-white" />,
      badge: null,
      isEnd: false,
    },
    {
      icon: <FileCheck className="h-7 w-7 text-white" />,
      badge: null,
      isEnd: false,
    },
    {
      icon: (
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Overlapping Line Logo */}
          <div className="absolute left-0 bottom-0 w-11 h-11 bg-[#06c755] text-white rounded-xl flex items-center justify-center shadow-md">
            <LineIcon bubbleFill="white" textFill="#06C755" className="h-6 w-6" />
          </div>
          {/* Overlapping Gmail Envelope Logo */}
          <div className="absolute right-0 top-0 w-11 h-11 bg-[#3ca6fe] text-white rounded-xl flex items-center justify-center shadow-md border-2 border-white">
            <GmailIcon className="h-5 w-5" />
          </div>
        </div>
      ),
      badge: null,
      isEnd: true,
    },
  ];

  return (
    <section className="py-20 px-4 md:px-10 max-w-[1280px] mx-auto bg-background">
      <div className="text-center mb-12">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-3">
          {t("title")}
        </h2>
        <div className="w-16 h-1 bg-[#3ca6fe] mx-auto rounded-full" />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 max-w-[1100px] mx-auto">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={idx}>
              {/* Step Card */}
              <div className="flex-grow flex-shrink-0 w-full md:w-auto md:flex-1 flex flex-col items-center text-center max-w-[200px]">
                {/* Icon Container */}
                <div className="relative mb-4 flex items-center justify-center">
                  {!step.isEnd ? (
                    <div className="w-16 h-16 rounded-full bg-[#0040ad] flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(0,64,173,0.3)]">
                      {step.icon}
                    </div>
                  ) : (
                    step.icon
                  )}

                  {/* Red Notification Badge */}
                  {step.badge && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#ba1a1a] text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                      {step.badge}
                    </div>
                  )}
                </div>

                {/* Step Metadata */}
                <h3 className="font-headline-sm text-primary font-bold mb-2">
                  {t(`steps.${idx}.title`)}
                </h3>
                <p className="font-label-sm text-muted-foreground leading-relaxed">
                  {t(`steps.${idx}.desc`)}
                </p>
              </div>

              {/* Arrow Connector */}
              {!isLast && (
                <div className="flex items-center justify-center text-[#3ca6fe] py-2 md:py-0">
                  <ArrowRight className="hidden md:block h-6 w-6" />
                  <ArrowDown className="block md:hidden h-6 w-6" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
