# Design Specification: Interactive Contact Us Page

**Date:** 2026-07-05  
**Status:** Under Review  
**Topic:** Interactive Contact Us page with 3 branch cards and a dynamic Google Maps display.

---

## 1. Goal & Context
The goal is to implement a modern, high-converting **Contact Us (ติดต่อเรา)** page. Based on the user's mockups, the page must feature 3 distinct branch cards:
1. **บริษัท ธนา กลาส อลูมิเนียม จำกัด สำนักงานใหญ่ (Headquarters)**
2. **บริษัท ธนา กลาส อลูมิเนียม จำกัด สาขา000001 (Branch 000001)**
3. **บริษัท ธนา กลาส ถลาง จำกัด (Thalang Branch)**

To combine these into an interactive experience, we will implement **Approach 1 (Unified Interactive Map & Branch Selector)**: clicking on any branch card or its corresponding "ดูแผนที่ / View Map" button dynamically updates a single, high-fidelity embedded Google Map iframe on the page.

---

## 2. Architecture & File Structure

The contact page and its assets will be organized as follows:
```
app/
  └── [locale]/
        └── contact/
              └── page.tsx          <-- Main Contact page component (client/server-friendly)
messages/
  ├── en.json                       <-- English translations for the branches & contact keys
  └── th.json                       <-- Thai translations for the branches & contact keys
components/
  └── layout/
        └── header.tsx              <-- Updated Header component (fixed nav routing links)
```

---

## 3. UI & Styling Specifications

Following DESIGN.md, the design will adapt the technical-blue theme to mirror glass and aluminum structures:

### A. Page Header
A hero banner styling for the page title:
- **Title:** "ติดต่อเรา" / "Contact Us"
- **Subtitle:** "ยินดีต้อนรับสู่ ธนา กลาส กรุ๊ป - ค้นหาแผนที่และข้อมูลการติดต่อสาขาของเราได้ด้านล่าง" (Welcome to Thana Glass Group - Find our branch maps and contact information below)
- **Background:** Soft gradient overlay with glassmorphism touches.

### B. Interactive Container Grid
A 12-column responsive layout:
- **Desktop (>= 1024px):** 5-column left panel (Branch selectors) and 7-column right panel (Sticky Map View).
- **Tablet / Mobile (< 1024px):** Stacked vertically. The selector cards appear first, followed by the Map container.

### C. Branch Selector Cards
- **Aesthetic:**
  - Styled with blue-tinted gradients reminiscent of the user's mockup.
  - Card 1 (HQ): Soft Sky Blue (#e0f2fe to #bae6fd or custom tailwind colors mapping secondary-fixed / secondary-fixed-dim).
  - Card 2 (Branch 000001): Light Blue (#dbeafe to #bfdbfe or equivalent light brand shade).
  - Card 3 (Thalang): Ocean/Azure Slate (#eff6ff to #dbe1ff or similar cool primary tones).
  - Border: 1px solid brand light border (#c4e2f5 / outline-variant).
  - Active state: Glow effect with 2px shadow and deep border color (#002c7d or #0062a0).
- **Icons:** Use Lucide icons:
  - `@`: LINE (Line SVG logo or Lucide chat bubble)
  - `Phone`: Telephone call (lucide-react/Phone)
  - `Mail`: Email (lucide-react/Mail)
  - `MapPin`: Location address (lucide-react/MapPin)
- **Action Button:** "ดูแผนที่ / View Map" button with smooth background color transition.

### D. Google Map Embed Container
- Sticky display on desktop (sticky top-24).
- Rounded corners (rounded-xl / 8px matching larger container radius).
- High-fidelity Google Map iframe pointing to specific coordinates:
  - **HQ & Branch 000001 (Chalong, Mueang Phuket):** Coordinates centered around Chalong, Phuket.
  - **Thalang Branch (Thep Krasatti, Thalang):** Coordinates centered around Thalang, Phuket.
- Seamless loading state indicator when switching branches.

---

## 4. Localization Keys (Messages)

We will add the following key-value structure under "Contact" in en.json and th.json:

```json
"Contact": {
  "title": "Contact Us",
  "subtitle": "Get in touch with our branches and view locations",
  "viewMap": "View Map",
  "branches": [
    {
      "name": "Thana Glass Aluminum Co., Ltd. (Headquarters)",
      "address": "46/9 Moo 6, Chalong, Mueang Phuket, Phuket 83130",
      "phone": "076-381444, 076-381356-7, 088-7652642",
      "email": "info@thana-glass.com",
      "line": "@thanaglass"
    },
    {
      "name": "Thana Glass Aluminum Co., Ltd. (Branch 000001)",
      "address": "36 Moo 4, Chalong, Mueang Phuket, Phuket 83130",
      "phone": "076-381444",
      "email": "info@thana-glass.com",
      "line": "@thanaglass"
    },
    {
      "name": "Thana Glass Thalang Co., Ltd.",
      "address": "168 Moo 7, Thep Krasattri, Thalang, Phuket 83110",
      "phone": "076-311222",
      "email": "info@thanathalang.com",
      "line": "@thanathalang"
    }
  ]
}
```

---

## 5. Verification & Quality Gate
1. **Routing:** Navigate directly to /contact (for default TH locale) and /en/contact (for EN locale) and verify page content renders correctly.
2. **Dynamic Swapping:** Click each branch card and verify the Google Map updates to the correct branch coordinate.
3. **Responsive Checks:** View layout down to mobile dimensions, verifying card wrapping and map responsiveness.
4. **Link Integrations:** Verify phone links (tel:), mail links (mailto:), and LINE ID links open external programs correctly.
