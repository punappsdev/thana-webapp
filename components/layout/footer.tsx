import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Mail, Phone, Clock } from "lucide-react";
import { Link } from "../../i18n/routing";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/products";
import { LegalDialog } from "@/components/legal/legal-dialog";

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
              className="w-10 h-10 bg-accent rounded-full hover:bg-[#06C755] hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
            >
              <svg viewBox="0 0 30 30" fill="currentColor" className="h-6 w-6">
                <path d="M 6 4 C 4.895 4 4 4.895 4 6 L 4 24 C 4 25.105 4.895 26 6 26 L 24 26 C 25.105 26 26 25.105 26 24 L 26 6 C 26 4.895 25.105 4 24 4 L 6 4 z M 15.003906 7.6660156 C 19.720906 7.6660156 23.558594 10.780375 23.558594 14.609375 C 23.558594 16.142375 22.964609 17.523813 21.724609 18.882812 C 19.929609 20.948812 15.916906 23.464609 15.003906 23.849609 C 14.091906 24.233609 14.225719 23.604672 14.261719 23.388672 C 14.283719 23.260672 14.384766 22.65625 14.384766 22.65625 C 14.413766 22.43725 14.442469 22.099812 14.355469 21.882812 C 14.258469 21.645813 13.880563 21.520937 13.601562 21.460938 C 9.4895625 20.916937 6.4472656 18.041375 6.4472656 14.609375 C 6.4472656 10.781375 10.286906 7.6660156 15.003906 7.6660156 z M 12.626953 12.910156 C 12.375953 12.910156 12.171875 13.107656 12.171875 13.347656 L 12.171875 16.652344 C 12.171875 16.894344 12.375953 17.089844 12.626953 17.089844 C 12.877953 17.089844 13.082031 16.893344 13.082031 16.652344 L 13.082031 13.347656 C 13.082031 13.107656 12.877953 12.910156 12.626953 12.910156 z M 14.5625 12.910156 C 14.5175 12.910156 14.470781 12.915641 14.425781 12.931641 C 14.248781 12.991641 14.128906 13.157703 14.128906 13.345703 L 14.128906 16.650391 C 14.128906 16.892391 14.3225 17.089844 14.5625 17.089844 C 14.8025 17.089844 14.996094 16.890391 14.996094 16.650391 L 14.996094 14.605469 L 16.679688 16.914062 C 16.760687 17.024063 16.889391 17.089844 17.025391 17.089844 C 17.072391 17.089844 17.118109 17.082406 17.162109 17.066406 C 17.340109 17.006406 17.460938 16.840344 17.460938 16.652344 L 17.457031 16.652344 L 17.457031 13.347656 C 17.457031 13.107656 17.263391 12.910156 17.025391 12.910156 C 16.787391 12.910156 16.591797 13.107656 16.591797 13.347656 L 16.591797 15.392578 L 14.908203 13.085938 C 14.827203 12.975938 14.6985 12.910156 14.5625 12.910156 z M 18.929688 12.910156 C 18.678688 12.910156 18.474609 13.107656 18.474609 13.347656 L 18.474609 14.998047 L 18.474609 15 L 18.474609 16.650391 C 18.474609 16.892391 18.678687 17.089844 18.929688 17.089844 L 20.654297 17.089844 C 20.906297 17.089844 21.111328 16.892344 21.111328 16.652344 C 21.111328 16.412344 20.905297 16.216797 20.654297 16.216797 L 19.384766 16.216797 L 19.384766 15.435547 L 20.654297 15.435547 C 20.906297 15.435547 21.111328 15.24 21.111328 15 C 21.111328 14.758 20.905297 14.5625 20.654297 14.5625 L 19.384766 14.564453 L 19.384766 13.783203 L 20.654297 13.783203 C 20.906297 13.783203 21.111328 13.588656 21.111328 13.347656 C 21.111328 13.107656 20.905297 12.910156 20.654297 12.910156 L 18.929688 12.910156 z M 9.34375 12.912109 C 9.09275 12.912109 8.8886719 13.106656 8.8886719 13.347656 L 8.8886719 16.652344 C 8.8886719 16.894344 9.09275 17.089844 9.34375 17.089844 L 11.068359 17.089844 C 11.320359 17.089844 11.522438 16.893297 11.523438 16.654297 C 11.523437 16.414297 11.319359 16.21875 11.068359 16.21875 L 9.7988281 16.21875 L 9.7988281 13.347656 C 9.7988281 13.107656 9.59475 12.912109 9.34375 12.912109 z" />
              </svg>
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
        <div className="flex gap-6 font-body-sm text-muted-foreground">
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
        </div>
      </div>
    </footer>
  );
}
