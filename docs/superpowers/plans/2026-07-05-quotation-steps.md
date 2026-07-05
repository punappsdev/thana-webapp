# Homepage Quotation Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a responsive 5-step quotation process diagram above the About Us section on the homepage, utilizing localized translations and the existing design system.

**Architecture:** Create a new React component `<QuotationSteps />` and insert it into `app/[locale]/page.tsx`. Keep translation strings inside `th.json` and `en.json` under `QuotationSteps`.

**Tech Stack:** React, TypeScript, Tailwind CSS (v4), `next-intl`, `lucide-react`.

## Global Constraints
- Target layout matches "Horizontal Flow" (A) where steps are horizontal on desktop with connectors, and stack vertically on mobile.
- Use colors and typography from `DESIGN.md`: Prompt for headings, Noto Sans Thai for body, brand blues (#002c7d, #0040ad, #3ca6fe).

---

### Task 1: Add Translations

**Files:**
- Modify: [th.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/th.json)
- Modify: [en.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/en.json)

**Interfaces:**
- Consumes: None
- Produces: `QuotationSteps` translations namespace

- [ ] **Step 1: Add Thai translations for the QuotationSteps namespace**
Add the translation object to `messages/th.json` before the closing bracket.
```json
  "QuotationSteps": {
    "title": "ขั้นตอนการขอใบเสนอราคา",
    "steps": [
      {
        "title": "เลือกสินค้า",
        "desc": "เลือกสินค้าที่คุณต้องการแล้วกดปุ่มขอใบเสนอราคา"
      },
      {
        "title": "ตรวจสอบตะกร้า",
        "desc": "ตรวจสอบรายการสินค้าในตะกร้าใบเสนอราคา"
      },
      {
        "title": "กรอกข้อมูลผู้ติดต่อ",
        "desc": "ระบุรายละเอียดผู้ติดต่อและสถานที่จัดส่ง"
      },
      {
        "title": "ตรวจสอบและยืนยัน",
        "desc": "ตรวจสอบข้อมูลทั้งหมดเพื่อความถูกต้องก่อนยืนยัน"
      },
      {
        "title": "รอรับใบเสนอราคา",
        "desc": "ทางเราจะจัดส่งใบเสนอราคาให้ทาง LINE และ Gmail"
      }
    ]
  }
```

- [ ] **Step 2: Add English translations for the QuotationSteps namespace**
Add the translation object to `messages/en.json` before the closing bracket.
```json
  "QuotationSteps": {
    "title": "Steps to Request a Quotation",
    "steps": [
      {
        "title": "Select Products",
        "desc": "Choose the products you want and add to quote cart"
      },
      {
        "title": "Check Quotation Cart",
        "desc": "Review the items in your quotation cart"
      },
      {
        "title": "Fill Contact Info",
        "desc": "Enter contact details and delivery details"
      },
      {
        "title": "Review & Confirm",
        "desc": "Review all information and confirm your request"
      },
      {
        "title": "Receive Quote",
        "desc": "Wait for the quotation via LINE and Gmail"
      }
    ]
  }
```

---

### Task 2: Build the Quotation Steps Component

**Files:**
- Create: [quotation-steps.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/homepage/quotation-steps.tsx)

**Interfaces:**
- Consumes: `next-intl` localization
- Produces: `<QuotationSteps />` React component

- [ ] **Step 1: Write the React component with responsive design**
Create the component at `components/homepage/quotation-steps.tsx`. Ensure premium visual touches:
- A title with a colored underline accent.
- Responsive grids: `flex flex-col md:flex-row` for steps with arrow connectors.
- Custom SVG for LINE logo and a combination icon for LINE + Gmail.
- Circle styling with soft blue shadow (`shadow-[0_10px_30px_-10px_rgba(0,64,173,0.15)]`).

```tsx
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
              <div className="flex-1 flex flex-col items-center text-center max-w-[180px]">
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
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#ba1a1a] text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-background shadow-sm animate-pulse">
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
```

---

### Task 3: Integrate onto Homepage

**Files:**
- Modify: [page.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/%5Blocale%5D/page.tsx:1-29)

**Interfaces:**
- Consumes: `<QuotationSteps />` from `@/components/homepage/quotation-steps`
- Produces: Updated layout with Quotation Steps positioned above AboutUs.

- [ ] **Step 1: Import and add the QuotationSteps component**
Modify `app/[locale]/page.tsx` to import the component and render it.

```tsx
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/homepage/hero";
import { CategoryGrid } from "@/components/homepage/category-grid";
import { ProductList } from "@/components/homepage/product-list";
import { QuotationSteps } from "@/components/homepage/quotation-steps";
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
        <QuotationSteps />
        <AboutUs />
        <CtaSection />
      </main>

      <Footer />
      <ContactFab />
    </div>
  );
}
```

---

### Task 4: Verify Compilation & Styles

**Files:**
- None

- [ ] **Step 1: Test production build**
Run: `npm run build`
Expected: Successfully compiles with no TypeScript, Next.js, or linting errors.

- [ ] **Step 2: Commit changes**
Ask user for permission first. If granted:
Run: `git add .` and `git commit -m "feat: add Quotation Steps workflow section to homepage"`
