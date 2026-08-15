"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart, ShoppingBasket, FileText, FileCheck, ArrowRight, ArrowDown } from "lucide-react";
import React from "react";

const LineIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 30 30" fill="currentColor" {...props}>
    <path d="M 6 4 C 4.895 4 4 4.895 4 6 L 4 24 C 4 25.105 4.895 26 6 26 L 24 26 C 25.105 26 26 25.105 26 24 L 26 6 C 26 4.895 25.105 4 24 4 L 6 4 z M 15.003906 7.6660156 C 19.720906 7.6660156 23.558594 10.780375 23.558594 14.609375 C 23.558594 16.142375 22.964609 17.523813 21.724609 18.882812 C 19.929609 20.948812 15.916906 23.464609 15.003906 23.849609 C 14.091906 24.233609 14.225719 23.604672 14.261719 23.388672 C 14.283719 23.260672 14.384766 22.65625 14.384766 22.65625 C 14.413766 22.43725 14.442469 22.099812 14.355469 21.882812 C 14.258469 21.645813 13.880563 21.520937 13.601562 21.460938 C 9.4895625 20.916937 6.4472656 18.041375 6.4472656 14.609375 C 6.4472656 10.781375 10.286906 7.6660156 15.003906 7.6660156 z M 12.626953 12.910156 C 12.375953 12.910156 12.171875 13.107656 12.171875 13.347656 L 12.171875 16.652344 C 12.171875 16.894344 12.375953 17.089844 12.626953 17.089844 C 12.877953 17.089844 13.082031 16.893344 13.082031 16.652344 L 13.082031 13.347656 C 13.082031 13.107656 12.877953 12.910156 12.626953 12.910156 z M 14.5625 12.910156 C 14.5175 12.910156 14.470781 12.915641 14.425781 12.931641 C 14.248781 12.991641 14.128906 13.157703 14.128906 13.345703 L 14.128906 16.650391 C 14.128906 16.892391 14.3225 17.089844 14.5625 17.089844 C 14.8025 17.089844 14.996094 16.890391 14.996094 16.650391 L 14.996094 14.605469 L 16.679688 16.914062 C 16.760687 17.024063 16.889391 17.089844 17.025391 17.089844 C 17.072391 17.089844 17.118109 17.082406 17.162109 17.066406 C 17.340109 17.006406 17.460938 16.840344 17.460938 16.652344 L 17.457031 16.652344 L 17.457031 13.347656 C 17.457031 13.107656 17.263391 12.910156 17.025391 12.910156 C 16.787391 12.910156 16.591797 13.107656 16.591797 13.347656 L 16.591797 15.392578 L 14.908203 13.085938 C 14.827203 12.975938 14.6985 12.910156 14.5625 12.910156 z M 18.929688 12.910156 C 18.678688 12.910156 18.474609 13.107656 18.474609 13.347656 L 18.474609 14.998047 L 18.474609 15 L 18.474609 16.650391 C 18.474609 16.892391 18.678687 17.089844 18.929688 17.089844 L 20.654297 17.089844 C 20.906297 17.089844 21.111328 16.892344 21.111328 16.652344 C 21.111328 16.412344 20.905297 16.216797 20.654297 16.216797 L 19.384766 16.216797 L 19.384766 15.435547 L 20.654297 15.435547 C 20.906297 15.435547 21.111328 15.24 21.111328 15 C 21.111328 14.758 20.905297 14.5625 20.654297 14.5625 L 19.384766 14.564453 L 19.384766 13.783203 L 20.654297 13.783203 C 20.906297 13.783203 21.111328 13.588656 21.111328 13.347656 C 21.111328 13.107656 20.905297 12.910156 20.654297 12.910156 L 18.929688 12.910156 z M 9.34375 12.912109 C 9.09275 12.912109 8.8886719 13.106656 8.8886719 13.347656 L 8.8886719 16.652344 C 8.8886719 16.894344 9.09275 17.089844 9.34375 17.089844 L 11.068359 17.089844 C 11.320359 17.089844 11.522438 16.893297 11.523438 16.654297 C 11.523437 16.414297 11.319359 16.21875 11.068359 16.21875 L 9.7988281 16.21875 L 9.7988281 13.347656 C 9.7988281 13.107656 9.59475 12.912109 9.34375 12.912109 z" />
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
            <LineIcon className="h-8 w-8" />
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
