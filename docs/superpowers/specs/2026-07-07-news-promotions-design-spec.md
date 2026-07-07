# News & Promotions Design Specification

## Overview
This specification details the implementation of a bilingual "News & Promotions" feature for Thana Glass Group. The feature stores data in MySQL, supports Thai and English, and integrates with the existing Next.js (App Router) codebase.

## Requirements

### Database Models (Prisma & MySQL)
We introduce two distinct models:
- **`News`**: Informational articles about company news, updates, or industry insights.
- **`Promotion`**: Marketing promotions with duration schedules (start and end dates).

### Localization (next-intl)
- Page translations will be placed under the `"News"` key inside `messages/th.json` and `messages/en.json`.
- Thai (`th`) is the default language, and English (`en`) is the secondary language.

### Page Routing & Layout
- **Listing Page (`/news`)**: 
  - Accessible via `/news` (mapped to `app/[locale]/news/page.tsx`).
  - No blue gradient Hero Header (clean integration directly below header).
  - **Top Section**: "Current Promotions" Slider showing active, published promotions.
  - **Bottom Section**: "Latest News" Grid showing published news articles.
- **News Detail Page (`/news/[slug]`)**: 
  - Accessible via `/news/[slug]` (mapped to `app/[locale]/news/[slug]/page.tsx`).
  - Displays the detailed news article with cover image, date, and rich content.
- **Promotion Detail Page (`/promotions/[slug]`)**: 
  - Accessible via `/promotions/[slug]` (mapped to `app/[locale]/promotions/[slug]/page.tsx`).
  - Displays the detailed promotion with valid period, cover image, and a WhatsApp/LINE contact CTA button.

---

## Technical Details

### 1. Database Schema
We append the following models to [schema.prisma](file:///c:/Users/PC/Documents/Coding/thana-webapp/prisma/schema.prisma):

```prisma
model News {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  titleTh     String
  titleEn     String
  contentTh   String   @db.Text
  contentEn   String   @db.Text
  excerptTh   String?  @db.Text
  excerptEn   String?  @db.Text
  coverImage  String?
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
}

model Promotion {
  id          Int       @id @default(autoincrement())
  slug        String    @unique
  titleTh     String
  titleEn     String
  contentTh   String    @db.Text
  contentEn   String    @db.Text
  excerptTh   String?   @db.Text
  excerptEn   String?   @db.Text
  coverImage  String?
  published   Boolean   @default(false)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
}
```

### 2. Styling & Design Tokens
We adhere strictly to [DESIGN.md](file:///c:/Users/PC/Documents/Coding/thana-webapp/DESIGN.md) rules and typography classes defined in [globals.css](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/globals.css):
- **Font sizes**: Only use brand utility classes like `font-display-md`, `font-headline-lg`, `font-headline-sm`, `font-body-md`, `font-label-sm`. Raw Tailwind `text-*` classes are prohibited for font sizing.
- **Colors**: Use variables like `var(--primary)` (`#002c7d`), `var(--secondary)` (`#0062a0`), `var(--muted)` (`#f3f3fc`), and border/background tokens.
- **Borders**: Thin 1px solid lines using color `border-[#c4e2f5]` for structure.
- **Shadows**: Blue-tinted soft shadows (`shadow-blue-sm` and `shadow-blue-md`).
- **Corner Radii**: Precise corner radius (`rounded-md` / 4px).
