# Design Spec: Quotation Steps Section on Homepage

Design and implementation spec for adding the "Steps to Request a Quotation" workflow visual section on the homepage, positioned above the "About Thana Glass Group" section.

## User Review Required

- The section will be integrated into the homepage `app/[locale]/page.tsx` right above `AboutUs`.
- Uses a fully responsive horizontal flow design that scales to stacked vertical cards on mobile viewports.

## Proposed Changes

### Translations

#### [MODIFY] [th.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/th.json)
Adding `QuotationSteps` translations under a dedicated namespace.

#### [MODIFY] [en.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/en.json)
Adding `QuotationSteps` English translations.

### UI Components

#### [NEW] [quotation-steps.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/homepage/quotation-steps.tsx)
Create a new server-safe Client Component (using `"use client"` if needed for framer-motion or standard React/Intl utilities) that renders the 5-step quotation process.
- **Background:** Soft Cool Blue (`bg-background` / `#faf8ff`).
- **Cards/Icons:** Circle icons with a blue background, matching Lucide icons:
  - Step 1: `ShoppingCart`
  - Step 2: `ShoppingBasket` with a red circular badge (text "1") on the top right.
  - Step 3: `ClipboardText`
  - Step 4: `FileCheck`
  - Step 5: LINE logo SVG (green) & Gmail/Mail icon.
- **Connectors:** `ArrowRight` (hidden on mobile, visible on `md:`) and `ArrowDown` (visible on mobile, hidden on `md:`).

### Pages

#### [MODIFY] [page.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/[locale]/page.tsx)
Insert the new `<QuotationSteps />` component above `<AboutUs />`.

---

## Verification Plan

### Manual Verification
1. Run local dev server (`npm run dev`) if not already running.
2. Visit the homepage in a browser.
3. Verify that the new "ขั้นตอนการขอใบเสนอราคา" (Steps to Request a Quotation) section is visible above the "ABOUT THANA GLASS GROUP" section.
4. Toggle language between Thai and English using the header language selector, ensuring the text translations change correctly.
5. Resize the browser to mobile viewport (e.g. 375px) and verify that the steps stack vertically with downward arrows instead of rightward arrows.
