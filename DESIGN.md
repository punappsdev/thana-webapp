---
name: Thana Glass Group Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e3'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fc'
  surface-container: '#ededf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e2e2eb'
  on-surface: '#1a1b22'
  on-surface-variant: '#434653'
  inverse-surface: '#2f3037'
  inverse-on-surface: '#f0f0fa'
  outline: '#747684'
  outline-variant: '#c4c6d5'
  surface-tint: '#2a57c3'
  primary: '#002c7d'
  on-primary: '#ffffff'
  primary-container: '#0040ad'
  on-primary-container: '#a0b6ff'
  inverse-primary: '#b4c5ff'
  secondary: '#0062a0'
  on-secondary: '#ffffff'
  secondary-container: '#3ca6fe'
  on-secondary-container: '#003a61'
  tertiary: '#621900'
  on-tertiary: '#ffffff'
  tertiary-container: '#882701'
  on-tertiary-container: '#ffa183'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d0e4ff'
  secondary-fixed-dim: '#9bcaff'
  on-secondary-fixed: '#001d35'
  on-secondary-fixed-variant: '#004a7a'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59e'
  on-tertiary-fixed: '#3a0b00'
  on-tertiary-fixed-variant: '#842500'
  background: '#faf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e2e2eb'
typography:
  display-lg:
    fontFamily: Prompt
    fontSize: 52px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Prompt
    fontSize: 42px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Prompt
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Prompt
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Prompt
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  headline-sm:
    fontFamily: Prompt
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Noto Sans Thai
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Noto Sans Thai
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Noto Sans Thai
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-lg:
    fontFamily: Noto Sans Thai
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.2'
  label-md:
    fontFamily: Noto Sans Thai
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.2'
  label-sm:
    fontFamily: Noto Sans Thai
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system is engineered to project the precision, transparency, and structural integrity inherent in glass and aluminum installation. The brand personality is **authoritative, architectural, and crystalline**. It targets commercial developers and high-end residential clients who value meticulous craftsmanship and modern aesthetics.

The visual style is a hybrid of **Modern Corporate** and **Minimalism**, with subtle **Glassmorphic** accents. This approach reflects the physical properties of the product—clarity, light reflection, and structural strength—while maintaining a professional, industrial-grade reliability. The interface should feel spacious and clean, evoking the openness of a well-designed architectural space.

## Colors
The color strategy utilizes a spectrum of technical blues to mirror atmospheric light and metallic finishes.
- **Primary & Secondary:** These deep and mid-tone blues represent the "Aluminum" frames and structural reliability.
- **Accent & Light:** These shades are used for "Glass" effects, highlights, and interactive states, providing a sense of transparency and luminosity.
- **Background:** A very pale blue-tinted white (#f0f9ff) is used instead of pure white to maintain a cool, industrial temperature across the UI.
- **Functional Neutrals:** Deep greys are reserved for high-readability text, ensuring contrast against the cool-toned background.

## Typography
The typography pairing balances geometric modernity with exceptional legibility. 
- **Prompt (Headings):** A geometric sans-serif that echoes architectural blueprints and modern signage. Use semi-bold weights for hierarchy to communicate strength.
- **Noto Sans Thai (Body):** Selected for its clarity and professional tone, ensuring that technical specifications and service descriptions are easily digestible in both Thai and English.
- **Hierarchy:** High contrast in size between headings and body text is encouraged to create an editorial, high-end feel.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop, transitioning to a **4-column grid** for mobile. 

**Philosophy:**
- **Rhythm:** All spacing is based on an 8px incremental scale to maintain industrial precision.
- **Safe Areas:** Generous outer margins (40px on desktop) ensure the content feels framed, like a window.
- **Reflow:** On tablet devices, use an 8-column grid with 20px gutters. Content cards should stack vertically when the viewport width drops below 768px.
- **Density:** Maintain a medium-to-low density. White space (or "blue space") is essential to simulate the airy feeling of glass installations.

## Elevation & Depth
Depth in this design system is conveyed through **backlight and transparency** rather than heavy shadows.
- **Tonal Layers:** Use the Background (#f0f9ff) for the lowest level, and pure white for elevated content cards.
- **Glassmorphism:** Navigation bars and floating modals should use a 12px backdrop blur with a semi-transparent white fill (opacity 70-80%) and a 1px solid border in the Light color (#c4e2f5).
- **Surface Shadows:** Use very soft, long-spread shadows with a blue tint (`rgba(0, 64, 173, 0.08)`) to suggest that elements are catching light, mimicking the way glass reflects on a surface.
- **Borders:** Define structural sections with 1px lines using the Light (#c4e2f5) color to represent aluminum framing.

## Shapes
The shape language is **structured and precise**. 
- **Corner Radii:** Use "Soft" (0.25rem / 4px) for most UI components (buttons, input fields, cards). This creates a professional look that isn't overly aggressive but retains the "rectilinear" feel of frames and glass panels.
- **Large Elements:** Featured containers or large sections may use `rounded-lg` (8px) to soften the overall composition.
- **Circular Accents:** Occasional use of perfect circles (e.g., icon backgrounds) is permitted to echo the Thana Glass Group logo's outer ring.

## Components
### Buttons
- **Primary:** Solid #0040ad with white text. Use a subtle linear gradient (Top: #078ee4 to Bottom: #0040ad) to simulate a metallic finish.
- **Secondary:** Ghost style with #0040ad border and text.
- **States:** Hover states should slightly increase the luminosity or add a 2px "glow" shadow.

### Cards
- **Construction:** White background, 1px border (#c4e2f5), and a 4px corner radius.
- **Product Cards:** Should feature a full-bleed image at the top with a subtle 5% blue overlay to unify photography with the brand palette.

### Input Fields
- **Styling:** Underlined or fully boxed with a light grey-blue border. Use #078ee4 for the active/focus state to indicate a "lit" frame.

### Chips & Tags
- **Styling:** Use #c4e2f5 background with #0040ad text. These should represent material types (e.g., "Tempered," "Laminated," "Powder Coated").

### Navigation Bar
- **Styling:** Glassmorphic (blurred background) with a thin bottom border. The logo should always be placed on the far left with generous padding.