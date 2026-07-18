# English Header Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the website header layout and text labels to avoid overlap and overflow in the English locale, especially on screen sizes from 1024px to 1280px.

**Architecture:** Use localization to shorten nav labels ("About Us" to "About", "Contact Us" to "Contact") and refine the CSS Tailwind classes in `header.tsx` to conditionally scale down component sizes (logo height, nav font size, gaps, search box width) on the `lg` breakpoint.

**Tech Stack:** Next.js v15/v16, Tailwind CSS v4, next-intl.

## Global Constraints
- Do not use raw Tailwind `text-*` classes for font sizing. Use typography utility classes defined in `app/globals.css` (e.g. `font-label-sm`, `font-body-sm`, `font-body-md`).
- Do NOT automatically commit changes to git. Always ask the user to review and approve first.

---

### Task 1: Update English Localization Labels

**Files:**
- Modify: [en.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/en.json)

**Interfaces:**
- Consumes: None
- Produces: Shortened menu labels `"About"` and `"Contact"` for English locale.

- [ ] **Step 1: Modify en.json to shorten labels**
  Edit `messages/en.json` to change the `"aboutUs"` and `"contactUs"` keys inside `"Header.nav"`.
  
  ```json
  "Header": {
    "searchPlaceholder": "Search products...",
    "nav": {
      "home": "Home",
      "products": "Products",
      "news": "News & Promotions",
      "projects": "Projects",
      "articles": "Articles",
      "aboutUs": "About",
      "contactUs": "Contact"
    }
  }
  ```

- [ ] **Step 2: Verify localization changes**
  Open the browser using the browser subagent (or refresh) and check if the menu text has updated to "About" and "Contact" in the English locale.

---

### Task 2: Refine Header Responsive Styles

**Files:**
- Modify: [header.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/layout/header.tsx)

**Interfaces:**
- Consumes: `"About"` and `"Contact"` labels from localization messages.
- Produces: Perfectly styled and responsive header that adapts cleanly between 1024px and 1280px without overlap.

- [ ] **Step 1: Update Logo, Navigation Menu, Search Bar, and Lang Switcher styling**
  Apply responsive sizing to the following components:
  1. **Logo Image:**
     - Replace `className="h-10 md:h-12 w-auto object-contain"` with `className="h-10 lg:h-9 xl:h-12 w-auto object-contain"`.
  2. **Nav Container:**
     - Replace `className="hidden lg:flex items-center gap-3 xl:gap-5"` with `className="hidden lg:flex items-center gap-2 xl:gap-5"`.
  3. **Nav Links:**
     - Replace `className={`font-body-md whitespace-nowrap transition-colors ...`}` with `className={`font-label-sm xl:font-body-sm whitespace-nowrap transition-colors ...`}`.
  4. **Right Actions Container:**
     - Replace `className="flex items-center gap-4"` with `className="flex items-center gap-2 xl:gap-4"`.
  5. **Search Input Field:**
     - Replace class `font-body-md` with `font-label-sm xl:font-body-sm`.
     - Replace width `w-40 focus:w-48` with `w-32 xl:w-44 focus:w-40 focus:xl:w-48`.
  6. **Search Icon:**
     - Replace `className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-primary"` with `className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 xl:h-6 xl:w-6 text-primary"`.
  7. **Language Switcher Container:**
     - Replace class `font-body-md` with `font-label-sm xl:font-body-sm`.

  Here is the target code change block for `components/layout/header.tsx`:
  ```tsx
  <<<<
  <<<<
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/main-logo-tp.png"
                alt="Thana Glass Group Logo"
                width={160}
                height={48}
                className="h-10 md:h-12 w-auto object-contain"
                style={{ width: 'auto' }}
                priority
              />
            </Link>
  
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-3 xl:gap-5">
              {navLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  className={`font-body-md whitespace-nowrap transition-colors ${
                    link.active
                      ? "text-primary border-b-2 border-primary-container pb-1 font-bold"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
  
            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search Input (desktop) */}
              <div className="relative hidden lg:block">
                <input
                  id="header-search-input"
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  className="bg-muted border border-border rounded-full pl-4 pr-10 py-2 font-body-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 w-40 focus:w-48 transition-all"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
  
              {/* Shopping Cart */}
              <button
                id="header-cart-btn"
                className="flex items-center justify-center p-2 rounded-full hover:bg-muted transition-all text-primary"
                aria-label="ShoppingCart"
              >
                <ShoppingCart className="h-6 w-6" />
              </button>
  
              {/* Language Switcher */}
              <div className="flex items-center gap-1 font-body-md font-medium text-muted-foreground">
  ====
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/main-logo-tp.png"
                alt="Thana Glass Group Logo"
                width={160}
                height={48}
                className="h-10 lg:h-9 xl:h-12 w-auto object-contain"
                style={{ width: 'auto' }}
                priority
              />
            </Link>
  
            {/* Desktop Navigation */}
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
  
            {/* Right Actions */}
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
  
              {/* Shopping Cart */}
              <button
                id="header-cart-btn"
                className="flex items-center justify-center p-2 rounded-full hover:bg-muted transition-all text-primary"
                aria-label="ShoppingCart"
              >
                <ShoppingCart className="h-6 w-6" />
              </button>
  
              {/* Language Switcher */}
              <div className="flex items-center gap-1 font-label-sm xl:font-body-sm font-medium text-muted-foreground">
  >>>>
  ```

- [ ] **Step 2: Run build and lint checks**
  Run: `npm run lint`
  Expected: PASS
  Run: `npm run build`
  Expected: PASS

- [ ] **Step 3: Verify the visual layout**
  Use the browser subagent to load `http://localhost:3000/en`.
  Test viewport widths:
  - `1024px`: Verify that the Logo, links (Home, Products, News & Promotions, Projects, Articles, About, Contact), Search bar, Cart, and TH|EN are displayed on one line cleanly with NO overlap or wrapping.
  - `1200px`: Verify spacing expands nicely and elements are well-aligned.
  - `1440px`: Verify the layout remains centered and wide with perfect proportion.
  - `<1024px` (e.g. `768px`): Verify mobile layout switches correctly and hamburger menu is displayed.
