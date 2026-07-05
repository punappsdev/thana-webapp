# Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a responsive, highly-polished, and componentized homepage for the Thana Glass Aluminum web application, cloning the structure of `example/index.html` and utilizing the design system from `DESIGN.md`.

**Architecture:** Create modular, isolated components for each major page section (Header, Footer, Hero, CategoryGrid, ProductList, AboutUs, CtaSection, and ContactFab) under `components/` and assemble them in `app/page.tsx`.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, Lucide React, TypeScript.

## Global Constraints
- Pair fonts: `Prompt` (for headings) and `Noto Sans Thai` (for body text).
- Use local logo: `/main-logo-tp.png`.
- Ensure all interactive elements have unique, descriptive IDs for usability and testing.
- Map all prototype Material Symbols to their closest `lucide-react` icon.
- No direct git commits without explicit user permission.

---

### Task 1: Create Contact FAB Component

**Files:**
- Create: `components/ui/contact-fab.tsx`

**Interfaces:**
- Produces: `<ContactFab />` component.

- [ ] **Step 1: Write the component implementation**
  Create the `components/ui/contact-fab.tsx` file with a state-driven floating layout that expands into a vertical stack showing LINE, Facebook, and Phone call buttons.

  ```tsx
  "use client";

  import { useState } from "react";
  import { MessageSquare, MessageCircle, Facebook, Phone } from "lucide-react";

  export function ContactFab() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div 
        className="fixed bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-3"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Main Toggle Button */}
        <button
          id="fab-main-toggle"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-secondary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
          aria-label="Contact options"
        >
          <MessageSquare className="h-6 w-6" />
        </button>

        {/* Expanding Stack */}
        <div
          className={`flex flex-col gap-3 transition-all duration-300 ${
            isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
        >
          {/* LINE Button */}
          <div className="flex items-center gap-2 group">
            <span className="bg-white text-secondary px-3 py-1.5 rounded-lg text-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              คุยกับเราทาง LINE
            </span>
            <a
              id="fab-link-line"
              href="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#06C755] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>

          {/* Facebook Messenger Button */}
          <div className="flex items-center gap-2 group">
            <span className="bg-white text-secondary px-3 py-1.5 rounded-lg text-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Facebook Page
            </span>
            <a
              id="fab-link-facebook"
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0084FF] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>

          {/* Telephone Button */}
          <div className="flex items-center gap-2 group">
            <span className="bg-white text-secondary px-3 py-1.5 rounded-lg text-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              โทรหาเรา
            </span>
            <a
              id="fab-link-tel"
              href="tel:076381444"
              className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Run verification**
  Ensure the file is saved correctly without TypeScript lint errors.

---

### Task 2: Create Header Component

**Files:**
- Create: `components/layout/header.tsx`

**Interfaces:**
- Produces: `<Header />` component.

