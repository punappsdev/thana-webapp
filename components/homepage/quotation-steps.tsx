"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart, ShoppingBasket, FileText, FileCheck, ArrowRight, ArrowDown } from "lucide-react";
import React from "react";

const LineIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 10.3c0-4.8-5.4-8.8-12-8.8S0 5.5 0 10.3c0 4.3 4.3 7.9 10.1 8.7.4.1.9.4 1 .9.1.3.1.8 0 1.1-.1.4-.4 1.7-.5 2.2-.1.5-.5 2.1.2 1.4 1.1-1.1 5.9-6.8 6.7-7.9 4.3-1.6 6.5-4.4 6.5-6.4zm-14.7.7H7.7v-3c0-.3-.2-.5-.5-.5s-.5.2-.5.5v3.5c0 .3.2.5.5.5h1.6c.3 0 .5-.2.5-.5s-.2-.5-.5-.5zm2.7-3.5c-.3 0-.5.2-.5.5v3.5c0 .3.2.5.5.5s.5-.2.5-.5v-3.5c0-.3-.2-.5-.5-.5zm4.8 0h-.1c-.1 0-.2.1-.3.2l-2 2.7V8c0-.3-.2-.5-.5-.5s-.5.2-.5.5v3.5c0 .1 0 .2.1.3.1.1.2.2.3.2h.1c.1 0 .2-.1.3-.2l2-2.7V11.5c0 .3.2.5.5.5s.5-.2.5-.5v-3.5c0-.3-.2-.5-.5-.5zm5.5 1c-.3 0-.5.2-.5.5V9h-1v-.8c0-.3-.2-.5-.5-.5s-.5.2-.5.5v2.8c0 .3.2.5.5.5h2c.3 0 .5-.2.5-.5s-.2-.5-.5-.5z"/>
  </svg>
);

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
            <LineIcon className="h-6 w-6" />
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
