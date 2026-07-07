# News & Promotions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a News and Promotions feature with a dual layout (current promotions slider at the top, latest news grid at the bottom) supporting bilingual (TH/EN) translation, and connecting to MySQL database.

**Architecture:** Split Prisma models `News` and `Promotion`, fetch using Server Side Components, and present them dynamically. Keep routes clean without custom Hero Headers.

**Tech Stack:** Next.js App Router, Prisma (MySQL/MariaDB), next-intl, lucide-react.

## Global Constraints
- ห้ามใช้ raw Tailwind text-* (เช่น text-lg, text-2xl, text-3xl เป็นต้น) สำหรับ font sizing ใน UI ทุกหน้า ให้ใช้ utility classes เช่น font-display-md, font-headline-lg, font-headline-sm, font-body-md, font-label-sm.
- Do NOT automatically commit changes to git after completing a task. Always ask the user to review and approve first.
- Always prioritize using components from shadcn/ui and icons from lucide-react.

---

### Task 1: Update Database Schema & Prisma Client

**Files:**
- Modify: [schema.prisma](file:///c:/Users/PC/Documents/Coding/thana-webapp/prisma/schema.prisma)

**Interfaces:**
- Produces: `News` and `Promotion` Prisma Client query interface.

- [ ] **Step 1: Append News and Promotion models to the end of schema.prisma**
  
  Add the following schema definitions:
  ```prisma
  model News {
    id          Int      @id @default(autoincrement())
    slug        String   @unique
    titleTh     String
    titleEn     String
    contentTh   String   @db.Text
    contentEn   String   @db.Text
    excerptTh   String?  @db.Text
    excerptEn   String?  @db.Text
    coverImage  String?
    published   Boolean  @default(false)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    @@index([slug])
  }

  model Promotion {
    id          Int       @id @default(autoincrement())
    slug        String    @unique
    titleTh     String
    titleEn     String
    contentTh   String    @db.Text
    contentEn   String    @db.Text
    excerptTh   String?   @db.Text
    excerptEn   String?   @db.Text
    coverImage  String?
    published   Boolean   @default(false)
    startDate   DateTime?
    endDate     DateTime?
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt

    @@index([slug])
  }
  ```

- [ ] **Step 2: Generate Prisma Client & Push DB Changes**
  
  Run: `npx prisma db push`
  Expected: Successful synchronization with MySQL database and Prisma Client generation.

---

### Task 2: Populate Mock Data in Database Seed Script

**Files:**
- Modify: [seed.ts](file:///c:/Users/PC/Documents/Coding/thana-webapp/prisma/seed.ts)

**Interfaces:**
- Consumes: Prisma Client queries (`prisma.news`, `prisma.promotion`)

- [ ] **Step 1: Update seed.ts to delete old records and insert mock news & promotions**

  Add deletion lines:
  ```typescript
  await prisma.news.deleteMany({});
  await prisma.promotion.deleteMany({});
  ```

  And add seeding entries for promotions and news:
  ```typescript
  console.log("Seeding promotions...");
  await prisma.promotion.createMany({
    data: [
      {
        slug: "grand-opening-promotion",
        titleTh: "โปรโมชั่นฉลองเปิดตัวสาขาใหม่ ถลาง รับส่วนลดพิเศษทันที 10%",
        titleEn: "Grand Opening Promotion Thalang - Get 10% Off Now",
        contentTh: "<p>ฉลองเปิดตัวสาขาใหม่ถลางอย่างเป็นทางการ เพื่อตอบสนองความต้องการด้านงานกระจกและอลูมิเนียมของลูกค้าที่ดียิ่งขึ้น เราขอมอบส่วนลดพิเศษ 10% สำหรับทุกการสั่งผลิตและติดตั้งกระจกนิรภัยหรือประตูหน้าต่างอลูมิเนียม ตั้งแต่วันนี้ถึงสิ้นเดือนนี้เท่านั้น!</p>",
        contentEn: "<p>To celebrate the grand opening of our Thalang branch, we are offering an exclusive 10% discount on all custom glass fabrication and aluminum door/window installations. Valid from today until the end of the month!</p>",
        excerptTh: "โปรโมชั่นพิเศษฉลองเปิดสาขาใหม่ รับส่วนลด 10% สำหรับงานกระจกและอลูมิเนียมทุกชนิด",
        excerptEn: "Celebrate the opening of our new branch with 10% off all glass and aluminum installations.",
        coverImage: "/api/uploads/portfolio/general-glass-shopfront.jpg",
        published: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        slug: "rainy-season-window-care",
        titleTh: "โปรโมชั่นหน้าฝน: เปลี่ยนขอบยางหน้าต่างกระจก รับฟรีสเปรย์ซิลิโคนรักษาแนวกันซึม",
        titleEn: "Rainy Season Special: Free Silicone Waterproof Spray with Window Service",
        contentTh: "<p>ต้อนรับฤดูฝนอย่างปลอดภัย ไร้กังวลเรื่องน้ำรั่วซึม เพียงใช้บริการดูแลปรับปรุงหน้าต่างกระจกกับ Thana Glass Group รับฟรีซิลิโคนสเปรย์ป้องกันน้ำกันซึมเกรดพรีเมียม เพื่อบ้านที่สมบูรณ์แบบของคุณ</p>",
        contentEn: "<p>Welcome the rainy season with confidence. Get a premium waterproof silicone spray for free when booking any window repair or glass replacement service with us.</p>",
        excerptTh: "ดูแลหน้าต่างกระจกของท่านต้อนรับหน้าฝนวันนี้ รับฟรีสเปรย์ซิลิโคนเกรดพรีเมียม",
        excerptEn: "Ensure your home remains dry this monsoon. Get a free waterproof spray with any glass service.",
        coverImage: "/api/uploads/portfolio/aluminum-window-frame.jpg",
        published: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      }
    ]
  });

  console.log("Seeding news...");
  await prisma.news.createMany({
    data: [
      {
        slug: "new-tempered-glass-furnace",
        titleTh: "ธนา กลาส กรุ๊ป นำเข้าเครื่องอบกระจกนิรภัยเทมเปอร์รุ่นล่าสุด เพิ่มกำลังผลิต 2 เท่า",
        titleEn: "Thana Glass Group Imports Brand New Tempered Glass Furnace, Doubling Production Capacity",
        contentTh: "<p>เพื่อรองรับโครงการขนาดใหญ่ที่เติบโตขึ้นในภาคใต้ บริษัทฯ ได้ดำเนินการนำเข้าและติดตั้งเครื่องอบกระจกนิรภัยความร้อนสูงรุ่นล่าสุดจากทวีปยุโรป ซึ่งมีคุณสมบัติเด่นในการคุมคุณภาพความแบนเรียบและลดปัญหารอยตำหนิบนผิวกระจกได้อย่างมีประสิทธิภาพ</p>",
        contentEn: "<p>To support rapidly growing commercial projects, we have successfully installed a state-of-the-art tempering furnace imported from Europe, enhancing flatness quality and doubling our output.</p>",
        excerptTh: "ยกระดับกำลังการผลิตด้วยเทคโนโลยีอบกระจกใหม่ล่าสุด เพื่อคุณภาพกระจกนิรภัยที่ดีที่สุดสำหรับคุณ",
        excerptEn: "Boosting production capabilities with advanced European furnace technology to deliver premium safety glass.",
        coverImage: "/api/uploads/portfolio/safety-glass-shower-screen.jpg",
        published: true,
      },
      {
        slug: "csr-local-school-renovation",
        titleTh: "กิจกรรมเพื่อสังคม: สนับสนุนกระจกและอลูมิเนียมเพื่อปรับปรุงอาคารเรียนของโรงเรียนในชุมชน",
        titleEn: "CSR Activity: Supplying Glass and Aluminum for Local Community School Renovation",
        contentTh: "<p>ทีมงาน Thana Glass Group ได้เข้าดำเนินการติดตั้งหน้าต่างกระจกและโครงอลูมิเนียมชุดใหม่แก่อาคารเรียนของโรงเรียนในชุมชน เพื่อสนับสนุนสุขภาวะทางสายตาและสร้างความปลอดภัยให้เยาวชน</p>",
        contentEn: "<p>Our volunteer installation crew recently supplied and set up brand new safety glass windows for local schools, ensuring secure and well-lit spaces for students.</p>",
        excerptTh: "ร่วมส่งมอบความโปร่งสบายและความปลอดภัยให้แก่เยาวชนผ่านโครงการปรับปรุงหน้าต่างอาคารเรียน",
        excerptEn: "Contributing safe, modern window installations to school facilities for better student well-being.",
        coverImage: "/api/uploads/portfolio/general-glass-window.jpg",
        published: true,
      }
    ]
  });
  ```

- [ ] **Step 2: Run Seed Script**
  
  Run: `npx tsx prisma/seed.ts`
  Expected: Success output logs "Seeding complete successfully!"

---

### Task 3: Update Translations Config

**Files:**
- Modify: [th.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/th.json)
- Modify: [en.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/en.json)

**Interfaces:**
- Consumes: JSON namespace translation keys

- [ ] **Step 1: Add "News" section to th.json**
  
  Insert into [th.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/th.json):
  ```json
  "News": {
    "title": "ข่าวสารและโปรโมชั่น",
    "description": "ติดตามข่าวสารล่าสุดและโปรโมชั่นพิเศษจากบริษัท ธนา กลาส แอนด์ อลูมิเนียม จำกัด",
    "promotionsTitle": "โปรโมชั่นพิเศษ",
    "newsTitle": "ข่าวสารล่าสุด",
    "validUntil": "หมดเขต: {date}",
    "noPromotions": "ไม่มีโปรโมชั่นพิเศษในขณะนี้",
    "noNews": "ไม่มีข่าวสารในขณะนี้",
    "readMore": "ดูรายละเอียด",
    "allNews": "ข่าวสารทั้งหมด",
    "backToNews": "ย้อนกลับไปยังหน้าข่าวสาร",
    "home": "หน้าแรก",
    "contactLine": "สอบถามโปรโมชั่นทาง LINE",
    "publishedAt": "เผยแพร่เมื่อ: {date}"
  }
  ```

- [ ] **Step 2: Add "News" section to en.json**
  
  Insert into [en.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/en.json):
  ```json
  "News": {
    "title": "News & Promotions",
    "description": "Stay updated with the latest news and special promotions from Thana Glass & Aluminum",
    "promotionsTitle": "Special Promotions",
    "newsTitle": "Latest News",
    "validUntil": "Valid Until: {date}",
    "noPromotions": "No promotions available at this time",
    "noNews": "No news updates at this time",
    "readMore": "Read Details",
    "allNews": "All News",
    "backToNews": "Back to News & Promotions",
    "home": "Home",
    "contactLine": "Inquire Promotion via LINE",
    "publishedAt": "Published on: {date}"
  }
  ```

---

### Task 4: Link Header to `/news`

**Files:**
- Modify: [header.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/layout/header.tsx)

- [ ] **Step 1: Update the Navigation Link**
  
  Change lines in [header.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/components/layout/header.tsx):
  ```typescript
  // Old:
  { label: t("nav.news"), href: "#" },
  // New:
  { label: t("nav.news"), href: "/news", active: pathname === "/news" },
  ```

---

### Task 5: Implement Listing Page (`/news`)

**Files:**
- Create: `app/[locale]/news/page.tsx`

**Interfaces:**
- Consumes: Prisma models (`News`, `Promotion`), translations (`next-intl`)

- [ ] **Step 1: Build the News and Promotion listing page**
  
  Create file `app/[locale]/news/page.tsx` with sliding promotion layout and latest news grid. Verify it fetches all data, respects font restrictions, and handles mobile views correctly. Show full content.

---

### Task 6: Implement News Detail Page (`/news/[slug]`)

**Files:**
- Create: `app/[locale]/news/[slug]/page.tsx`

- [ ] **Step 1: Create News detail route**
  
  Create page structure with dynamic metadata generation, layout with a back button, cover image, publish date, and content rendered safely.

---

### Task 7: Implement Promotion Detail Page (`/promotions/[slug]`)

**Files:**
- Create: `app/[locale]/promotions/[slug]/page.tsx`

- [ ] **Step 1: Create Promotion detail route**
  
  Create page structure with dynamic metadata, validity date warning banners, content, and a green LINE CTA button.
