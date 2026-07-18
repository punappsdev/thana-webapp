# Database Categories Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fetch real category records from the database on the homepage, display custom AI-generated cover images for each of the 6 categories, and update navigation to filter the product list by category.

**Architecture:** Convert `CategoryGrid` to a Next.js Server Component, use `prisma.category.findMany` to query records directly, map name/description using localizations, and adjust grid layout dynamically to display 6 columns.

**Tech Stack:** Next.js (Server Components), Prisma ORM, Tailwind CSS, lucide-react.

## Global Constraints
- **Do NOT use raw Tailwind text-*** classes (e.g., `text-lg`, `text-2xl`, `text-3xl`). Use utility classes from [globals.css](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/globals.css) (such as `font-headline-sm`, `font-label-sm`).
- Do NOT automatically commit changes to git. Always wait for explicit user approval before committing.
- Ensure files use the correct TypeScript imports and absolute or relative module mappings.

---

### Task 1: Generate Mock Image Assets

**Files:**
- Create: `C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories` (Directory)
- Create: `C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\general-glass.jpg`
- Create: `C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\decorative-glass.jpg`
- Create: `C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\safety-glass.jpg`
- Create: `C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\gypsum.jpg`
- Create: `C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\aluminum.jpg`
- Create: `C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\hardware-store.jpg`

- [ ] **Step 1: Generate 6 high-quality images via AI**
  Use `generate_image` tool with the following prompts:
  1. ImageName: `general_glass`
     Prompt: "A professional high-end photograph of a stack of clean clear float glass panels in a modern architectural workshop, soft studio lighting, cool tones, premium architectural photography style."
  2. ImageName: `decorative_glass`
     Prompt: "A luxury architectural photo of frosted, patterned, and sandblasted glass dividers inside a high-end corporate office, showing privacy while letting light through, soft blurred reflections, premium blue-grey tones."
  3. ImageName: `safety_glass`
     Prompt: "A premium safety glass close-up, tempered glass panel with beautiful seamed and polished edges, showing modern engineering quality, elegant sunlight refraction, architectural detail."
  4. ImageName: `gypsum`
     Prompt: "Modern minimal interior partition walls and ceiling plasterboard installation showing precise framing, clean white gypsum board surfaces, architectural work in progress, light airy feel."
  5. ImageName: `aluminum`
     Prompt: "Sleek modern slim line aluminum window and door frames, black powder coated and anodized silver finishes, crystalline glass views, minimalist high-end residential design."
  6. ImageName: `hardware_store`
     Prompt: "Close-up of premium grade 304 stainless steel glass door handles and mounting fixtures, modern lock fittings on glass panels, luxury chrome and matte black finishes."

- [ ] **Step 2: Create directory & copy images**
  Create the target directory:
  Run: `powershell -Command "New-Item -ItemType Directory -Force -Path C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories"`
  Copy the generated files from `C:\Users\PC\.gemini\antigravity-ide\brain\f52110bb-0a8d-4bc6-960a-72f678492e71` to `C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories/`.
  Run:
  ```powershell
  Copy-Item "C:\Users\PC\.gemini\antigravity-ide\brain\f52110bb-0a8d-4bc6-960a-72f678492e71\general_glass.png" "C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\general-glass.jpg" -Force
  Copy-Item "C:\Users\PC\.gemini\antigravity-ide\brain\f52110bb-0a8d-4bc6-960a-72f678492e71\decorative_glass.png" "C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\decorative-glass.jpg" -Force
  Copy-Item "C:\Users\PC\.gemini\antigravity-ide\brain\f52110bb-0a8d-4bc6-960a-72f678492e71\safety_glass.png" "C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\safety-glass.jpg" -Force
  Copy-Item "C:\Users\PC\.gemini\antigravity-ide\brain\f52110bb-0a8d-4bc6-960a-72f678492e71\gypsum.png" "C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\gypsum.jpg" -Force
  Copy-Item "C:\Users\PC\.gemini\antigravity-ide\brain\f52110bb-0a8d-4bc6-960a-72f678492e71\aluminum.png" "C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\aluminum.jpg" -Force
  Copy-Item "C:\Users\PC\.gemini\antigravity-ide\brain\f52110bb-0a8d-4bc6-960a-72f678492e71\hardware_store.png" "C:\Users\PC\Documents\Files\Projects\thana\local_uploads\categories\hardware-store.jpg" -Force
  ```
  Expected Output: Files successfully copied.

