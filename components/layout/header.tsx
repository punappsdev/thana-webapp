"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "../../i18n/routing";
import { useCart } from "@/components/cart/use-cart";
import { ProductSearchBox } from "@/components/search/product-search-box";
import { useConsent } from "@/components/consent/use-consent";
import { setFunctionalLocale } from "@/lib/functional-locale";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const t = useTranslations("Header");
  const tCart = useTranslations("Cart");
  const { count, hydrated, openCart } = useCart();
  const { functional, expiresAt } = useConsent();
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
    if (functional) setFunctionalLocale(nextLocale, expiresAt);
    router.replace(pathname, { locale: nextLocale });
  };

  const navLinks = [
    { label: t("nav.home"), href: "/", active: pathname === "/" },
    { label: t("nav.products"), href: "/products", active: pathname.startsWith("/products") },
    { label: t("nav.news"), href: "/news", active: pathname === "/news" },
    { label: t("nav.projects"), href: "/portfolio", active: pathname.startsWith("/portfolio") },
    { label: t("nav.articles"), href: "/articles", active: pathname.startsWith("/articles") },
    { label: t("nav.aboutUs"), href: "/about", active: pathname === "/about" },
    { label: t("nav.contactUs"), href: "/contact", active: pathname === "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* Top Bar Header Content */}
      <div
        className={`relative z-50 bg-white/95 backdrop-blur-md border-b transition-all duration-300 ${scrolled ? "py-2 border-border/80 shadow-md" : "py-4 border-primary-container shadow-sm"
          }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 flex justify-between items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/main-logo-tp.png"
              alt="Thana Glass Group Logo"
              width={160}
              height={52}
              className="h-10 lg:h-8 xl:h-12 w-auto object-contain"
              style={{ width: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav
            className={`hidden lg:flex items-center gap-2 xl:gap-5 transition-all duration-300 ${
              searchFocused
                ? "opacity-0 pointer-events-none max-w-0 overflow-hidden"
                : "opacity-100 max-w-4xl"
            }`}
          >
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className={`font-label-md xl:font-body-sm whitespace-nowrap transition-colors ${link.active
                    ? "text-primary border-b-2 border-primary-container pb-1 font-bold"
                    : "text-muted-foreground hover:text-primary"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 xl:gap-4">
            {/* Search Input (desktop) */}
            <ProductSearchBox
              variant="desktop"
              className="hidden lg:block"
              inputClassName={
                searchFocused ? "w-64 lg:w-64 xl:w-80" : "w-24 lg:w-24 xl:w-52"
              }
              onFocusChange={setSearchFocused}
            />

            {/* Quotation Cart — badge is absolute so it never widens the
                right-actions cluster, which runs tight in EN at 1024–1280px */}
            <button
              id="header-cart-btn"
              onClick={openCart}
              className="relative flex items-center justify-center p-2 rounded-full hover:bg-muted transition-all text-primary cursor-pointer"
              aria-label={tCart("openCart")}
            >
              <ShoppingCart className="h-6 w-6" />
              {hydrated && count > 0 && (
                <span
                  aria-live="polite"
                  className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 font-label-sm font-semibold text-white"
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 font-label-md xl:font-body-sm font-medium text-muted-foreground">
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
        className={`absolute left-0 w-full lg:hidden bg-white border-b border-border py-6 px-4 shadow-lg flex flex-col gap-4 transition-all duration-300 ease-in-out z-40 ${mobileMenuOpen
            ? "top-full translate-y-0 opacity-100 visible"
            : "top-0 -translate-y-full opacity-0 invisible"
          }`}
      >
        {/* Search (mobile) */}
        <ProductSearchBox
          variant="mobile"
          className="w-full"
          inputClassName="w-full font-body-sm"
          onNavigate={() => setMobileMenuOpen(false)}
        />
        <nav className="flex flex-col gap-3">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-md px-2 py-1.5 font-body-sm transition-colors ${
                link.active
                  ? "bg-[#f3f3fc] font-bold text-primary"
                  : "text-muted-foreground hover:bg-[#faf8ff] hover:text-primary"
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
