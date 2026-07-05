# About Us (เกี่ยวกับเรา) Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a responsive and modern "About Us" page in Thai and English, following the Crystalline Grid Layout style, and link it in the header.

**Architecture:** A server component page under `app/[locale]/about/page.tsx` utilizing `next-intl` for translations, reusing global Layout components (`Header`, `Footer`, `ContactFab`).

**Tech Stack:** Next.js App Router, TailwindCSS, next-intl, Lucide React icons.

## Global Constraints

* Do NOT automatically commit changes to git. Stage files for user review instead.
* Naming conventions: Use Tailwind classes and custom font variables defined in `DESIGN.md` (e.g., `font-prompt` and `font-noto-sans-thai`).
* Color scheme matching `DESIGN.md` (primary: `#002c7d` or `bg-primary`, outline/light border: `#c4e2f5`).

---

### Task 1: Add Translations for About Page

**Files:**
- Modify: `messages/th.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: None
- Produces: `AboutPage` translation namespaces in Thai and English.

- [ ] **Step 1: Edit `messages/th.json`**
  Add the following `"AboutPage"` JSON block at the bottom of `messages/th.json` (just before the final closing brace):
  ```json
  ,
  "AboutPage": {
    "title": "เกี่ยวกับเรา",
    "groupTitle": "กลุ่มบริษัท ธนา กลาส",
    "groupDesc1": "เป็นหนึ่งในผู้นำด้านวัสดุก่อสร้างในจังหวัดภูเก็ต โดยดำเนินธุรกิจทั้งในด้านการจำหน่าย อลูมิเนียม กระจก งานฝ้าเพดาน และอุปกรณ์ติดตั้งต่างๆ รวมทั้งยังมี โรงงานแปรรูปกระจก ที่ได้มาตรฐานรองรับงานผลิตคุณภาพสูงอย่างครบวงจร",
    "groupDesc2": "เราคัดสรรสินค้าที่มีคุณภาพดีมีมาตรฐานพร้อมให้บริการด้วยความซื่อสัตย์และจริงใจ ทีมงานของเรายินดีให้คำแนะนำและดูแลลูกค้าทุกท่านด้วยความเป็นกันเอง เพื่อให้ทุกงานติดตั้งเป็นไปอย่างราบรื่น และตอบโจทย์ความต้องการของลูกค้าอย่างแท้จริง",
    "branches": [
      {
        "name": "บริษัท ธนา กลาส อลูมิเนิ่ม จำกัด (สำนักงานใหญ่)",
        "desc": "เป็นคลังวัสดุก่อสร้างขนาดใหญ่แห่งหนึ่งในจังหวัดภูเก็ต ที่ให้บริการด้านการจำหน่ายอลูมิเนียม กระจก งานฝ้าเพดาน และอุปกรณ์ติดตั้งครบวงจร โดยมุ่งเน้นสินค้าที่มีคุณภาพได้มาตรฐาน"
      },
      {
        "name": "บริษัท ธนา กลาส อลูมิเนิ่ม จำกัด (สาขา 00001)",
        "desc": "คือโรงงานแปรรูปกระจกที่ดำเนินงานอย่างครบวงจร ภายใต้สโลแกน \"Quality is remembered long - ผลิตกระจกนิรภัยด้วยคุณภาพให้เป็นที่จดจำตลอดไป\""
      },
      {
        "name": "บริษัท ธนา กลาส ถลาง จำกัด",
        "desc": "คลังวัสดุก่อสร้างครบวงจรในพื้นที่อำเภอถลาง จังหวัดภูเก็ต ให้บริการด้าน การจำหน่ายอลูมิเนียม กระจก ฝ้าเพดาน และอุปกรณ์ติดตั้งต่าง ๆ"
      }
    ]
  }
  ```

- [ ] **Step 2: Edit `messages/en.json`**
  Add the following `"AboutPage"` JSON block at the bottom of `messages/en.json` (just before the final closing brace):
  ```json
  ,
  "AboutPage": {
    "title": "About Us",
    "groupTitle": "Thana Glass Group",
    "groupDesc1": "One of the leading construction material providers in Phuket, operating in the distribution of aluminum, glass, ceiling works, and installation equipment, as well as a comprehensive glass processing factory that meets high manufacturing standards.",
    "groupDesc2": "We select standard, high-quality products and provide services with honesty and integrity. Our team is pleased to advise and take care of all clients in a friendly manner, ensuring smooth installations that truly satisfy customer needs.",
    "branches": [
      {
        "name": "Thana Glass Aluminum Co., Ltd. (Headquarters)",
        "desc": "A large construction materials warehouse in Phuket, providing distribution of aluminum, glass, ceiling works, and comprehensive installation accessories, focusing on standard high-quality products."
      },
      {
        "name": "Thana Glass Aluminum Co., Ltd. (Branch 00001)",
        "desc": "A fully integrated glass processing factory, operating under the slogan \"Quality is remembered long - producing safety glass with quality to be remembered forever.\""
      },
      {
        "name": "Thana Glass Thalang Co., Ltd.",
        "desc": "A complete construction materials warehouse in the Thalang District of Phuket, providing distribution of aluminum, glass, ceiling, and various installation hardware."
      }
    ]
  }
  ```

- [ ] **Step 3: Validate JSON formatting**
  Verify both files parse correctly. Stage the files.

---

### Task 2: Update Header Navigation Link

**Files:**
- Modify: `components/layout/header.tsx`

**Interfaces:**
- Consumes: None
- Produces: Header navigation links linking to `/about`.

- [ ] **Step 1: Modify navigation items array in `components/layout/header.tsx`**
  Locate `navLinks` definition:
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
  Replace it with:
  ```typescript
    const navLinks = [
      { label: t("nav.home"), href: "/", active: pathname === "/" },
      { label: t("nav.products"), href: "#" },
      { label: t("nav.news"), href: "#" },
      { label: t("nav.projects"), href: "#" },
      { label: t("nav.articles"), href: "#" },
      { label: t("nav.aboutUs"), href: "/about", active: pathname === "/about" },
      { label: t("nav.contactUs"), href: "/contact", active: pathname === "/contact" },
    ];
  ```

- [ ] **Step 2: Verify compile & stage changes**
  Check that the project compiles without errors. Stage `components/layout/header.tsx`.

---

### Task 3: Create About Us Page Component

**Files:**
- Create: `app/[locale]/about/page.tsx`

**Interfaces:**
- Consumes: `AboutPage` translations from localization files.
- Produces: Visual "/about" page.

- [ ] **Step 1: Create the code for `app/[locale]/about/page.tsx`**
  Implement the structure layout using `next-intl` (using hooks) and Next.js elements:
  - Heading divider line.
  - Two-column section for group history (Left: Square `/main-logo.png` image on a dark blue `#002c7d` or `#001d35` box; Right: Title & Descriptions).
  - 3-column responsive cards section showing details of three branches with smooth hover effects.
  
  ```tsx
  import { useTranslations } from "next-intl";
  import { Header } from "@/components/layout/header";
  import { Footer } from "@/components/layout/footer";
  import { ContactFab } from "@/components/ui/contact-fab";
  import Image from "next/image";

  interface Branch {
    name: string;
    desc: string;
  }

  export default function AboutPage() {
    const t = useTranslations("AboutPage");
    const branches = t.raw("branches") as Branch[];

    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />

        <main className="flex-1 pt-[72px] md:pt-[80px]">
          {/* Section Header Divider */}
          <div className="max-w-[1280px] mx-auto px-4 md:px-10 mt-8 md:mt-12">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-primary/20" />
              <h1 className="font-prompt text-2xl md:text-3xl font-semibold text-primary text-center whitespace-nowrap">
                {t("title")}
              </h1>
              <div className="flex-1 h-[1px] bg-primary/20" />
            </div>
          </div>

          {/* Group Overview Section */}
          <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12">
            <div className="bg-[#f8fafc] rounded-2xl border border-[#c4e2f5]/60 p-6 md:p-10 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left side: Logo Block */}
                <div className="lg:col-span-4 flex justify-center">
                  <div className="relative w-64 h-64 md:w-72 md:h-72 bg-[#001d35] rounded-2xl flex flex-col items-center justify-center p-6 shadow-lg border border-primary-container/20 overflow-hidden">
                    {/* Decorative reflection element */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 pointer-events-none" />
                    
                    <Image
                      src="/main-logo-tp.png"
                      alt="Thana Glass Group Logo"
                      width={220}
                      height={150}
                      className="w-full h-auto object-contain brightness-0 invert"
                      priority
                    />
                  </div>
                </div>

                {/* Right side: Text Block */}
                <div className="lg:col-span-8 flex flex-col gap-5">
                  <h2 className="font-prompt text-2xl md:text-3xl font-bold text-primary">
                    {t("groupTitle")}
                  </h2>
                  <p className="font-noto-sans-thai text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("groupDesc1")}
                  </p>
                  <p className="font-noto-sans-thai text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("groupDesc2")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Subsidiaries Grid Section */}
          <section className="max-w-[1280px] mx-auto px-4 md:px-10 pb-16 md:pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {branches.map((branch, idx) => (
                <div
                  key={idx}
                  className="group bg-white rounded-2xl border border-[#c4e2f5] p-6 md:p-8 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
                  style={{ boxShadow: "0 4px 20px -2px rgba(0, 64, 173, 0.04)" }}
                >
                  <div>
                    {/* Visual Card Accent */}
                    <div className="w-10 h-10 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary font-bold mb-5 font-prompt">
                      {idx + 1}
                    </div>
                    <h3 className="font-prompt text-lg md:text-xl font-bold text-primary mb-4 leading-snug group-hover:text-primary-container transition-colors">
                      {branch.name}
                    </h3>
                    <p className="font-noto-sans-thai text-sm md:text-base text-muted-foreground leading-relaxed">
                      {branch.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
        <ContactFab />
      </div>
    );
  }
  ```

- [ ] **Step 2: Build checking**
  Verify the page builds correctly and has no TypeScript or Next.js errors. Stage the page file.
