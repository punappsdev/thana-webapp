# Design Spec: Typography Scaling

Increase the overall font scale of the application to improve readability and visual hierarchy across all viewports.

## Goals
- Scale all typography tokens in `DESIGN.md` up by approximately 8–12%.
- Apply overall font scaling in the Next.js application by increasing the root HTML font size.
- Ensure the static prototype `example/index.html` is kept untouched as per user's request.

## Proposed Changes

### 1. Typography Tokens in `DESIGN.md`
We will update the typography specifications in [DESIGN.md](file:///c:/Users/PC/Documents/Coding/thana-webapp/DESIGN.md) to reflect the new scaled font sizes:
- `display-lg`: `48px` → `52px` (Hero titles)
- `headline-lg`: `32px` → `36px` (Desktop section headings)
- `headline-lg-mobile`: `28px` → `30px` (Mobile section headings)
- `headline-md`: `24px` → `26px` (Cards and medium headings)
- `body-lg`: `18px` → `20px` (Large body copy)
- `body-md`: `16px` → `18px` (Standard body copy)
- `label-sm`: `14px` → `16px` (Footnotes, tags, and small captions)

### 2. Next.js Application Styling in `app/globals.css`
We will:
1. Scale standard Tailwind typography (e.g. `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, etc.) in the Next.js app by setting the base font size of the `html` element inside the `@layer base` block:
   ```css
   html {
     @apply font-sans;
     font-size: 106.25%; /* Scales 16px to 17px (6.25% scale increase) */
   }
   ```
2. Define custom Tailwind v4 `@utility` classes to represent the exact design system tokens from `DESIGN.md`:
   - `text-display-lg`
   - `text-headline-lg`
   - `text-headline-lg-mobile`
   - `text-headline-md`
   - `text-body-lg`
   - `text-body-md`
   - `text-label-sm`

### 3. Component Font Sizing Refinements
Update text classes in the homepage components and the contact page to use the newly defined design system typography utilities instead of general/ad-hoc sizing classes:
- **Homepage Hero (`components/homepage/hero.tsx`):**
  - Main Title: Change from `text-4xl md:text-5xl` to `text-headline-lg-mobile md:text-display-lg`
  - Subtitle: Change from `text-base md:text-lg` to `text-body-md md:text-body-lg`
- **Homepage Categories (`components/homepage/category-grid.tsx`):**
  - Title: Change from `text-3xl` to `text-headline-lg-mobile md:text-headline-lg`
  - Item Title: Change from `text-xl` to `text-headline-md`
- **Homepage Product List (`components/homepage/product-list.tsx`):**
  - Title: Change from `text-3xl` to `text-headline-lg-mobile md:text-headline-lg`
  - Product Card Title: Change from `text-lg` to `text-body-lg font-semibold`
- **Homepage About Us (`components/homepage/about-us.tsx`):**
  - Title: Change from `text-3xl` to `text-headline-lg-mobile lg:text-headline-lg`
  - Sub-headings: Change from `text-base` to `text-headline-md`
  - Body Description: Change from `text-sm` to `text-body-md`
- **Homepage CTA (`components/homepage/cta-section.tsx`):**
  - Title: Change from `text-3xl md:text-4xl` to `text-headline-lg-mobile md:text-headline-lg`
  - Description: Change from `text-sm md:text-base` to `text-body-md md:text-body-lg`
- **Contact Page (`app/[locale]/contact/page.tsx`):**
  - Title: Change from `text-3xl md:text-5xl` to `text-headline-lg-mobile md:text-display-lg`
  - Subtitle: Change from `text-sm md:text-base` to `text-body-md md:text-body-lg`
  - Branch Titles: Change from `text-base md:text-lg` to `text-headline-md`
  - Branch Addresses: Change from `text-xs md:text-sm` to `text-label-sm md:text-body-md`

## Verification Plan
1. Run the local development server (`npm run dev`) and inspect the web app in the browser.
2. Verify that all typography throughout the site scales up proportionally.
3. Verify that the layout remains stable (no broken containers, overlapping texts, or responsiveness issues).

