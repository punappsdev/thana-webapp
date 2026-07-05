# Contact Us Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a responsive, bilingual (TH/EN) Contact Us page with 3 interactive branch cards and a dynamically-updating Google Maps display, adhering to the design specifications.

**Architecture:** Use App Router route nested under `app/[locale]/contact/page.tsx` that coordinates page layout. Clicking on a branch card or its action button updates the `activeBranch` state, which changes the URL loaded in the Google Map iframe.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, next-intl.

## Global Constraints
- Naming & copy: follow the keys in the localization files `th.json` and `en.json`.
- Icons: Always prioritize icons from `lucide-react`, never use emojis as icons.
- Coding style: Preserve existing comments and style tokens from `DESIGN.md`.

---

### Task 1: Update Localization Messages

**Files:**
- Modify: [en.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/en.json)
- Modify: [th.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/th.json)

**Interfaces:**
- Produces: `"ContactPage"` key-value tree in translation dictionaries.

- [ ] **Step 1: Add EN Translations to messages/en.json**
  Update [en.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/en.json) by adding a `"ContactPage"` node at the root.
  ```json
  "ContactPage": {
    "title": "Contact Us",
    "subtitle": "Get in touch with our branches and view locations",
    "viewMap": "View Map",
    "branches": [
      {
        "name": "Thana Glass Aluminum Co., Ltd. (Headquarters)",
        "address": "46/9 Moo 6, Chalong, Mueang Phuket, Phuket 83130",
        "phone": "076-381444, 076-381356-7",
        "mobile": "088-7652642",
        "email": "info@thana-glass.com",
        "line": "@thanaglass",
        "mapUrl": "https://maps.google.com/maps?q=46/9%20Moo%206%20Chalong%20Mueang%20Phuket%20Phuket%2083130&t=&z=16&ie=UTF8&iwloc=&output=embed"
      },
      {
        "name": "Thana Glass Aluminum Co., Ltd. (Branch 000001)",
        "address": "36 Moo 4, Chalong, Mueang Phuket, Phuket 83130",
        "phone": "076-381444",
        "mobile": "088-7652642",
        "email": "info@thana-glass.com",
        "line": "@thanaglass",
        "mapUrl": "https://maps.google.com/maps?q=36%20Moo%204%20Chalong%20Mueang%20Phuket%20Phuket%2083130&t=&z=16&ie=UTF8&iwloc=&output=embed"
      },
      {
        "name": "Thana Glass Thalang Co., Ltd.",
        "address": "168 Moo 7, Thep Krasattri, Thalang, Phuket 83110",
        "phone": "076-311222",
        "mobile": "088-7652642",
        "email": "info@thanathalang.com",
        "line": "@thanathalang",
        "mapUrl": "https://maps.google.com/maps?q=168%20Moo%207%20Thep%20Krasattri%20Thalang%20Phuket%20Phuket%2083110&t=&z=16&ie=UTF8&iwloc=&output=embed"
      }
    ]
  }
  ```

