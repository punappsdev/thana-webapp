# shadcn/ui Installation and Theme Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install shadcn/ui library and configure its visual tokens based on the design specification.

**Architecture:** Use `shadcn@latest` to install components non-interactively using defaults. Modify layout font loaders to use `Prompt` and `Noto Sans Thai` Google Fonts, and configure Tailwind CSS v4 variables in `globals.css` to map Hex colors from `DESIGN.md`.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, React 19, Lucide React, shadcn/ui.

## Global Constraints
- Framework: Next.js 16.2.10
- Tailwind CSS version: 4.x
- Component path alias: `@/*`
- Code formatting: Preserve existing patterns

---

### Task 1: shadcn/ui Initialization

**Files:**
- Create: `components.json`
- Create: `lib/utils.ts`

**Interfaces:**
- Consumes: None
- Produces: `cn` utility function in `lib/utils.ts` and `components.json` configuration

- [ ] **Step 1: Install shadcn/ui**

Run the non-interactive initialization command to configure the default settings:
```bash
npx shadcn@latest init -y
```

Expected output: Initialization successful, creating `components.json` and utility wrapper `lib/utils.ts`.

- [ ] **Step 2: Commit initialization**

```bash
git add components.json lib/utils.ts package.json package-lock.json
git commit -m "feat: initialize shadcn/ui using defaults"
```

---

### Task 2: Layout Google Fonts Configuration

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `Prompt` and `Noto_Sans_Thai` from `next/font/google`
- Produces: `--font-prompt` and `--font-noto-sans-thai` CSS variables injected into the HTML tag

- [ ] **Step 1: Update layout.tsx imports and load fonts**

Replace the contents of [app/layout.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/layout.tsx) to configure `Prompt` and `Noto_Sans_Thai` fonts:
```tsx
import type { Metadata } from "next";
import { Prompt, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Thana Glass Group",
  description: "High-end glass and aluminum installation services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${prompt.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify compiling layout**

Run the build script to ensure there are no font loading errors:
```bash
npm run build
```

Expected output: Build completed successfully.

- [ ] **Step 3: Commit layout changes**

```bash
git add app/layout.tsx
git commit -m "feat: configure Google Fonts Prompt and Noto Sans Thai in RootLayout"
```

---

### Task 3: CSS Theme Configuration

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Google Font CSS variables `--font-prompt`, `--font-noto-sans-thai`
- Produces: Tailwind v4 classes and shadcn variables customized with the design system values

- [ ] **Step 1: Configure globals.css with design variables**

Replace the contents of [app/globals.css](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/globals.css) with the following setup:
```css
@import "tailwindcss";

:root {
  --background: #faf8ff;       /* surface from DESIGN.md */
  --foreground: #1a1b22;       /* on-surface from DESIGN.md */
  
  --card: #ffffff;             /* surface-container-lowest */
  --card-foreground: #1a1b22;  /* on-surface */
  
  --popover: #ffffff;
  --popover-foreground: #1a1b22;
  
  --primary: #002c7d;          /* primary */
  --primary-foreground: #ffffff;
  
  --secondary: #0062a0;        /* secondary */
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
  
  --radius: 0.25rem;           /* rounded.DEFAULT (4px) from DESIGN.md */
}

@theme inline {
  /* Brand Typography */
  --font-prompt: var(--font-prompt), sans-serif;
  --font-noto-sans-thai: var(--font-noto-sans-thai), sans-serif;
  
  /* Map default sans and display fonts */
  --font-sans: var(--font-noto-sans-thai);
  --font-display: var(--font-prompt);
  
  /* Brand Colors from DESIGN.md */
  --color-primary: #002c7d;
  --color-primary-container: #0040ad;
  --color-on-primary: #ffffff;
  --color-secondary: #0062a0;
  --color-secondary-container: #3ca6fe;
  --color-on-secondary: #ffffff;
  --color-tertiary: #621900;
  --color-on-tertiary: #ffffff;
  --color-error: #ba1a1a;
  
  /* Additional border radii from DESIGN.md */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;
  
  /* Custom shadows from DESIGN.md */
  --shadow-blue-sm: 0 1px 2px 0 rgba(0, 64, 173, 0.05);
  --shadow-blue-md: 0 4px 6px -1px rgba(0, 64, 173, 0.08), 0 2px 4px -2px rgba(0, 64, 173, 0.08);
  --shadow-blue-lg: 0 10px 15px -3px rgba(0, 64, 173, 0.08), 0 4px 6px -4px rgba(0, 64, 173, 0.08);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-noto-sans-thai), sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-prompt), sans-serif;
}
```

- [ ] **Step 2: Commit CSS changes**

```bash
git add app/globals.css
git commit -m "feat: configure globals.css with DESIGN.md color, font and radius tokens"
```

---

### Task 4: Verification of build and basic component addition

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: Custom tailwind classes and fonts
- Produces: Working Home page with button component styled using the design system

- [ ] **Step 1: Install a shadcn component to test**

Run:
```bash
npx shadcn@latest add button
```

Expected output: Button component added to `components/ui/button.tsx`.

- [ ] **Step 2: Verify Next.js build runs cleanly**

Run:
```bash
npm run build
```

Expected output: Build completed successfully.

- [ ] **Step 3: Commit testing changes**

```bash
git add components/ui/button.tsx
git commit -m "feat: add shadcn button component"
```
