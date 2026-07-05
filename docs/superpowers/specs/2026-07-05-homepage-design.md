# Design Specification: Thana Glass Aluminum Homepage

**Date:** 2026-07-05  
**Status:** Under Review  
**Topic:** Homepage implementation based on the HTML prototype with modern React and Next.js componentization.

---

## 1. Goal & Context
The goal is to implement the homepage of the Thana Glass Aluminum web application, cloning the visual structure and content of `example/index.html` while upgrading it to a modern, maintainable React layout in Next.js. The interface will adhere strictly to the custom brand design tokens outlined in `DESIGN.md`.

---

## 2. Architecture & File Structure

We will adopt **Approach 1 (Componentized Architecture)** to ensure code cleanliness and component reusability. The files will be organized as follows:

```
app/
  ├── globals.css
  ├── layout.tsx
  └── page.tsx              <-- Main landing page rendering components
components/
  ├── layout/
  │    ├── header.tsx       <-- Top Navigation bar with local Logo & language switcher
  │    └── footer.tsx       <-- Bottom Footer with details and contact info
  ├── homepage/
  │    ├── hero.tsx         <-- Slider Hero with premium styling
  │    ├── category-grid.tsx<-- Grid of 4 main material categories
  │    ├── product-list.tsx <-- Recommended products grid with shadow cards
  │    ├── about-us.tsx     <-- Standard certifications and factory info
  │    └── cta-section.tsx  <-- Bottom call to action banner
  └── ui/
       ├── button.tsx       <-- Existing shadcn button component
       └── contact-fab.tsx  <-- Expanding Multi-Contact FAB (LINE, Facebook, Phone)
```

---

## 3. UI & Styling Specifications

We will leverage the Tailwind CSS configurations set up in `globals.css` that align with `DESIGN.md`.

### Typography
- Headings (`h1`, `h2`, `h3`, `h4`) will use `font-heading` (`Prompt`), ensuring an authoritative, geometric structure.
- Body text will use `font-sans` (`Noto Sans Thai`) for clear legibility in both Thai and English.

### Color Palette
- Background: `bg-background` (`#faf8ff` / cool pale blue-tinted background).
- Primary Elements: `text-primary` (`#002c7d`) for major text/accents.
- Button Gradients: Primary CTA buttons will have a metallic gradient from `#078ee4` to `#0040ad`.
- Outline / Secondary buttons: Transparent background with `#0040ad` text and borders.
- Cards & Section borders: Light border outline `#c4c6d5` with subtle azul-tinted drop shadows (`shadow-blue-md` / `shadow-blue-lg`).

### Crystalline/Glassmorphism Accents
- Floating modals, dropdowns, and buttons will use a customized glass backdrop style:
  ```css
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(196, 226, 245, 0.5);
  ```

---

## 4. Key Interactive Components

### A. Header & Mobile Menu Drawer
- **Logo:** Displayed via Next.js `Image` pointing to `/main-logo-tp.png` (dimensions matching 40px height on mobile / 48px on desktop).
- **Search bar & Cart:** Replicated with modern inputs, focused styling, and `lucide-react` icons.
- **Language Switcher:** Clickable buttons (TH / EN) that toggle bold/primary highlight states (currently local React state).
- **Mobile Navigation:** Responsive hamburger toggle on small screens displaying a mobile navigation drawer using Lucide's `Menu` and `X` icons.

### B. Hero Slider
- Renders the primary slide with title: **"ยกระดับอาคารของคุณด้วยงานกระจกและอลูมิเนียมระดับพรีเมียม"**.
- Bullet nav dots indicating slides, allowing manual switching between slides (simulated using local component state if multiple slides are added, defaulting to a static premium slide for now).

### C. Expanding Multi-Contact FAB (`components/ui/contact-fab.tsx`)
- Placed in a fixed bottom-right position (`fixed bottom-8 right-8 z-40`).
- Consists of a primary circular toggle button showing a Lucide `MessageSquare` or similar chat icon.
- Hovering or clicking the button expands a vertical stack of three communication options:
  1. **LINE:** Green theme (`#06C755`), links to LINE chat.
  2. **Facebook Messenger:** Messenger blue theme (`#0084FF`), links to Facebook Page.
  3. **Phone Call:** Dark slate/blue theme (`#002C7D`), links to `tel:076381444`.
- Subtle slide-up micro-animations will trigger when the FAB is expanded.

---

## 5. Verification & Testing

1. **Responsive Testing:** Check layout scaling on Mobile (390px), Tablet (768px), and Desktop (1280px+).
2. **Interactive Testing:**
   - Verify mobile menu toggles properly.
   - Hover and check the FAB expanding behavior.
   - Click the FAB buttons and verify correct links (`tel:` format, external URLs).
   - Test text/input field focus indicators.
3. **Build verification:** Run `npm run build` locally to ensure there are no compilation errors or font loading issues.
