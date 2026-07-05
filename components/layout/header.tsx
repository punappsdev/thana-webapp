"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "../../i18n/routing";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("Header");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLocaleChange = (nextLocale: "th" | "en") => {
    router.replace(pathname, { locale: nextLocale });
  };

  const navLinks = [
    { label: t("nav.home"), href: "/", active: pathname === "/" },
    { label: t("nav.products"), href: "#" },
    { label: t("nav.news"), href: "#" },
    { label: t("nav.projects"), href: "#" },
    { label: t("nav.articles"), href: "#" },
    { label: t("nav.aboutUs"), href: "#" },
    { label: t("nav.contactUs"), href: "/contact", active: pathname === "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* Top Bar Header Content */}
      <div
        className={`relative z-50 bg-white/95 backdrop-blur-md border-b transition-all duration-300 ${
          scrolled ? "py-2 border-border/80 shadow-md" : "py-4 border-primary-container shadow-sm"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 flex justify-between items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/main-logo-tp.png"
              alt="Thana Glass Group Logo"
              width={160}
              height={48}
              className="h-10 md:h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-5">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className={`font-body-md whitespace-nowrap transition-colors ${
                  link.active
                    ? "text-primary border-b-2 border-primary-container pb-1 font-bold"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Search Input (desktop) */}
            <div className="relative hidden lg:block">
              <input
                id="header-search-input"
                type="text"
                placeholder={t("searchPlaceholder")}
                className="bg-muted border border-border rounded-full pl-4 pr-10 py-2 font-body-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 w-40 focus:w-48 transition-all"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
            </div>

            {/* Shopping Cart */}
            <button
              id="header-cart-btn"
              className="flex items-center justify-center p-2 rounded-full hover:bg-muted transition-all text-primary"
              aria-label="ShoppingCart"
            >
              <ShoppingCart className="h-6 w-6" />
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 font-body-md font-medium text-muted-foreground">
              <button
                onClick={() => handleLocaleChange("th")}
                className={`transition-colors cursor-pointer uppercase ${locale === "th" ? "font-bold text-primary" : "hover:text-primary"}`}
              >
                TH
              </button>
              <span className="text-border">|</span>
              <button
                onClick={() => handleLocaleChange("en")}
                className={`transition-colors cursor-pointer uppercase ${locale === "en" ? "font-bold text-primary" : "hover:text-primary"}`}
              >
                EN
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-primary"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        className={`absolute left-0 w-full lg:hidden bg-white border-b border-border py-6 px-4 shadow-lg flex flex-col gap-4 transition-all duration-300 ease-in-out z-40 ${
          mobileMenuOpen
            ? "top-full translate-y-0 opacity-100 visible"
            : "top-0 -translate-y-full opacity-0 invisible"
        }`}
      >
        {/* Search (mobile) */}
        <div className="relative w-full">
          <input
            id="header-search-mobile"
            type="text"
            placeholder={t("searchPlaceholder")}
            className="w-full bg-muted border border-border rounded-full px-4 py-2 font-body-sm text-foreground"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
        </div>
        <nav className="flex flex-col gap-3">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`font-body-sm py-1.5 transition-colors ${
                link.active ? "text-primary font-bold border-l-4 border-primary pl-2" : "text-muted-foreground pl-2"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
