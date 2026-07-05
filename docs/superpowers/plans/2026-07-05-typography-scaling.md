# Typography Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scale up the overall typography size of the application across both design tokens and Next.js styles to improve readability.

**Architecture:** Update the typography specification sizes in `DESIGN.md` for tokens, and set a base `font-size: 106.25%` on the `html` element in Next.js's global stylesheet to proportionally scale all `rem`-based font sizes without layout breakages.

**Tech Stack:** Tailwind CSS v4, Next.js.

## Global Constraints
- Only update `DESIGN.md` and Next.js styling (`app/globals.css`).
- Do NOT edit or touch `example/index.html` as per the user's explicit request.
- Do NOT commit to git automatically. Let the user review and approve the changes first.

---

### Task 1: Update Typography Specification in `DESIGN.md`

**Files:**
- Modify: [DESIGN.md](file:///c:/Users/PC/Documents/Coding/thana-webapp/DESIGN.md#L51-L87)

- [ ] **Step 1: Edit DESIGN.md**
  Update the typography font sizes inside the `typography` metadata and documentation sections in [DESIGN.md](file:///c:/Users/PC/Documents/Coding/thana-webapp/DESIGN.md).
  - Update `display-lg.fontSize` to `52px`
  - Update `headline-lg.fontSize` to `36px`
  - Update `headline-lg-mobile.fontSize` to `30px`
  - Update `headline-md.fontSize` to `26px`
  - Update `body-lg.fontSize` to `20px`
  - Update `body-md.fontSize` to `18px`
  - Update `label-sm.fontSize` to `16px`

---

### Task 2: Apply Root Font Size Scale and Define Utilities in Next.js Global Styles

**Files:**
- Modify: [app/globals.css](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/globals.css#L155-L157)

- [x] **Step 1: Modify globals.css base layer**
  Change the `html` tag styling under `@layer base` in [app/globals.css](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/globals.css) to set a base `font-size` of `106.25%`.

- [ ] **Step 2: Add custom @utility classes for typography**
  Add the custom `@utility` classes for `text-display-lg`, `text-headline-lg`, `text-headline-lg-mobile`, `text-headline-md`, `text-body-lg`, `text-body-md`, and `text-label-sm` to `app/globals.css`.

---

### Task 3: Update Homepage Components Typography

**Files:**
- Modify: [components/homepage/hero.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/homepage/hero.tsx)
- Modify: [components/homepage/category-grid.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/homepage/category-grid.tsx)
- Modify: [components/homepage/product-list.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/homepage/product-list.tsx)
- Modify: [components/homepage/about-us.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/homepage/about-us.tsx)
- Modify: [components/homepage/cta-section.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/homepage/cta-section.tsx)

- [ ] **Step 1: Update Hero Typography**
  - Update `h1` from `text-4xl md:text-5xl` to `text-headline-lg-mobile md:text-display-lg`
  - Update description `p` from `text-base md:text-lg` to `text-body-md md:text-body-lg`
- [ ] **Step 2: Update CategoryGrid Typography**
  - Update title `h2` from `text-3xl` to `text-headline-lg-mobile md:text-headline-lg`
  - Update category cards `h3` from `text-xl` to `text-headline-md`
- [ ] **Step 3: Update ProductList Typography**
  - Update title `h2` from `text-3xl` to `text-headline-lg-mobile md:text-headline-lg`
  - Update product card titles `h4` from `text-lg` to `text-body-lg font-semibold`
- [ ] **Step 4: Update AboutUs Typography**
  - Update tag `span` from `text-xs` to `text-label-sm`
  - Update title `h2` from `text-3xl` to `text-headline-lg-mobile lg:text-headline-lg`
  - Update description `p` from `text-sm` to `text-body-md`
  - Update sub-headings `h4` from `text-base` to `text-headline-md`
  - Update sub-description `p` from `text-xs` to `text-label-sm`
- [ ] **Step 5: Update CtaSection Typography**
  - Update title `h2` from `text-3xl md:text-4xl` to `text-headline-lg-mobile md:text-headline-lg`
  - Update description `p` from `text-sm md:text-base` to `text-body-md md:text-body-lg`

---

### Task 4: Update Contact Page Typography

**Files:**
- Modify: [app/[locale]/contact/page.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/[locale]/contact/page.tsx)

- [ ] **Step 1: Update Page Hero Header Sizing**
  - Update title `h1` from `text-3xl md:text-5xl` to `text-headline-lg-mobile md:text-display-lg`
  - Update subtitle `p` from `text-sm md:text-base` to `text-body-md md:text-body-lg`
- [ ] **Step 2: Update Branch Details Sizing**
  - Update branch card titles `h3` from `text-base md:text-lg` to `text-headline-md`
  - Update address paragraphs `p` from `text-xs md:text-sm` to `text-label-sm md:text-body-md`
  - Update map address footer `p` from `text-xs md:text-sm` to `text-label-sm md:text-body-md`

---

### Task 5: Verify the Font Sizing and Layout

- [ ] **Step 1: Check Local Site Sizing**
  Inspect the running application at `http://localhost:3000` to ensure the text is scaled properly.
- [ ] **Step 2: Check Layout Stability**
  Check the page structure, headers, footers, margins, and card grids to make sure the scaling does not cause any styling overflows or overlapping content.

