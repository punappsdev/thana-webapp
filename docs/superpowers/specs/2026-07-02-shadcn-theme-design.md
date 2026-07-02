# Design Spec: shadcn/ui Installation and Theme Configuration

This document specifies the plan to install and configure `shadcn/ui` in the Thana Glass Group web application, using Tailwind CSS v4 and the brand design system specified in [DESIGN.md](file:///c:/Users/PC/Documents/Coding/thana-webapp/DESIGN.md).

## Goals
- Install `shadcn/ui` in the project.
- Integrate the visual design tokens (colors, fonts, border radii, spacing, elevations) from `DESIGN.md` into the Tailwind CSS v4 config inside `globals.css`.
- Ensure Next.js custom Google Fonts (`Prompt` and `Noto Sans Thai`) are loaded and applied as custom utilities.

## Proposed Design Details

### 1. shadcn/ui Initialization
We will initialize the library using the standard CLI:
```bash
npx shadcn@latest init
```
This CLI will auto-detect Next.js and Tailwind CSS v4, creating:
- `components.json` with path aliases matching `tsconfig.json`.
- A custom wrapper utility directory (e.g. `lib/utils.ts` for clsx/tailwind-merge integration).

### 2. Font Loader Setup in Layout
Update [app/layout.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/layout.tsx) to import, configure, and inject the variables for `Prompt` (Headings) and `Noto Sans Thai` (Body text):
```tsx
import { Prompt, Noto_Sans_Thai } from "next/font/google";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
});
```

Inject both variables into the `html` tag:
```tsx
<html lang="th" className={`${prompt.variable} ${notoSansThai.variable} h-full antialiased`}>
```

### 3. Theme Configuration in globals.css
In [app/globals.css](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/globals.css), add the custom tokens under `@theme inline`:
```css
@theme inline {
  /* Brand Typography */
  --font-prompt: var(--font-prompt), sans-serif;
  --font-noto-sans-thai: var(--font-noto-sans-thai), sans-serif;
  
  --font-sans: var(--font-noto-sans-thai);
  --font-display: var(--font-prompt);
  
  /* Brand Colors from DESIGN.md */
  --color-primary: #002c7d;
  --color-primary-container: #0040ad;
  --color-on-primary: #ffffff;
  --color-secondary: #0062a0;
  --color-secondary-container: #3ca6fe;
  --color-on-secondary: #ffffff;
  
  /* shadcn/ui CSS variable mappings */
  --background: #faf8ff;       /* surface from DESIGN.md */
  --foreground: #1a1b22;       /* on-surface from DESIGN.md */
  
  --card: #ffffff;             /* surface-container-lowest */
  --card-foreground: #1a1b22;  /* on-surface */
  
  --popover: #ffffff;
  --popover-foreground: #1a1b22;
  
  --primary-color: #002c7d;
  --primary-foreground: #ffffff;
  
  --secondary-color: #0062a0;
  --secondary-foreground: #ffffff;
  
  --muted: #f3f3fc;            /* surface-container-low */
  --muted-foreground: #434653; /* on-surface-variant */
  
  --accent: #ededf7;           /* surface-container */
  --accent-foreground: #1a1b22;
  
  --destructive: #ba1a1a;      /* error */
  --destructive-foreground: #ffffff;
  
  --border: #c4c6d5;           /* outline-variant */
  --input: #747684;            /* outline */
  --ring: #2a57c3;             /* surface-tint */
  
  /* Border Radius from DESIGN.md */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius: 0.25rem;           /* DEFAULT */
  
  /* Custom blue-tinted shadows for elevation */
  --shadow-blue-sm: 0 1px 2px 0 rgba(0, 64, 173, 0.05);
  --shadow-blue-md: 0 4px 6px -1px rgba(0, 64, 173, 0.08), 0 2px 4px -2px rgba(0, 64, 173, 0.08);
  --shadow-blue-lg: 0 10px 15px -3px rgba(0, 64, 173, 0.08), 0 4px 6px -4px rgba(0, 64, 173, 0.08);
}
```

### 4. Verification Plan
- Run shadcn init CLI.
- Verify `components.json` is generated.
- Run `npm run dev` to ensure no compile or dev environment errors.
