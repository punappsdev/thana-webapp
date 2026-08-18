import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Mail, Phone, Clock } from "lucide-react";
import { Link } from "../../i18n/routing";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/products";
import { LegalDialog } from "@/components/legal/legal-dialog";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import { LineIcon } from "@/components/icons/line-icon";

/**
 * The category column reads the database directly rather than fetching
 * `/api/categories` from the client. Nothing else in the footer is interactive,
 * so keeping it on the server means the links are correct in the very first
 * HTML — no hardcoded fallback list to drift out of date, and no flash of stale
 * category names on every page.
 */
export async function Footer() {
  const t = await getTranslations("Footer");
  const locale = await getLocale();
  const categories = await prisma.category.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, nameTh: true, nameEn: true },
  });

  return (
    <footer className="bg-white border-t border-border/80 py-12">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between gap-10">
        {/* Footer Brand Info */}
        <div className="flex flex-col gap-6 md:max-w-sm">
          <Image
            src="/main-logo-tp.png"
            alt="Thana Glass Logo"
            width={160}
            height={52}
            className="h-12 w-auto object-contain self-start"
            style={{ width: 'auto' }}
          />
          <p className="text-muted-foreground font-body-sm whitespace-pre-line">
            {t("desc")}
          </p>
          <div className="flex gap-3 items-center">
            <a
              href="https://lin.ee/P3ZGgWM"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LINE"
              className="group w-10 h-10 bg-accent rounded-full hover:bg-[#06C755] hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
            >
              <LineIcon
                bubbleFill="currentColor"
                textFill="white"
                bubbleClassName="transition-colors"
                textClassName="transition-colors group-hover:fill-[#06C755]"
                className="h-5 w-5"
              />
            </a>
            <a
              href="mailto:info@thana-glass.com"
              aria-label="Email"
              className="w-10 h-10 bg-accent rounded-full hover:bg-primary hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
            >
              <Mail className="h-5 w-5" />
            </a>
            <a
              href="tel:076-381-444"
              aria-label="Phone"
              className="w-10 h-10 bg-accent rounded-full hover:bg-primary hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Footer Links & Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 flex-1">
          <div>
            <h2 className="font-headline-sm font-semibold text-primary mb-6">{t("headingCategories")}</h2>
            <ul className="flex flex-col gap-4 text-muted-foreground font-body-sm">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="hover:text-primary transition-all hover:underline"
                  >
                    {pick(cat as unknown as Record<string, unknown>, "name", locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-headline-sm font-semibold text-primary mb-6">{t("headingCompanies")}</h2>
            <ul className="flex flex-col gap-4 text-muted-foreground font-body-sm">
              <li>{t("companies.0")}</li>
              <li>{t("companies.1")}</li>
            </ul>
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h2 className="font-headline-sm font-semibold text-primary mb-6">{t("headingContact")}</h2>
            <ul className="flex flex-col gap-4 text-muted-foreground font-body-sm">
              <li className="flex gap-2">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <span className="break-all">info@thana-glass.com</span>
              </li>
              <li className="flex gap-2">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <span>076-381-444, 076-381-356, 076-311-222</span>
              </li>
              <li className="flex gap-2">
                <Clock className="h-5 w-5 shrink-0 text-primary" />
                <span>{t("hours")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-body-sm text-muted-foreground text-center md:text-left">{t("copyright")}</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 font-body-sm text-muted-foreground md:justify-end">
          <LegalDialog
            document="privacy"
            label={t("privacy")}
            triggerClassName="cursor-pointer font-body-sm font-normal text-muted-foreground no-underline transition-all hover:text-primary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          <LegalDialog
            document="terms"
            label={t("terms")}
            triggerClassName="cursor-pointer font-body-sm font-normal text-muted-foreground no-underline transition-colors hover:text-primary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          <CookieSettingsButton label={t("cookieSettings")} />
        </div>
      </div>
    </footer>
  );
}
