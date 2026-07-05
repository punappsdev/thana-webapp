"use client";

import { Award, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";

export function AboutUs() {
  const t = useTranslations("AboutUs");

  return (
    <section className="py-16 px-4 md:px-10 max-w-[1280px] mx-auto bg-white overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Description Block */}
        <div className="order-2 lg:order-1">
          <span className="text-label-sm text-secondary font-bold tracking-wider mb-3 block">
            {t("tag")}
          </span>
          <h2 className="text-headline-lg-mobile lg:text-headline-lg text-primary mb-6">
            {t("title")}
          </h2>
          <p className="text-body-md text-muted-foreground mb-8">
            {t("desc")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="flex gap-4">
              <div className="bg-primary/5 p-3 rounded-lg h-fit text-primary">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-headline-md text-primary font-bold">{t("tis.title")}</h4>
                <p className="text-label-sm text-muted-foreground mt-1">
                  {t("tis.desc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-primary/5 p-3 rounded-lg h-fit text-primary">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-headline-md text-primary font-bold">{t("expert.title")}</h4>
                <p className="text-label-sm text-muted-foreground mt-1">
                  {t("expert.desc")}
                </p>
              </div>
            </div>
          </div>

          <button className="bg-primary hover:bg-[#00174b] text-white px-10 py-4 rounded-lg font-bold transition-all shadow-md text-label-sm cursor-pointer">
            {t("btnMore")}
          </button>
        </div>

        {/* Picture Block */}
        <div className="order-1 lg:order-2 relative w-full">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#3ca6fe]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#0040ad]/10 rounded-full blur-3xl pointer-events-none" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoOSXll4ceaL7B3u_T-YeLfaQGcVHGpJrpnazlPTofotMFZUyxVKy5P8TA4c9LEa3S_ccuxAmbl_VPyY0n-9i3Ur_q-Zmn_xAUCraU0Gng3jvPvuAmVCXAJ5gHtlIZ4YVrIXnrGp93_gDBrzaRpBrI0DYDGIRJfYpWOHkNovQYgCVusy34czuM5y2MArKZ5WE-JW4_3g468cnmVkwriHXWuUDn4Ij8Spj-Ax1Ftzd5P0CGpMIqwsFa15XVfTSmjdp_IuetFTPaj0g"
            alt="Thana Glass fabrication factory warehouse"
            className="rounded-2xl relative z-10 w-full object-cover h-[450px]"
            style={{ boxShadow: "0 10px 30px -10px rgba(0, 64, 173, 0.08)" }}
          />
        </div>
      </div>
    </section>
  );
}
