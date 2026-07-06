# Design Spec: Bilingual Article/Blog System with Prisma & MySQL

This design specification details the implementation of a bilingual article (blog) system for Thana Glass Group.

## 1. Goal & Context
Provide an architectural and visual guide to introducing a bilingual blog/articles section to the web application. The articles must support Thai and English, fetch data from a local MySQL database via Prisma, and align with the existing `next-intl` localization setup and `DESIGN.md` design system.

---

## 2. Database Schema (Prisma Models)

The data model is optimized for 2-language support using localized columns in a single table, along with a category model (`ArticleCategory`) to support article filtering.

```prisma
model ArticleCategory {
  id        Int       @id @default(autoincrement())
  slug      String    @unique // URL-friendly name, e.g. "knowledge-base"
  nameTh    String    // Category name in Thai
  nameEn    String    // Category name in English
  articles  Article[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([slug])
}

model Article {
  id                Int              @id @default(autoincrement())
  slug              String           @unique // URL-friendly name, e.g. "choosing-right-tempered-glass"
  titleTh           String           // Title in Thai
  titleEn           String           // Title in English
  contentTh         String           @db.Text // Full HTML/Markdown content in Thai
  contentEn         String           @db.Text // Full HTML/Markdown content in English
  excerptTh         String?          @db.Text // Short summary in Thai for previews
  excerptEn         String?          @db.Text // Short summary in English for previews
  coverImage        String?          // URL/Path to the cover image
  published         Boolean          @default(false)
  
  // Relations
  articleCategoryId Int?
  category          ArticleCategory? @relation(fields: [articleCategoryId], references: [id], onDelete: SetNull)

  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@index([slug])
  @@index([articleCategoryId])
}
```

---

## 3. Image Upload & Storage Integration (`UPLOAD_DIR`)

Since `UPLOAD_DIR` in `.env` points to a local directory outside Next.js's static `public` folder (`C:/Users/PC/Documents/Files/Projects/thana/local_uploads`), we will:
1. **Serve Uploaded Images via an API Route**:
   - Create a Next.js API Route: `app/api/uploads/[...path]/route.ts`
   - It will read the requested path under `UPLOAD_DIR`, check if the file exists, determine the MIME type, and stream the file as a response.
   - For example, an article cover image saved as `/api/uploads/articles/cover.jpg` will resolve to `${process.env.UPLOAD_DIR}/articles/cover.jpg`.
2. **Prisma Schema Reference**:
   - The `coverImage` field in the database will store the relative URL path: `/api/uploads/articles/<filename>`.

---

## 4. Localization Strategy (next-intl)

- **Locale parameter**: Next.js App Router uses `[locale]` dynamic routing. The locale ('th' or 'en') is read from the URL parameter.
- **Display logic**:
  - In pages and components, we will access fields dynamically based on the current locale:
    ```typescript
    const title = locale === "en" ? article.titleEn : article.titleTh;
    const content = locale === "en" ? article.contentEn : article.contentTh;
    const categoryName = locale === "en" ? category.nameEn : category.nameTh;
    ```
- **Translation file additions**:
  - We will add keys in `messages/th.json` and `messages/en.json` under an `Articles` namespace (e.g. search placeholder, read more buttons, category labels).

---


## 5. Next.js Routing and UI Design

We will implement two responsive pages following the design rules outlined in `DESIGN.md`.

### A. Article Listing Page (`app/[locale]/articles/page.tsx`)
- **Hero/Header**: Minimalist glassmorphic title section.
- **Category Filter Bar**: A horizontal list of buttons representing each `ArticleCategory` (plus an "All" option), enabling users to filter articles instantly.
- **Card Grid Layout**:
  - 12-column layout (1 column on mobile, 2 columns on tablet, 3 columns on desktop).
  - Modern card styling with thin borders (`border-outline-variant` or `#c4e2f5`), 4px rounded corners (`rounded-md`), and a subtle blue-tinted shadow.
  - Hover micro-animations (cards lift slightly, border changes color).
  - Locale-specific dates formatted properly.

### B. Article Details Page (`app/[locale]/articles/[slug]/page.tsx`)
- **SEO Metadata**: `generateMetadata` function will fetch the article by slug and locale to set proper localized titles and descriptions.
- **Detail Layout**:
  - Large premium cover image at the top with a subtle cool-blue overlay.
  - Breadcrumbs navigation (`Home > Articles > Title`).
  - Meta information (Category badge, publish date).
  - Rich text body formatted beautifully using appropriate typography tokens (Prompt for headers, Noto Sans Thai for paragraphs, spacious line heights).
  - "Back to Articles" button.

---

## 6. Verification Plan
- **Database setup**: Execute Prisma migrations and push the new schema. Seeding of mock articles will be used to verify the schema.
- **Localized UI**: Verify pages in both `/th/articles` and `/en/articles` URLs.
- **Responsive design**: Check page rendering on mobile, tablet, and desktop viewports.
