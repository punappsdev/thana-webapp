# Design Specification: Header Layout Refinement for English Locale

This design document outlines the proposed changes to the website header to resolve alignment, overlap, and overflow issues in the English (EN) locale, especially on medium-sized desktop screens (1024px - 1280px).

## Goal
Ensure the header remains readable, visually balanced, and perfectly aligned in both Thai and English locales across all screen sizes (mobile, tablet, desktop) without any overlap between navigation links and actions.

## Problem Description
- English menu labels are significantly longer than their Thai counterparts.
- On medium-sized desktop screens (viewport widths between 1024px and 1280px), the combined width of the Logo, English Navigation links, and Right Actions (Search box, Shopping Cart, Language Switcher) exceeds the container width.
- This results in layout breakage (e.g., "Contact Us" overlaps with the "Search products..." input field, or elements overflow the right boundary).

## Proposed Solution

### 1. Localization Text Shortening
Shorten the English localization labels in [en.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/en.json) for the header menu to save horizontal space:
- `"aboutUs": "About Us"` $\rightarrow$ `"About"`
- `"contactUs": "Contact Us"` $\rightarrow$ `"Contact"`

This saves approximately `55px` of horizontal space.

### 2. Responsive Styling Enhancements in [header.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/layout/header.tsx)
Introduce responsive styling adjustments for viewports between `1024px` (`lg`) and `1280px` (`xl`):

#### Logo Container
- Reduce Logo height to `h-9` (36px height, ~120px width) on `lg` screens, and scale back to `xl:h-12` (48px height, ~160px width) on larger screens.
```tsx
<Image
  src="/main-logo-tp.png"
  alt="Thana Glass Group Logo"
  width={160}
  height={48}
  className="h-10 lg:h-9 xl:h-12 w-auto object-contain"
  style={{ width: 'auto' }}
  priority
/>
```

#### Navigation Menu Links
- Reduce the menu font size to `font-label-sm` (14px, weight 500) on `lg` screens, and scale up to `xl:font-body-sm` (16px) or `xl:font-body-md` (18px) on `xl` screens.
- Reduce the gap between navigation links to `gap-2` on `lg` screens, and scale up to `xl:gap-5` on `xl` screens.
```tsx
<nav className="hidden lg:flex items-center gap-2 xl:gap-5">
  {navLinks.map((link, idx) => (
    <Link
      key={idx}
      href={link.href}
      className={`font-label-sm xl:font-body-sm whitespace-nowrap transition-colors ${
        link.active
          ? "text-primary border-b-2 border-primary-container pb-1 font-bold"
          : "text-muted-foreground hover:text-primary"
      }`}
    >
      {link.label}
    </Link>
  ))}
</nav>
```

#### Right Actions Bar
- Reduce search input width to `w-32` on `lg` screens, and scale up to `xl:w-44 focus:xl:w-48` on `xl` screens.
- Use `gap-2 xl:gap-4` for right actions.
```tsx
<div className="flex items-center gap-2 xl:gap-4">
  {/* Search Input (desktop) */}
  <div className="relative hidden lg:block">
    <input
      id="header-search-input"
      type="text"
      placeholder={t("searchPlaceholder")}
      className="bg-muted border border-border rounded-full pl-4 pr-10 py-2 font-label-sm xl:font-body-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 w-32 xl:w-44 focus:w-40 focus:xl:w-48 transition-all"
    />
    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 xl:h-6 xl:w-6 text-primary" />
  </div>
  ...
</div>
```

## Verification Plan
1. **Visual Testing:** Resize the browser window from 1024px to 1440px viewport widths to verify that no overlap or overflow occurs.
2. **Bilingual Check:** Verify both English (EN) and Thai (TH) locales behave correctly and look clean.
3. **Mobile/Tablet Drawer:** Verify that under 1024px, the hamburger menu is rendered correctly and functions as expected.
