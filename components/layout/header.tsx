"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, Menu, X } from "lucide-react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<"TH" | "EN">("TH");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "หน้าแรก", href: "#", active: true },
    { label: "สินค้า", href: "#" },
    { label: "ข่าวสารและโปรโมชั่น", href: "#" },
    { label: "ตัวอย่างผลงาน", href: "#" },
    { label: "บทความ", href: "#" },
    { label: "เกี่ยวกับเรา", href: "#" },
    { label: "ติดต่อเรา", href: "#" },
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
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className={`text-sm transition-colors ${
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
            <div className="relative hidden sm:block">
              <input
                id="header-search-input"
                type="text"
                placeholder="ค้นหาสินค้า..."
                className="bg-muted border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 w-48 transition-all"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            </div>

            {/* Shopping Cart */}
            <button
              id="header-cart-btn"
              className="flex items-center justify-center p-2 rounded-full hover:bg-muted transition-all text-primary"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <button
                onClick={() => setLang("TH")}
                className={`transition-colors cursor-pointer ${lang === "TH" ? "font-bold text-primary" : "hover:text-primary"}`}
              >
                TH
              </button>
              <span className="text-border">|</span>
              <button
                onClick={() => setLang("EN")}
                className={`transition-colors cursor-pointer ${lang === "EN" ? "font-bold text-primary" : "hover:text-primary"}`}
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
        <div className="relative w-full sm:hidden">
          <input
            id="header-search-mobile"
            type="text"
            placeholder="ค้นหาสินค้า..."
            className="w-full bg-muted border border-border rounded-full px-4 py-2 text-sm text-foreground"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
        </div>
        <nav className="flex flex-col gap-3">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm py-1.5 transition-colors ${
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