---

### Task 2: Update Prisma Seed script

**Files:**
- Modify: `prisma/seed.ts:87-166`

- [ ] **Step 1: Modify `prisma/seed.ts` to assign `coverImage` properties to categoryData**
  Update the `categoryData` array to include the new mock file paths.
  Code update:
  ```typescript
  const categoryData = [
    {
      slug: "general-glass",
      nameTh: "กระจกทั่วไป",
      nameEn: "General Glass",
      descriptionTh: "กระจกใส กระจกสี และกระจกเงาสำหรับงานทั่วไป",
      descriptionEn: "Clear, tinted, and mirror glass for general applications.",
      coverImage: "/api/uploads/categories/general-glass.jpg",
      sortOrder: 1,
      subs: [
        { slug: "clear-float", nameTh: "กระจกใสโฟลต", nameEn: "Clear Float Glass" },
        { slug: "tinted", nameTh: "กระจกสีตัดแสง", nameEn: "Tinted Glass" },
        { slug: "mirror", nameTh: "กระจกเงา", nameEn: "Mirror" },
      ],
    },
    {
      slug: "decorative-glass",
      nameTh: "กระจกตกแต่ง",
      nameEn: "Decorative Glass",
      descriptionTh: "กระจกลาย กระจกฝ้า และกระจกพ่นทรายสำหรับงานตกแต่ง",
      descriptionEn: "Patterned, frosted, and sandblasted glass for interior design.",
      coverImage: "/api/uploads/categories/decorative-glass.jpg",
      sortOrder: 2,
      subs: [
        { slug: "patterned", nameTh: "กระจกลาย", nameEn: "Patterned Glass" },
        { slug: "frosted", nameTh: "กระจกฝ้า", nameEn: "Frosted Glass" },
        { slug: "sandblasted", nameTh: "กระจกพ่นทราย", nameEn: "Sandblasted Glass" },
      ],
    },
    {
      slug: "safety-glass",
      nameTh: "กระจกนิรภัย",
      nameEn: "Safety Glass",
      descriptionTh: "กระจกเทมเปอร์และกระจกลามิเนตที่ผ่านมาตรฐานความปลอดภัย",
      descriptionEn: "Tempered and laminated glass certified for safety applications.",
      coverImage: "/api/uploads/categories/safety-glass.jpg",
      sortOrder: 3,
      subs: [
        { slug: "tempered", nameTh: "กระจกเทมเปอร์", nameEn: "Tempered Glass" },
        { slug: "laminated", nameTh: "กระจกลามิเนต", nameEn: "Laminated Glass" },
        { slug: "insulated", nameTh: "กระจกฉนวนสองชั้น", nameEn: "Insulated Glass" },
      ],
    },
    {
      slug: "gypsum",
      nameTh: "ยิปซั่ม",
      nameEn: "Gypsum",
      descriptionTh: "แผ่นยิปซั่มและโครงคร่าวสำหรับงานฝ้าเพดานและผนังเบา",
      descriptionEn: "Gypsum boards and framing for ceilings and lightweight walls.",
      coverImage: "/api/uploads/categories/gypsum.jpg",
      sortOrder: 4,
      subs: [
        { slug: "standard-board", nameTh: "แผ่นยิปซั่มมาตรฐาน", nameEn: "Standard Board" },
        { slug: "moisture-resistant", nameTh: "แผ่นยิปซั่มทนชื้น", nameEn: "Moisture Resistant Board" },
        { slug: "ceiling-frame", nameTh: "โครงคร่าวฝ้า", nameEn: "Ceiling Frame" },
      ],
    },
    {
      slug: "aluminum",
      nameTh: "อลูมิเนียม",
      nameEn: "Aluminum",
      descriptionTh: "เส้นอลูมิเนียมสำหรับประตู หน้าต่าง และงานโครงสร้าง",
      descriptionEn: "Aluminum profiles for doors, windows, and structural work.",
      coverImage: "/api/uploads/categories/aluminum.jpg",
      sortOrder: 5,
      subs: [
        { slug: "door-profile", nameTh: "เส้นอลูมิเนียมประตู", nameEn: "Door Profile" },
        { slug: "window-profile", nameTh: "เส้นอลูมิเนียมหน้าต่าง", nameEn: "Window Profile" },
        { slug: "partition-profile", nameTh: "เส้นอลูมิเนียมกั้นห้อง", nameEn: "Partition Profile" },
      ],
    },
    {
      slug: "hardware-store",
      nameTh: "คลังอุปกรณ์",
      nameEn: "Hardware Store",
      descriptionTh: "อุปกรณ์ติดตั้ง มือจับ บานพับ ซิลิโคน และวัสดุสิ้นเปลือง",
      descriptionEn: "Installation hardware, handles, hinges, sealants, and consumables.",
      coverImage: "/api/uploads/categories/hardware-store.jpg",
      sortOrder: 6,
      subs: [
        { slug: "handles", nameTh: "มือจับ", nameEn: "Handles" },
        { slug: "hinges", nameTh: "บานพับและอุปกรณ์ยึด", nameEn: "Hinges & Fittings" },
        { slug: "sealant", nameTh: "ซิลิโคนและกาว", nameEn: "Sealants & Adhesives" },
      ],
    },
  ];
  ```

