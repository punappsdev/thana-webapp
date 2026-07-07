<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI Design & Components

- Always prioritize using components from **shadcn/ui** first before building custom components for any new pages, views, or interface elements (this is list of shadcn/ui components that can be used: https://ui.shadcn.com/docs/components)
- Always prioritize using icons from **lucide-react** first if available, and never use emojis as icons.
- Check all UI work against the design principles and tokens specified in [DESIGN.md] to ensure correct typography, colors, shadows, and spacing.
- **ห้ามใช้ raw Tailwind text-*** (เช่น `text-lg`, `text-2xl`, `text-3xl` เป็นต้น) ในการกำหนดขนาด/รูปแบบ font บนทุกหน้า UI ให้ใช้ utility classes สำหรับ font ที่ถูกกำหนดไว้ใน [globals.css] (เช่น `font-display-lg`, `font-headline-md`, `font-title-lg`, `font-body-md` เป็นต้น) ตามข้อกำหนดใน [DESIGN.md]




# Git Commit Guidelines

- **Do NOT automatically commit changes to git** after completing a task or editing files. Always ask the user to review and approve the changes first, and only commit after receiving their explicit permission.