- [ ] **Step 2: Add TH Translations to messages/th.json**
  Update [th.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/th.json) by adding a `"ContactPage"` node at the root.
  ```json
  "ContactPage": {
    "title": "ติดต่อเรา",
    "subtitle": "ศูนย์บริการและจัดจำหน่ายกระจก-อลูมิเนียมครบวงจรในภูเก็ต",
    "viewMap": "ดูแผนที่",
    "branches": [
      {
        "name": "บริษัท ธนา กลาส อลูมิเนียม จำกัด (สำนักงานใหญ่)",
        "address": "ที่อยู่ 46/9 ม.6 ต.ฉลอง อ.เมือง จ.ภูเก็ต 83130",
        "phone": "076-381444, 076-381356-7",
        "mobile": "088-7652642",
        "email": "info@thana-glass.com",
        "line": "@thanaglass",
        "mapUrl": "https://maps.google.com/maps?q=46/9%20%E0%B8%A1.6%20%E0%B8%95.%E0%B8%82%E0%B8%A5%E0%B8%AD%E0%B8%87%20%E0%B8%AD.%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87%20%E0%B8%87.%E0%B8%A0%E0%B8%B9%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%95%2083130&t=&z=16&ie=UTF8&iwloc=&output=embed"
      },
      {
        "name": "บริษัท ธนา กลาส อลูมินั่ม จำกัด สาขา000001",
        "address": "ที่อยู่ 36 ม.4 ต.ฉลอง อ.เมือง จ.ภูเก็ต 83130",
        "phone": "076-381444",
        "mobile": "088-7652642",
        "email": "info@thana-glass.com",
        "line": "@thanaglass",
        "mapUrl": "https://maps.google.com/maps?q=36%20%E0%B8%A1.4%20%E0%B8%95.%E0%B8%82%E0%B8%A5%E0%B8%AD%E0%B8%87%20%E0%B8%AD.%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87%20%E0%B8%87.%E0%B8%A0%E0%B8%B9%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%95%2083130&t=&z=16&ie=UTF8&iwloc=&output=embed"
      },
      {
        "name": "บริษัท ธนา กลาส ถลาง จำกัด",
        "address": "ที่อยู่ 168 ม.7 ต.เทพกระษัตรี อ.ถลาง จ.ภูเก็ต 83110",
        "phone": "076-311222",
        "mobile": "088-7652642",
        "email": "info@thanathalang.com",
        "line": "@thanathalang",
        "mapUrl": "https://maps.google.com/maps?q=168%20%E0%B8%A1.7%20%E0%B8%95.%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%85%E0%B8%A3%E0%B8%B0%E0%B8%A9%E0%B8%B1%E0%B8%95%E0%B8%A3%E0%B8%B5%20%E0%B8%AD.%E0%B8%96%E0%B8%A5%E0%B8%B2%E0%B8%87%20%E0%B8%87.%E0%B8%A0%E0%B8%B9%E0%B9%80%E0%B8%81%E0%B9%87%E0%B8%95%2083110&t=&z=16&ie=UTF8&iwloc=&output=embed"
      }
    ]
  }
  ```

- [ ] **Step 3: Verification of JSON files**
  Verify the files parse as correct JSON syntax using a standard build/lint check.

---

### Task 2: Link Header and Footer Navigation

**Files:**
- Modify: [header.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/layout/header.tsx)
- Modify: [footer.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/layout/footer.tsx)

**Interfaces:**
- Updates "Contact Us" navigation link destination from `#` to `/contact`.
- Updates navigation links list map in `header.tsx` to handle active states dynamically using `pathname`.