- [ ] **Step 2: Run seed command to populate the database**
  Run: `npx prisma db seed`
  Expected Output: Seeding completes successfully.

---

### Task 3: Refactor CategoryGrid Component

**Files:**
- Modify: `components/homepage/category-grid.tsx`

- [ ] **Step 1: Rewrite CategoryGrid to be a server component**
  Remove `"use client"` and import Prisma & localization helper. Refactor layout grid classes to `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` and card titles to `font-headline-sm`.
  Code implementation:
  ```tsx
  import { getTranslations } from "next-intl/server";
  import { Link } from "../../i18n/routing";
  import { prisma } from "@/lib/prisma";
  import { pick } from "@/lib/products";

  interface CategoryGridProps {
    locale: string;
  }

  export async function CategoryGrid({ locale }: CategoryGridProps) {
    const t = await getTranslations("CategoryGrid");

    const dbCategories = await prisma.category.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });

    return (
      <section className="py-12 px-4 md:px-10 max-w-[1280px] mx-auto bg-white">
        <div className="text-center mb-12">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary mb-2">
            {t("title")}
          </h2>
          <div className="w-24 h-1 bg-[#3ca6fe] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {dbCategories.map((cat) => {
            const title = pick(cat, "name", locale);
            const desc = pick(cat, "description", locale);
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-xl aspect-[4/5] shadow-md hover:shadow-lg transition-all duration-300 block"
                style={{ boxShadow: "0 10px 30px -10px rgba(0, 64, 173, 0.08)" }}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                  style={{ backgroundImage: `url(${cat.coverImage || ""})` }}
                />
                {/* Gradient Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#002c7d]/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-4 text-white z-10">
                  <h3 className="font-headline-sm font-bold leading-tight">
                    {title}
                  </h3>
                  {desc && (
                    <p className="font-label-sm opacity-85 mt-1 leading-normal line-clamp-2">
                      {desc}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }
  ```

---

### Task 4: Pass Locale Param to CategoryGrid

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Pass locale to CategoryGrid in the Home component**
  Replace `<CategoryGrid />` with `<CategoryGrid locale={locale} />` in `app/[locale]/page.tsx`.
  Code modification:
  ```tsx
  // app/[locale]/page.tsx:21
  <CategoryGrid locale={locale} />
  ```

---

### Task 5: Build and Verification

**Files:**
- None (Verification task)

- [ ] **Step 1: Verify Next.js build compilation**
  Run: `npm run build`
  Expected Output: Build runs without any TypeScript or Next.js compilation errors.
