# Design Specification: Fetching Database Categories for Homepage

This design specification details the migration of the category grid on the homepage from hardcoded mock items to real database records.

## Objective
Update the homepage to retrieve product categories dynamically from the MySQL/MariaDB database, localization-enabled, and presenting dedicated high-quality cover images for all 6 categories seeded in the database.

## Details

### 1. Mock Image Assets
We will generate 6 premium, professional mock cover images corresponding to each of the 6 categories in the database. These will be stored in `local_uploads/categories/`:
1. `general-glass.jpg` (Clear Glass / กระจกทั่วไป)
2. `decorative-glass.jpg` (Decorative Glass / กระจกตกแต่ง)
3. `safety-glass.jpg` (Safety Glass / กระจกนิรภัย)
4. `gypsum.jpg` (Gypsum / ยิปซั่ม)
5. `aluminum.jpg` (Aluminum / อลูมิเนียม)
6. `hardware-store.jpg` (Hardware / คลังอุปกรณ์)

### 2. Database Schema and Seed Updates
- The `Category` model in [schema.prisma](file:///c:/Users/PC/Documents/Coding/thana-webapp/prisma/schema.prisma) already defines a `coverImage` field (`String?`).
- We will modify `categoryData` array in [seed.ts](file:///c:/Users/PC/Documents/Coding/thana-webapp/prisma/seed.ts) to populate the `coverImage` field:
  - `general-glass` -> `"/api/uploads/categories/general-glass.jpg"`
  - `decorative-glass` -> `"/api/uploads/categories/decorative-glass.jpg"`
  - `safety-glass` -> `"/api/uploads/categories/safety-glass.jpg"`
  - `gypsum` -> `"/api/uploads/categories/gypsum.jpg"`
  - `aluminum` -> `"/api/uploads/categories/aluminum.jpg"`
  - `hardware-store` -> `"/api/uploads/categories/hardware-store.jpg"`
- We will run the Prisma seed command to populate the database.

### 3. Homepage CategoryGrid Refactoring
- **Server Component Conversion**: Remove the `"use client"` directive from [category-grid.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/homepage/category-grid.tsx) and convert the component to a Server Component.
- **Prisma Data Fetching**: Import `prisma` from `@/lib/prisma` and fetch published categories ordered by `sortOrder`.
- **Localization Integration**: Accept `locale` parameter props and use `pick` from `@/lib/products` to select localized versions of category name and description.
- **Layout Expansion**: Update grid columns from 4 to 6 on larger viewports:
  - Tailwind Grid classes: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6`
  - Typography adjustment: Change the card title style from `font-headline-md` (24px) to `font-headline-sm` (20px) to prevent word wrapping on narrow column boxes.
- **Routing Integration**: Replace target `href` links with `/products?category=${cat.slug}`.

### 4. Page Routing Refactoring
- Modify [app/[locale]/page.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/[locale]/page.tsx) to pass the `locale` param down to `<CategoryGrid locale={locale} />`.

---

## Verification Plan

### Automated Verification
- Verify the project builds successfully by running `npm run build`.
- Verify database seeds correctly without errors.

### Manual Verification
- Verify that the homepage renders 6 distinct categories with their corresponding mock images.
- Verify changing the page locale (between `/th` and `/en`) translates category titles and descriptions.
- Verify clicking a category redirects correctly to the products listing page filtered by that category.