- [ ] **Step 1: Update navigation links in Header**
  Modify [header.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/layout/header.tsx#L29-L38) to update links and calculate the active state:
  ```typescript
  const navLinks = [
    { label: t("nav.home"), href: "/", active: pathname === "/" },
    { label: t("nav.products"), href: "#" },
    { label: t("nav.news"), href: "#" },
    { label: t("nav.projects"), href: "#" },
    { label: t("nav.articles"), href: "#" },
    { label: t("nav.aboutUs"), href: "#" },
    { label: t("nav.contactUs"), href: "/contact", active: pathname === "/contact" },
  ];
  ```

- [ ] **Step 2: Update footer navigation**
  Modify [footer.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/layout/footer.tsx) to point "Contact Us" heading or footer links to `/contact` if applicable.

- [ ] **Step 3: Test routing interaction**
  Check that the header link points to `/contact`.

---

### Task 3: Create the Interactive Contact Page Component

**Files:**
- Create: `app/[locale]/contact/page.tsx`

**Interfaces:**
- Produces a Next.js App Router Page component that coordinates page layout, fetches translations, and manages interactive map state.

- [ ] **Step 1: Implement the Contact Page File**
  Create the folder `app/[locale]/contact` and write `page.tsx` with the following content:
  ```tsx
  "use client";

  import { useState } from "react";
  import { useTranslations } from "next-intl";
  import { Header } from "@/components/layout/header";
  import { Footer } from "@/components/layout/footer";
  import { ContactFab } from "@/components/ui/contact-fab";
  import { Phone, Mail, MessageSquare, MapPin } from "lucide-react";
  import Image from "next/image";

  interface Branch {
    name: string;
    address: string;
    phone: string;
    mobile: string;
    email: string;
    line: string;
    mapUrl: string;
  }

  export default function ContactPage() {
    const t = useTranslations("ContactPage");
    
    // Retrieve translations arrays
    const branches = t.raw("branches") as Branch[];
    const [activeIdx, setActiveIdx] = useState(0);

    const activeBranch = branches[activeIdx];

    // Style schemes for branch cards to match the user's mockup shades
    const cardBgStyles = [
      "from-[#e0f2fe] to-[#bae6fd]", // Card 1: Soft Sky Blue
      "from-[#dbeafe] to-[#bfdbfe]", // Card 2: Light Blue
      "from-[#eff6ff] to-[#dbe1ff]", // Card 3: Ocean/Azure Slate
    ];

    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />

        <main className="flex-1 pt-[72px] md:pt-[80px]">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-primary to-[#0040ad] py-12 md:py-16 text-center text-white relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "32px 32px"
              }}
            />
            <div className="max-w-[1280px] mx-auto px-4 md:px-10 relative z-10">
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                {t("title")}
              </h1>
              <p className="font-sans text-base md:text-lg max-w-2xl mx-auto opacity-90 font-light">
                {t("subtitle")}
              </p>
            </div>
          </section>

          {/* Contact Section Grid */}
          <section className="py-12 md:py-16 bg-[#faf8ff]">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Panel: Branch Cards */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {branches.map((branch, idx) => {
                    const isActive = activeIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveIdx(idx)}
                        className={`cursor-pointer rounded-2xl p-6 bg-gradient-to-r ${cardBgStyles[idx]} border transition-all duration-300 relative shadow-sm hover:shadow-md ${
                          isActive 
                            ? "border-primary scale-[1.02] ring-2 ring-primary/20 shadow-blue-md" 
                            : "border-outline-variant hover:scale-[1.01]"
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Logo Placeholder Box */}
                          <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border/50">
                            {/* Visual Logo Placeholder */}
                            <Image
                              src="/main-logo-icon-tp.png"
                              alt="Thana Logo"
                              width={60}
                              height={60}
                              className="h-14 w-14 object-contain opacity-75"
                            />
                          </div>

                          {/* Branch Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-heading text-base md:text-lg font-semibold text-primary mb-2 leading-tight">
                              {branch.name}
                            </h3>
                            <p className="font-sans text-xs md:text-sm text-foreground/80 mb-4 leading-relaxed flex items-start gap-1">
                              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                              <span>{branch.address}</span>
                            </p>

                            {/* Contact Links Row */}
                            <div className="flex flex-wrap gap-2.5 mb-4">
                              {/* LINE */}
                              <a
                                href={`https://line.me/R/ti/p/~${branch.line}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 rounded-full bg-white text-[#06C755] flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                                title="LINE"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                                  <path d="M22 10.364c0-4.577-4.486-8.364-10-8.364s-10 3.787-10 8.364c0 4.1 3.568 7.525 8.389 8.217l-1.602 3.19c-.09.18.016.398.21.332l4.802-1.644c5.093-.244 8.201-3.647 8.201-8.455" />
                                </svg>
                              </a>

                              {/* Phone */}
                              <a
                                href={`tel:${branch.phone.split(",")[0].trim()}`}
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                                title="Phone"
                              >
                                <Phone className="h-4 w-4" />
                              </a>

                              {/* Email */}
                              <a
                                href={`mailto:${branch.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                                title="Email"
                              >
                                <Mail className="h-4 w-4" />
                              </a>

                              {/* Map Pin Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveIdx(idx);
                                }}
                                className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                                title="Pin Location"
                              >
                                <MapPin className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card bottom Map Trigger Button */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveIdx(idx);
                            }}
                            className="bg-[#0091e6] hover:bg-[#007cc4] active:scale-95 text-white px-5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 font-heading"
                          >
                            <MapPin className="h-3 w-3" />
                            {t("viewMap")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Panel: Sticky Dynamic Google Map */}
                <div className="lg:col-span-7 lg:sticky lg:top-24">
                  <div className="bg-white rounded-3xl p-4 border border-[#c4e2f5]/80 shadow-blue-lg backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <h4 className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {activeBranch.name}
                      </h4>
                    </div>

                    <div className="relative aspect-video lg:aspect-[4/3] w-full rounded-2xl overflow-hidden border border-border bg-slate-100">
                      <iframe
                        src={activeBranch.mapUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={activeBranch.name}
                        className="absolute inset-0"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        </main>

        <Footer />
        <ContactFab />
      </div>
    );
  }
  ```

- [ ] **Step 2: Verify component compiles**
  Test that page mounts correctly.

---

### Task 4: Compilation and Build verification

- [ ] **Step 1: Check typescript compile**
  Run: `npm run build` or `npx tsc --noEmit`
  Expected: Successfully builds without TypeScript errors.
