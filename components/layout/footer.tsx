"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Mail, Phone, Clock, MapPin } from "lucide-react";
import { Link } from "../../i18n/routing";

export function Footer() {
  const t = useTranslations("Footer");
  const tCat = useTranslations("CategoryGrid");

  return (
    <footer className="bg-white border-t border-border/80 py-12">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between gap-10">
        {/* Footer Brand Info */}
        <div className="flex flex-col gap-6 md:max-w-sm">
          <Image
            src="/main-logo-tp.png"
            alt="Thana Glass Logo"
            width={160}
            height={48}
            className="h-12 w-fit object-contain"
          />
          <p className="text-muted-foreground text-base">
            {t("desc")}
          </p>
          <div className="flex gap-4">
            <a
              href="https://line.me/R/ti/p/~@thanaglass"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-accent rounded-full hover:bg-[#06C755] hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M22 10.364c0-4.577-4.486-8.364-10-8.364s-10 3.787-10 8.364c0 4.1 3.568 7.525 8.389 8.217l-1.602 3.19c-.09.18.016.398.21.332l4.802-1.644c5.093-.244 8.201-3.647 8.201-8.455" />
              </svg>
            </a>
            <a href="mailto:info@thana-glass.com" className="p-2 bg-accent rounded-full hover:bg-primary hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95">
              <Mail className="h-5 w-5" />
            </a>
            <a href="tel:076-381444" className="p-2 bg-accent rounded-full hover:bg-primary hover:text-white transition-all text-muted-foreground hover:scale-105 active:scale-95">
              <Phone className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Footer Links & Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 flex-1">
          <div>
            <h4 className="font-heading font-semibold text-primary mb-6">{t("headingCategories")}</h4>
            <ul className="flex flex-col gap-4 text-muted-foreground text-base">
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">{tCat("items.aluminum.title")}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">{tCat("items.glass.title")}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">{tCat("items.ceiling.title")}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">{tCat("items.hardware.title")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-primary mb-6">{t("headingCompanies")}</h4>
            <ul className="flex flex-col gap-4 text-muted-foreground text-base">
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">{t("companies.0")}</Link></li>
              <li><Link href="#" className="hover:text-primary transition-all hover:underline">{t("companies.1")}</Link></li>
            </ul>
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h4 className="font-heading font-semibold text-primary mb-6">{t("headingContact")}</h4>
            <ul className="flex flex-col gap-4 text-muted-foreground text-base">
              <li className="flex gap-2">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <span>{t("address")}</span>
              </li>
              <li className="flex gap-2">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <span className="break-all">info@thana-glass.com</span>
              </li>
              <li className="flex gap-2">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <span>076-381444, 076-381356-7, 088-7652642</span>
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
        <p className="text-sm text-muted-foreground">{t("copyright")}</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-all">{t("privacy")}</Link>
          <Link href="#" className="hover:text-primary transition-all">{t("terms")}</Link>
        </div>
      </div>
    </footer>
  );
}