- [ ] **Step 1: Implement the Header Component**
  Create `components/layout/header.tsx` with top nav, search input, shopping cart indicator, language toggle, and collapsible mobile menu navigation drawer.

  ```tsx
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
      <header
        className={`fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b transition-all duration-300 ${
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
                className={`text-body-md font-body-md transition-colors ${
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
            <div className="flex items-center gap-1 text-label-sm font-label-sm text-muted-foreground">
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-border py-4 px-4 shadow-inner flex flex-col gap-4 animate-in slide-in-from-top duration-200">
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
                  className={`text-body-md font-body-md py-1.5 transition-colors ${
                    link.active ? "text-primary font-bold border-l-4 border-primary pl-2" : "text-muted-foreground pl-2"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    );
  }
  ```

- [ ] **Step 2: Save and verify**
  Ensure compile checks pass.

---

### Task 3: Create Footer Component

**Files:**
- Create: `components/layout/footer.tsx`

**Interfaces:**
- Produces: `<Footer />` component.

- [ ] **Step 1: Implement the Footer Component**
  Create `components/layout/footer.tsx` showcasing corporate descriptions, links, contact address, and social highlights.

  ```tsx
  import Link from "next/link";
  import Image from "next/image";
  import { Globe, Mail, Phone, Clock, MapPin } from "lucide-react";

  export function Footer() {
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
            <p className="text-muted-foreground text-body-md">
              บริษัท ธนา กลาส แอนด์ อลูมิเนียม จำกัด มุ่งเน้นการผลิตและจำหน่ายสินค้าที่มีคุณภาพ เพื่อความพึงพอใจสูงสุดของลูกค้า
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-2 bg-accent rounded-full hover:bg-primary hover:text-white transition-all">
                <Globe className="h-5 w-5" />
              </Link>
              <a href="mailto:info@thana-glass.com" className="p-2 bg-accent rounded-full hover:bg-primary hover:text-white transition-all">
                <Mail className="h-5 w-5" />
              </a>
              <a href="tel:076-381444" className="p-2 bg-accent rounded-full hover:bg-primary hover:text-white transition-all">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Footer Links & Contact Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 flex-1">
            <div>
              <h4 className="font-heading font-semibold text-primary mb-6">หมวดหมู่สินค้า</h4>
              <ul className="flex flex-col gap-4 text-muted-foreground text-body-md">
                <li><Link href="#" className="hover:text-primary transition-all hover:underline">อลูมิเนียมเส้น</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all hover:underline">กระจกแผ่น</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all hover:underline">งานฝ้าเพดาน</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all hover:underline">อุปกรณ์ฮาร์ดแวร์</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-primary mb-6">บริษัทในเครือ</h4>
              <ul className="flex flex-col gap-4 text-muted-foreground text-body-md">
                <li><Link href="#" className="hover:text-primary transition-all hover:underline">บริษัทธนา กลาส อลูมินั่ม จำกัด</Link></li>
                <li><Link href="#" className="hover:text-primary transition-all hover:underline">บริษัทธนา กลาส ถลาง จำกัด</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-heading font-semibold text-primary mb-6">ติดต่อเรา</h4>
              <ul className="flex flex-col gap-4 text-muted-foreground text-body-md">
                <li className="flex gap-2">
                  <MapPin className="h-5 w-5 shrink-0 text-primary" />
                  <span>46/9 ม.6 ต.ฉลอง อ.เมืองภูเก็ต จ.ภูเก็ต 83130</span>
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
                  <span>เปิดทุกวัน: 8:00 - 17:00</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-label-sm text-muted-foreground">© 2024 Thana Glass Aluminum. All Rights Reserved.</p>
          <div className="flex gap-6 text-label-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-all">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-all">Terms of Service</Link>
          </div>
        </div>
      </footer>
    );
  }
  ```

- [ ] **Step 2: Save and verify**
  Verify syntax matches typescript rules.

---

### Task 4: Create Hero Slider Component

**Files:**
- Create: `components/homepage/hero.tsx`

**Interfaces:**
- Produces: `<Hero />` component.

- [ ] **Step 1: Implement Hero Component**
  Create `components/homepage/hero.tsx` with layout backgrounds, text headings matching the Prompt font, call-to-action buttons, and dot selectors.

  ```tsx
  "use client";

  import { useState } from "react";
  import Image from "next/image";
  import { Button } from "@/components/ui/button";

  export function Hero() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
      {
        tag: "Expert in Glass & Aluminum",
        title: "ยกระดับอาคารของคุณด้วยงานกระจกและอลูมิเนียมระดับพรีเมียม",
        desc: "เรานำเสนอโซลูชันที่ครบวงจรด้วยวัสดุคุณภาพสูงและการติดตั้งที่ได้มาตรฐานสากล เพื่อความงามและความทนทานที่เหนือกว่า",
        bgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpuv1wzKW-b1lE96I_nXunsKVh55WMx0wT_slAgGY-UY2YeTqIsPZKevnnS4fj36AuyxKLUSGk2IB0fnRTbTgbcWcOEbCoQ-eTPi-HVDPv3g83cJrVX_3t2SRiTRLG0-kWZfR-anDy7DTtJLa0sAMcFzmcfVP14qla3e-ImUkA64oPIzcny_qsoM0G-DAF5npEabst8vjU3gi00mY7I4_1N2riYp7WagqGD6_Zocs0UL9sOSXLFWNIls559PjqxhIjWvTlT8mKVVA",
      },
      {
        tag: "Premium Quality Construction",
        title: "ดีไซน์กระจกเพื่อความโปร่งสบายสไตล์โมเดิร์น",
        desc: "เพิ่มแสงสว่างจากธรรมชาติและความโล่งกว้างให้ตัวบ้าน พร้อมการกรองความร้อนที่มีประสิทธิภาพสูงสุด",
        bgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmaZZFgNzKKOBNOMRyzrsXhi54yijFRIJJmWF6kB93t2RlBEYZOLUm6L0w8nmZnZ1vKCtid8PYZExr_zdp7XDyJRPN9hj3VXk6PC8pgSsUZ3ymfPKCRMr3buYzIBSHt2QtKdnkVPlM5-NtvB2iMadSJlzXeUihLZSI4jS3ETElC84vMVaXqZmubR47bpKfuK42mScj4oDIeeMDgZdGjL1bddnNDKNzW_VYGT0XB3AewfvbVFAQNC_ADNsmGHV4mV7LILCjoVpBRX0",
      }
    ];

    return (
      <section className="relative h-[600px] w-full overflow-hidden bg-primary/90">
        {/* Carousel slides container */}
        <div className="relative w-full h-full">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Background Image overlay */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.bgUrl})` }}
              />
              {/* Hero Gradient Filter */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#002c7d]/40 to-[#002c7d]/85" />

              <div className="relative z-10 h-full flex flex-col justify-center px-4 md:px-10 max-w-[1280px] mx-auto text-white">
                <span className="font-label-sm text-label-sm bg-secondary-container/20 backdrop-blur-md px-4 py-2 rounded-full w-fit mb-6">
                  {slide.tag}
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-semibold max-w-2xl mb-6 leading-tight">
                  {slide.title}
                </h1>
                <p className="font-sans text-lg max-w-xl mb-8 opacity-90 leading-relaxed">
                  {slide.desc}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="h-11 px-8 text-sm font-semibold rounded-md shadow-lg bg-gradient-to-b from-[#078ee4] to-[#0040ad] hover:from-[#0040ad] hover:to-[#002c7d] text-white border-0 transition-all duration-300">
                    ดูตัวอย่างผลงาน
                  </Button>
                  <Button variant="outline" className="h-11 px-8 text-sm font-semibold rounded-md border-white/40 text-white hover:bg-white/10 transition-all">
                    ติดต่อปรึกษาฟรี
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                idx === currentSlide ? "bg-white ring-4 ring-white/30" : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 2: Save and verify**

---

### Task 5: Create Category Grid Component

**Files:**
- Create: `components/homepage/category-grid.tsx`

**Interfaces:**
- Produces: `<CategoryGrid />` component.

- [ ] **Step 1: Implement Category Grid**
  Create `components/homepage/category-grid.tsx` containing the grid items for aluminum profiles, safety glass, ceilings, and installation hardware.

  ```tsx
  import Link from "next/link";

  export function CategoryGrid() {
    const categories = [
      {
        title: "อลูมิเนียมเส้น",
        desc: "หลากหลายสีและขนาดมาตรฐาน",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9v3qDJdT2EZfs9G_2lfXHdn8Y8uNo5fu_7YJ9C6nN5gnqQkPbY5enVBgqS1DctovypiG0vwjhMrFGSrxY8JTfjorHX2tdlEU7_UrU6rbC9uZYu-KsAiio8qm2jjGLZgO6axaxMIgTnv1f9dWJdY_199ltZZCHUnaCCbGXR8g9tTfU5r8hbs3V4SiGZulEqG3Ii2KuhgwBL3JPpzgMe88rgPAAkLldwJI_b7za_Hc-Uj1PnQ3sHJ1y2RdQUtzTeaph8ZogLQfZFIQ",
      },
      {
        title: "กระจกนิรภัย",
        desc: "เทมเปอร์และลามิเนตมาตรฐาน มอก.",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmaZZFgNzKKOBNOMRyzrsXhi54yijFRIJJmWF6kB93t2RlBEYZOLUm6L0w8nmZnZ1vKCtid8PYZExr_zdp7XDyJRPN9hj3VXk6PC8pgSsUZ3ymfPKCRMr3buYzIBSHt2QtKdnkVPlM5-NtvB2iMadSJlzXeUihLZSI4jS3ETElC84vMVaXqZmubR47bpKfuK42mScj4oDIeeMDgZdGjL1bddnNDKNzW_VYGT0XB3AewfvbVFAQNC_ADNsmGHV4mV7LILCjoVpBRX0",
      },
      {
        title: "งานฝ้าเพดาน",
        desc: "ฝ้าทีบาร์และฝ้าฉาบเรียบครบวงจร",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFm3fnILVBkhtrnXeA37jfjQwPEBkcrzxhpMRxwRhDlRC4Jy6Gntrbm2WJoF32vekjrs88FOLevA3Vem-8ZaC5FuCSh7HdEvAN8NA5mRiDL8jVskdV1t3YGYuHJGH7adfoGE0On0z4GEVANVGju1EQhxXbTM_tsHsk-xiguSX0okNz6B4si0v5S64n3kuHe5aTwXF1GrO2T3bz_5Vw5VGbmFR_cH0zj00rrhvxxA7DUpDX5_N2qHoN6D55bLkJMIQXqVeTVyoRko0",
      },
      {
        title: "อุปกรณ์ติดตั้ง",
        desc: "ฮาร์ดแวร์และอุปกรณ์ฟิตติ้งเกรดเอ",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIKnEZjoWNH5Pufpwtgdm6_hIsZillzqJSn8tfVhrIFVOAOXZ05POj2o4-9LLBQtqkKmCJiwt90P5wlyiqS31kMQrAhR0YKV3dCHGv5VUfanXU1u37pnf9soRbjj0YeO-em-OjVOgUIY7-FP7aDafUD_AkBYHYpqDSXYvE8rbuQds6nbI6n4g-w9Y793q1KLWDXCrSFj0lqOscwNNuvehVmR2lTmRNLiicRuv2YNqbiIsyMUwq1J6-xQxd-cpmbrGRBeuIEVt6a2k",
      },
    ];

    return (
      <section className="py-12 px-4 md:px-10 max-w-[1280px] mx-auto bg-white">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-semibold text-primary mb-2">
            หมวดหมู่สินค้าของเรา
          </h2>
          <div className="w-24 h-1 bg-secondary-container mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              href="#"
              className="group relative overflow-hidden rounded-xl aspect-[4/5] shadow-blue-md block"
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: `url(${cat.imageUrl})` }}
              />
              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-6 text-white z-10">
                <h3 className="font-heading text-xl font-bold leading-normal">
                  {cat.title}
                </h3>
                <p className="text-sm opacity-85 mt-1 font-sans">
                  {cat.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 2: Save and verify**

---

### Task 6: Create Product List Component

**Files:**
- Create: `components/homepage/product-list.tsx`

**Interfaces:**
- Produces: `<ProductList />` component.

- [ ] **Step 1: Implement Product List**
  Create `components/homepage/product-list.tsx` showcasing featured items, tags (New Arrival / Hot Seller), description, pricing, and Add to Cart interactive buttons.

  ```tsx
  import { ChevronRight, ShoppingCart } from "lucide-react";
  import Image from "next/image";
  import Link from "next/link";

  export function ProductList() {
    const products = [
      {
        title: "อลูมิเนียมชุด 1.5 Series",
        desc: "อลูมิเนียมหนาพิเศษ สำหรับงานโครงการอาคารสูง ทนต่อแรงลมได้ดี",
        price: "฿ 1,250 / ตร.ม.",
        tag: "New Arrival",
        tagBg: "bg-tertiary",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO7ON0rcdGH4N6v-t5JyxhlsSmTNH-GlBmn4o5GtyzjblC7E1gYoQjChOu3Do0U_RiOkLQW5FJWh_FMx-kXwhBAu3FF534NmkOpgg8kQg_4AWy8Bq-Oe4HlrFqnPs7Z2Y9DCxcSrH8IU_TsVJrQ86ps-6xLhIkzCyVL-UyQO4FZ03wNEudHHXU63dpnKrr_C1w_ThuQxRPZ36RgT93MoeRp3kzsLdXnPVXMbrm5PFdiZdngJeMq9HJ3uMhdSABscHAOxYNnfqPc0Y",
      },
      {
        title: "กระจกเทมเปอร์ 10mm",
        desc: "กระจกนิรภัยผ่านความร้อนสูง แข็งแรงทนทานกว่ากระจกปกติ 5 เท่า",
        price: "฿ 850 / ตร.ม.",
        tag: "Hot Seller",
        tagBg: "bg-secondary",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDfTilJsRx64PVVHt0L7GM11D9M6ikv76uXiOlrlEYZbSkUmGt6JftWwIqhKFc2x8YPEGYhlxd7yp6SP4-697gzMf1ZUtahBdxYgkgHV6YW416CScKWeGRkmv3lQLCou5G586ZKZ-w-Q6n8EpwZhkmi2RO1ujvkenyRAkyMUDYec1gNKqX2p_2vA_AwdKMmWxsCKugU1YGEmSt9bNN7NDDLe_ocHD2eYNiVLhVLx6bVt8PsxQxxe30-rE4xT1fThy9B9FE0cevasow",
      },
      {
        title: "โครงคร่าวฝ้าทีบาร์",
        desc: "ระบบโครงฝ้าเพดานคุณภาพ ติดตั้งง่าย ไม่เป็นสนิม เหมาะกับงานอาคาร",
        price: "฿ 45 / เส้น",
        tag: null,
        tagBg: "",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYCB64Gd4ImWJP0o-gNGCdDsf7JakLTlNMe0PIgLmsr3Y5QH5EzG_mMsJHHlkK00P3y0yLrPXh5Jg8EksywZ9iKbKtaW8fymrbpsqSu4PG8FS_DPqQDT2m3ilIWtl5tVEQHslfZf_YlwC2I3mJaxapkx0j4JWUh8K8CYHw1M-sJAvn5q438bhbniSn0HHSMO-st_Sd0SxdFnvE-2pFfxKaghkXQfshUyZbgkdUab_teGY9sOkdAcqqJQs8X_6qE7dNh-k4O42RblQ",
      },
      {
        title: "ชุดมือจับกระจกเกรด 304",
        desc: "อุปกรณ์สแตนเลสแท้ ดีไซน์โมเดิร์น ทนทานต่อการใช้งานหนัก",
        price: "฿ 1,190 / ชุด",
        tag: null,
        tagBg: "",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0K9gYU35jEZLC0ZA8fy3ZLffsZakkcbzzN0qY8H129rJUhZNH_rLxVoPHGClV_vHXCo72QgSWbnvFzqqzLjxNRJpz2Rd564kvkSAqatly8VXBnxaAx7LmmLkBTkhXJbzPJczF1DGuHoM0rtilA6lfDmuT-9PMK1vj3J1TYIhM1iwylcwPe_OlmN8MUFIUcCdMk2DZICebz7U5JKIr64_O4-OrNWL7TI3xb7glEDn9vcjOD5UHgBLQlmSGx4AAckVW4-a7KInYJR0",
      },
    ];

    return (
      <section className="py-12 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-heading text-3xl font-semibold text-primary mb-2">
                สินค้าแนะนำ
              </h2>
              <p className="text-muted-foreground font-sans">
                สินค้าคุณภาพที่ได้รับความนิยมสูงสุดในโครงการต่างๆ
              </p>
            </div>
            <Link
              href="#"
              className="text-primary font-bold hover:underline flex items-center gap-1 font-sans text-sm"
            >
              ดูทั้งหมด <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((prod, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl overflow-hidden shadow-blue-md hover:shadow-blue-lg group transition-shadow duration-300 border border-border/50"
              >
                <div className="relative overflow-hidden aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prod.imageUrl}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {prod.tag && (
                    <span
                      className={`absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full ${prod.tagBg}`}
                    >
                      {prod.tag}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h4 className="font-heading text-lg text-primary mb-2 font-semibold">
                    {prod.title}
                  </h4>
                  <p className="text-sm text-muted-foreground font-sans line-clamp-2 mb-4 min-h-[40px]">
                    {prod.desc}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-secondary font-sans">
                      {prod.price}
                    </span>
                    <button
                      className="p-2 rounded-full border border-primary-container text-primary hover:bg-primary-container hover:text-white transition-all cursor-pointer"
                      aria-label="Add to cart"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 2: Save and verify**

---

### Task 7: Create About Us Component

**Files:**
- Create: `components/homepage/about-us.tsx`

**Interfaces:**
- Produces: `<AboutUs />` component.

- [ ] **Step 1: Implement About Us Section**
  Create `components/homepage/about-us.tsx` with standard layout grids, standard certificates list, professional installer badges, and background blur bubbles.

  ```tsx
  import { Award, Wrench } from "lucide-react";

  export function AboutUs() {
    return (
      <section className="py-16 px-4 md:px-10 max-w-[1280px] mx-auto bg-white">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Description Block */}
          <div className="order-2 lg:order-1">
            <span className="font-heading text-xs text-secondary font-bold tracking-wider mb-3 block">
              ABOUT THANA GLASS GROUP
            </span>
            <h2 className="font-heading text-3xl font-semibold text-primary mb-6 leading-tight">
              ผู้นำด้านนวัตกรรมกระจกและอลูมิเนียมที่คุณไว้วางใจ
            </h2>
            <p className="text-muted-foreground text-body-lg font-sans mb-8">
              ด้วยประสบการณ์กว่า 20 ปีในอุตสาหกรรม **Thana Glass Group** มุ่งมั่นพัฒนามาตรฐานการผลิตและงานบริการอย่างต่อเนื่อง เราเป็นพันธมิตรที่ไว้วางใจได้สำหรับสถาปนิก ผู้รับเหมา และเจ้าของบ้านทั่วประเทศ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="flex gap-4">
                <div className="bg-primary/5 p-3 rounded-lg h-fit text-primary">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-primary font-heading">มาตรฐาน มอก.</h4>
                  <p className="text-sm text-muted-foreground font-sans mt-1">
                    ผลิตภัณฑ์ทุกชิ้นผ่านการทดสอบคุณภาพระดับสากล
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary/5 p-3 rounded-lg h-fit text-primary">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-primary font-heading">ทีมติดตั้งมืออาชีพ</h4>
                  <p className="text-sm text-muted-foreground font-sans mt-1">
                    ช่างผู้ชำนาญการพร้อมหน้างานจริงทั่วไทย
                  </p>
                </div>
              </div>
            </div>

            <button className="bg-primary hover:bg-[#00174b] text-white px-10 py-4 rounded-lg font-bold transition-all shadow-md font-sans text-sm cursor-pointer">
              อ่านเพิ่มเติมเกี่ยวกับเรา
            </button>
          </div>

          {/* Picture Block */}
          <div className="order-1 lg:order-2 relative w-full">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl pointer-events-none" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoOSXll4ceaL7B3u_T-YeLfaQGcVHGpJrpnazlPTofotMFZUyxVKy5P8TA4c9LEa3S_ccuxAmbl_VPyY0n-9i3Ur_q-Zmn_xAUCraU0Gng3jvPvuAmVCXAJ5gHtlIZ4YVrIXnrGp93_gDBrzaRpBrI0DYDGIRJfYpWOHkNovQYgCVusy34czuM5y2MArKZ5WE-JW4_3g468cnmVkwriHXWuUDn4Ij8Spj-Ax1Ftzd5P0CGpMIqwsFa15XVfTSmjdp_IuetFTPaj0g"
              alt="Thana Glass fabrication factory warehouse"
              className="rounded-2xl shadow-blue-lg relative z-10 w-full object-cover h-[450px]"
            />
          </div>
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 2: Save and verify**

---

### Task 8: Create CTA Section Component

**Files:**
- Create: `components/homepage/cta-section.tsx`

**Interfaces:**
- Produces: `<CtaSection />` component.

- [ ] **Step 1: Implement CTA Banner**
  Create `components/homepage/cta-section.tsx` using full container structures, background dot patterns, responsive CTA columns, and icons.

  ```tsx
  import { Phone, MessageCircle } from "lucide-react";

  export function CtaSection() {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="bg-primary-container rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-lg">
            {/* Dot Pattern Background Overlay */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "40px 40px"
              }}
            />
            
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 relative z-10 leading-tight">
              เริ่มโครงการของคุณกับเราวันนี้
            </h2>
            <p className="font-sans text-base md:text-lg max-w-2xl mx-auto mb-10 opacity-90 relative z-10 leading-relaxed">
              ปรึกษาเรื่องสเปคสินค้า การออกแบบ และประเมินราคาฟรี โดยทีมงานผู้เชี่ยวชาญด้านกระจกและอลูมิเนียมโดยเฉพาะ
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <a
                id="cta-tel-link"
                href="tel:076381444"
                className="bg-white text-primary px-8 py-4 rounded-lg font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 font-sans text-sm shadow-md"
              >
                <Phone className="h-4 w-4" /> โทรหาเราเลย
              </a>
              <a
                id="cta-line-link"
                href="https://line.me"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 font-sans text-sm"
              >
                <MessageCircle className="h-4 w-4" /> ติดต่อผ่าน LINE
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 2: Save and verify**

---

### Task 9: Update app/page.tsx & Build Verification

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace Page content with layout components**
  Modify `app/page.tsx` to render the header, hero slider, category grid, product list, about us, CTA, footer, and float contact FAB.

  ```tsx
  import { Header } from "@/components/layout/header";
  import { Hero } from "@/components/homepage/hero";
  import { CategoryGrid } from "@/components/homepage/category-grid";
  import { ProductList } from "@/components/homepage/product-list";
  import { AboutUs } from "@/components/homepage/about-us";
  import { CtaSection } from "@/components/homepage/cta-section";
  import { Footer } from "@/components/layout/footer";
  import { ContactFab } from "@/components/ui/contact-fab";

  export default function Home() {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        
        {/* Main Content Spacer to adjust for fixed Header height */}
        <main className="flex-1 pt-[72px] md:pt-[80px]">
          <Hero />
          <CategoryGrid />
          <ProductList />
          <AboutUs />
          <CtaSection />
        </main>

        <Footer />
        <ContactFab />
      </div>
    );
  }
  ```

- [ ] **Step 2: Build verification**
  Run: `npm run build` in the workspace to verify there are no compilation or typescript errors.
