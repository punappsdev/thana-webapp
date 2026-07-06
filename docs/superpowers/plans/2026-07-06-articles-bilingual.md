# Bilingual Article/Blog System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a responsive, bilingual articles (blog) page that retrieves localized category and article data from a MySQL docker database using Prisma, supports dynamic image serving via an API route linking to `UPLOAD_DIR`, and matches the Thana Glass design system.

**Architecture:** We will update the Prisma schema to add `ArticleCategory` and `Article` models, create a Next.js API route to stream files from `UPLOAD_DIR` to support local images, add next-intl translations, and build the listing and detail views.

**Tech Stack:** Next.js (App Router), Prisma Client (using MariaDB adapter), next-intl, Tailwind CSS, lucide-react, shadcn/ui.

## Global Constraints

1. Do NOT automatically commit changes to git after completing a task. Always ask the user for explicit permission to commit.
2. Check all UI work against the design principles and tokens specified in DESIGN.md.
3. Use lucide-react icons and never use emojis as icons.
4. Next.js 16 uses async routing parameters: `params` and `searchParams` on Server Component Pages are Promises and must be awaited.

---

### Task 1: Prisma Schema & DB Push

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `ArticleCategory` and `Article` models inside the generated Prisma Client.

- [ ] **Step 1: Modify prisma/schema.prisma**

Add the `ArticleCategory` and `Article` models to [prisma/schema.prisma](file:///c:/Users/PC/Documents/Coding/thana-webapp/prisma/schema.prisma):

```prisma
// Append this to c:\Users\PC\Documents\Coding\thana-webapp\prisma\schema.prisma

model ArticleCategory {
  id        Int       @id @default(autoincrement())
  slug      String    @unique
  nameTh    String
  nameEn    String
  articles  Article[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([slug])
}

model Article {
  id                Int              @id @default(autoincrement())
  slug              String           @unique
  titleTh           String
  titleEn           String
  contentTh         String           @db.Text
  contentEn         String           @db.Text
  excerptTh         String?          @db.Text
  excerptEn         String?          @db.Text
  coverImage        String?
  published         Boolean          @default(false)
  
  // Relations
  articleCategoryId Int?
  category          ArticleCategory? @relation(fields: [articleCategoryId], references: [id], onDelete: SetNull)

  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@index([slug])
  @@index([articleCategoryId])
}
```

- [ ] **Step 2: Run Prisma DB Push and Generate Client**

Run the following commands in the workspace root to apply the schema updates directly to the running MySQL database container and regenerate the client:

Run: `npx prisma db push`
Expected: Connection success and database tables created.

Run: `npx prisma generate`
Expected: Client regenerated under `generated/prisma/client`.

- [ ] **Step 3: Verification**

Verify the database client compiles by checking for compilation errors in VS Code or running `npx prisma validate`.

---

### Task 2: Database Seeding Script

**Files:**
- Create: `prisma/seed.js`

**Interfaces:**
- Consumes: Prisma Client via `lib/prisma.ts` or directly imported.
- Produces: Populated data in `ArticleCategory` and `Article` tables.

- [ ] **Step 1: Create prisma/seed.js**

Create [prisma/seed.js](file:///c:/Users/PC/Documents/Coding/thana-webapp/prisma/seed.js) with test bilingual data:

```javascript
import { PrismaClient } from "../generated/prisma/client/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaMariaDb(process.env.DATABASE_URL || "");
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning old data...");
  await prisma.article.deleteMany({});
  await prisma.articleCategory.deleteMany({});

  console.log("Seeding categories...");
  const catKnowledge = await prisma.articleCategory.create({
    data: {
      slug: "knowledge",
      nameTh: "ความรู้ทั่วไป",
      nameEn: "General Knowledge",
    },
  });

  const catDesign = await prisma.articleCategory.create({
    data: {
      slug: "design-ideas",
      nameTh: "ไอเดียการตกแต่ง",
      nameEn: "Design Ideas",
    },
  });

  console.log("Seeding articles...");
  await prisma.article.createMany({
    data: [
      {
        slug: "how-to-choose-tempered-glass",
        titleTh: "วิธีการเลือกกระจกเทมเปอร์ให้ปลอดภัยสำหรับบ้านของคุณ",
        titleEn: "How to Choose Safe Tempered Glass for Your Home",
        contentTh: `<p>กระจกเทมเปอร์ (Tempered Glass) เป็นกระจกนิรภัยประเภทหนึ่งที่ผ่านการอบความร้อนสูงแล้วทำให้เย็นลงอย่างรวดเร็ว ทำให้มีความแข็งแกร่งกว่ากระจกทั่วไป 4-5 เท่า เมื่อแตกจะละเอียดเป็นเม็ดเล็กๆ คล้ายเม็ดข้าวโพด ช่วยลดความเสี่ยงในการบาดเจ็บได้เป็นอย่างดี</p>
        <h3>ปัจจัยในการเลือกกระจกเทมเปอร์:</h3>
        <ol>
          <li><strong>ความหนาที่เหมาะสม:</strong> สำหรับฉากกั้นอาบน้ำควรหนา 8-10 มม. ส่วนราวกันตกควรหนา 12 มม. ขึ้นไป</li>
          <li><strong>เครื่องหมายรับรองมาตรฐาน:</strong> มอก. (TIS) เพื่อความมั่นใจในคุณภาพการผลิต</li>
          <li><strong>ตำแหน่งติดตั้ง:</strong> บริเวณที่มีการปะทะลมหรือความร้อนสูงเป็นพิเศษ</li>
        </ol>`,
        contentEn: `<p>Tempered Glass is a type of safety glass processed by controlled thermal treatments to increase its strength compared with normal glass. It is 4-5 times stronger and, when broken, crumbles into small granular chunks instead of splintering into jagged shards.</p>
        <h3>Factors to consider when choosing:</h3>
        <ol>
          <li><strong>Thickness:</strong> 8-10 mm is ideal for shower screens, while glass railings require 12 mm or more.</li>
          <li><strong>Standard Certification:</strong> Look for TIS marks to guarantee safety and compliance.</li>
          <li><strong>Installation Area:</strong> High-wind load or high-temperature areas require precise engineering.</li>
        </ol>`,
        excerptTh: "ทำความรู้จักกระจกเทมเปอร์ วิธีการเลือกความหนาให้ตอบโจทย์ และมาตรฐานความปลอดภัยสำหรับบ้านของคุณ",
        excerptEn: "Learn about tempered glass, how to select the right thickness, and key safety standards for your property.",
        coverImage: "/api/uploads/articles/tempered-glass.jpg",
        published: true,
        articleCategoryId: catKnowledge.id,
      },
      {
        slug: "aluminum-frames-minimalist-design",
        titleTh: "โครงอลูมิเนียมกับการแต่งบ้านสไตล์มินิมอล",
        titleEn: "Aluminum Frames in Minimalist Home Design",
        contentTh: `<p>การแต่งบ้านสไตล์มินิมอลเน้นความเรียบง่าย โปร่งสบาย และใช้เฟอร์นิเจอร์น้อยชิ้น โครงอลูมิเนียมสีดำหรือสีขาวแบบ Slim Line จึงกลายเป็นตัวเลือกยอดนิยมสำหรับบานประตูและหน้าต่าง</p>
        <p>อลูมิเนียมมีความแข็งแรงสูง สามารถทำกรอบบานที่บางมากได้ ทำให้กระจกมีพื้นที่รับแสงธรรมชาติได้มากขึ้น ช่วยให้บ้านดูกว้างขวางและเชื่อมต่อกับภายนอกได้อย่างไร้รอยต่อ</p>`,
        contentEn: `<p>Minimalist home design focuses on simplicity, airy spaces, and minimal furniture. Slim Line aluminum frames in black or white have become the top choice for modern glass doors and windows.</p>
        <p>Due to its high structural strength, aluminum allows for ultra-slim frames, maximizing the glass surface area. This brings in abundant natural light and creates a seamless connection with the outdoors.</p>`,
        excerptTh: "ไอเดียแต่งบ้านสไตล์มินิมอลด้วยเฟรมอลูมิเนียมกรอบบาง เพื่อให้บ้านโปร่ง สว่าง และทันสมัย",
        excerptEn: "Design ideas for minimalist homes using slim-profile aluminum frames to maximize natural light and space.",
        coverImage: "/api/uploads/articles/minimalist-home.jpg",
        published: true,
        articleCategoryId: catDesign.id,
      },
    ],
  });

  console.log("Seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Run Seed Script**

Run the seed script with Node:
Run: `node prisma/seed.js`
Expected: Clean and populate outputs printed, finishing without errors.

---

### Task 3: Image Serving API Route (`UPLOAD_DIR`)

**Files:**
- Create: `app/api/uploads/[...path]/route.ts`

**Interfaces:**
- Consumes: `process.env.UPLOAD_DIR` and request URL params.
- Produces: HTTP response streaming the file with proper MIME headers.

- [ ] **Step 1: Create the API Route**

Create [app/api/uploads/[...path]/route.ts](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/api/uploads/%5B...path%5D/route.ts):

```typescript
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  const filePathArray = params.path;
  const uploadDir = process.env.UPLOAD_DIR;

  if (!uploadDir) {
    return new NextResponse("UPLOAD_DIR environment variable is not set", {
      status: 500,
    });
  }

  // Resolve the safe path
  const relativePath = path.join(...filePathArray);
  const absolutePath = path.resolve(uploadDir, relativePath);

  // Prevent Directory Traversal Vulnerability
  const resolvedUploadDir = path.resolve(uploadDir);
  if (!absolutePath.startsWith(resolvedUploadDir)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(absolutePath)) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    return new NextResponse("Not a file", { status: 400 });
  }

  // Determine file Content-Type
  const ext = path.extname(absolutePath).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".gif") contentType = "image/gif";
  else if (ext === ".svg") contentType = "image/svg+xml";

  const fileBuffer = fs.readFileSync(absolutePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": stat.size.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
```

- [ ] **Step 2: Create local UPLOAD_DIR directory and add placeholder images**

Ensure the directory `C:/Users/PC/Documents/Files/Projects/thana/local_uploads` exists and create `articles` subdirectory inside it. Place any image file (or copy from project) as `tempered-glass.jpg` and `minimalist-home.jpg` inside the `articles/` folder.

- [ ] **Step 3: Verification**

We will verify this API route once the server is running by attempting to access `http://localhost:3000/api/uploads/articles/tempered-glass.jpg` in the browser or via curl.

---

### Task 4: Translations Config

**Files:**
- Modify: `messages/th.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add translation keys for Thai**

Open [messages/th.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/th.json) and inject the following namespace at root level:

```json
  "Articles": {
    "title": "บทความและสาระน่ารู้",
    "description": "บทความที่รวบรวมข้อมูลที่เป็นประโยชน์เกี่ยวกับกระจก อลูมิเนียม และการออกแบบตกแต่งภายใน",
    "search": "ค้นหาบทความ...",
    "all": "ทั้งหมด",
    "readMore": "อ่านเพิ่มเติม",
    "noArticles": "ไม่พบบทความในขณะนี้",
    "back": "ย้อนกลับไปยังหน้าบทความ",
    "publishedAt": "เผยแพร่เมื่อ"
  }
```

- [ ] **Step 2: Add translation keys for English**

Open [messages/en.json](file:///c:/Users/PC/Documents/Coding/thana-webapp/messages/en.json) and inject the following namespace at root level:

```json
  "Articles": {
    "title": "Articles & Knowledge",
    "description": "A collection of useful articles about glass, aluminum, and interior designs.",
    "search": "Search articles...",
    "all": "All",
    "readMore": "Read More",
    "noArticles": "No articles found.",
    "back": "Back to Articles",
    "publishedAt": "Published on"
  }
```

---

### Task 5: Article Listing Page (`app/[locale]/articles/page.tsx`)

**Files:**
- Create: `app/[locale]/articles/page.tsx`

**Interfaces:**
- Consumes: Prisma Client for Articles & Categories, `next-intl` translation tags, search parameters.
- Produces: Listing page rendering bilingual cards and category navigation.

- [ ] **Step 1: Create the Listing Page**

Create [app/[locale]/articles/page.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/%5Blocale%5D/articles/page.tsx):

```typescript
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Calendar, Search } from "lucide-react";
import Image from "next/image";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; query?: string }>;
}

export default async function ArticlesPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { category, query } = await searchParams;
  const t = await getTranslations("Articles");

  // Fetch categories
  const categories = await prisma.articleCategory.findMany({
    orderBy: { nameEn: "asc" },
  });

  // Build filter condition
  const where: any = { published: true };

  if (category) {
    where.category = { slug: category };
  }

  if (query) {
    where.OR = [
      { titleTh: { contains: query } },
      { titleEn: { contains: query } },
      { excerptTh: { contains: query } },
      { excerptEn: { contains: query } },
    ];
  }

  // Fetch articles
  const articles = await prisma.article.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col min-h-screen bg-background font-noto-sans-thai">
      <Header />

      <main className="flex-1 pt-[80px] md:pt-[96px] pb-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#f3f3fc] to-background py-16 px-4 md:px-8 border-b border-[#c4e2f5]">
          <div className="max-w-5xl mx-auto text-center space-y-4">
            <h1 className="font-prompt text-4xl md:text-5xl font-bold text-primary leading-tight">
              {t("title")}
            </h1>
            <p className="text-[#434653] text-lg max-w-2xl mx-auto">
              {t("description")}
            </p>
          </div>
        </section>

        {/* Filter Bar & Search */}
        <section className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center border-b border-[#ededf7] pb-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Link
                href="/articles"
                className={`px-4 py-2 text-sm rounded-md font-medium transition-all ${
                  !category
                    ? "bg-primary text-white shadow-sm"
                    : "bg-[#f3f3fc] text-[#434653] border border-[#c4e2f5] hover:bg-[#ededf7]"
                }`}
              >
                {t("all")}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/articles?category=${cat.slug}${query ? `&query=${query}` : ""}`}
                  className={`px-4 py-2 text-sm rounded-md font-medium transition-all ${
                    category === cat.slug
                      ? "bg-primary text-white shadow-sm"
                      : "bg-[#f3f3fc] text-[#434653] border border-[#c4e2f5] hover:bg-[#ededf7]"
                  }`}
                >
                  {locale === "en" ? cat.nameEn : cat.nameTh}
                </Link>
              ))}
            </div>

            {/* Search Box */}
            <form method="GET" action="" className="relative w-full md:w-80">
              <input
                type="text"
                name="query"
                defaultValue={query || ""}
                placeholder={t("search")}
                className="w-full bg-[#ffffff] border border-[#c4e2f5] focus:border-primary rounded-md pl-10 pr-4 py-2 text-sm text-on-surface outline-none transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-[#747684]" />
              {category && <input type="hidden" name="category" value={category} />}
            </form>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="max-w-6xl mx-auto px-4 md:px-8">
          {articles.length === 0 ? (
            <div className="text-center py-16 bg-[#ffffff] border border-[#c4e2f5] rounded-md shadow-sm">
              <p className="text-[#434653] text-lg font-medium">{t("noArticles")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => {
                const title = locale === "en" ? article.titleEn : article.titleTh;
                const excerpt = locale === "en" ? article.excerptEn : article.excerptTh;
                const catName = article.category
                  ? locale === "en"
                    ? article.category.nameEn
                    : article.category.nameTh
                  : null;

                return (
                  <article
                    key={article.id}
                    className="flex flex-col bg-[#ffffff] border border-[#c4e2f5] rounded-md overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary-container"
                  >
                    {/* Cover Image */}
                    {article.coverImage && (
                      <div className="relative aspect-video w-full overflow-hidden bg-[#e2e2eb]">
                        <Image
                          src={article.coverImage}
                          alt={title}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Meta Tags */}
                        <div className="flex items-center gap-3 text-xs text-[#747684]">
                          {catName && (
                            <span className="bg-[#c4e2f5] text-[#002c7d] px-2.5 py-0.5 rounded-md font-medium">
                              {catName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(article.createdAt).toLocaleDateString(
                              locale === "en" ? "en-US" : "th-TH",
                              { year: "numeric", month: "short", day: "numeric" }
                            )}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="font-prompt text-xl font-bold text-on-surface line-clamp-2 hover:text-primary transition-colors">
                          <Link href={`/articles/${article.slug}`}>
                            {title}
                          </Link>
                        </h2>

                        {/* Excerpt */}
                        {excerpt && (
                          <p className="text-[#434653] text-sm line-clamp-3 leading-relaxed">
                            {excerpt}
                          </p>
                        )}
                      </div>

                      {/* Read More Link */}
                      <div className="pt-6 mt-auto">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-container transition-colors"
                        >
                          {t("readMore")} →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
```

---

### Task 6: Article Details Page (`app/[locale]/articles/[slug]/page.tsx`)

**Files:**
- Create: `app/[locale]/articles/[slug]/page.tsx`

**Interfaces:**
- Consumes: Prisma Client for selected Article, next-intl translations.
- Produces: Full article details page displaying formatted html content and generating dynamic SEO metadata.

- [ ] **Step 1: Create the Details Page**

Create [app/[locale]/articles/[slug]/page.tsx](file:///c:/Users/PC/Documents/Coding/thana-webapp/app/%5Blocale%5D/articles/%5Bslug%5D/page.tsx):

```typescript
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface DetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Generate dynamic SEO metadata
export async function generateMetadata({
  params,
}: DetailProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = await prisma.article.findUnique({
    where: { slug, published: true },
  });

  if (!article) return {};

  const title = locale === "en" ? article.titleEn : article.titleTh;
  const description = locale === "en" ? article.excerptEn : article.excerptTh;

  return {
    title: `${title} | Thana Glass`,
    description: description || undefined,
  };
}

export default async function ArticleDetailPage({ params }: DetailProps) {
  const { slug, locale } = await params;
  const t = await getTranslations("Articles");

  const article = await prisma.article.findUnique({
    where: { slug, published: true },
    include: { category: true },
  });

  if (!article) {
    notFound();
  }

  const title = locale === "en" ? article.titleEn : article.titleTh;
  const content = locale === "en" ? article.contentEn : article.contentTh;
  const catName = article.category
    ? locale === "en"
      ? article.category.nameEn
      : article.category.nameTh
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-background font-noto-sans-thai">
      <Header />

      <main className="flex-1 pt-[80px] md:pt-[96px] pb-16">
        {/* Breadcrumbs */}
        <nav className="bg-[#f3f3fc] border-b border-[#c4e2f5] py-4 px-4 md:px-8">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs md:text-sm text-[#434653]">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-[#747684]" />
            <Link href="/articles" className="hover:text-primary transition-colors">
              {t("title")}
            </Link>
            <ChevronRight className="h-4 w-4 text-[#747684]" />
            <span className="text-[#747684] truncate max-w-[180px] md:max-w-sm">
              {title}
            </span>
          </div>
        </nav>

        {/* Content Container */}
        <article className="max-w-4xl mx-auto px-4 md:px-8 py-12 space-y-8">
          {/* Article Header */}
          <div className="space-y-4">
            {catName && (
              <span className="inline-block bg-[#c4e2f5] text-[#002c7d] text-sm px-3 py-1 rounded-md font-semibold">
                {catName}
              </span>
            )}
            <h1 className="font-prompt text-3xl md:text-4xl lg:text-5xl font-bold text-on-surface leading-tight">
              {title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-[#747684]">
              <Calendar className="h-4 w-4" />
              <span>
                {t("publishedAt")}{" "}
                {new Date(article.createdAt).toLocaleDateString(
                  locale === "en" ? "en-US" : "th-TH",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </span>
            </div>
          </div>

          {/* Large Cover Image */}
          {article.coverImage && (
            <div className="relative aspect-video w-full rounded-md overflow-hidden bg-[#e2e2eb] shadow-sm border border-[#c4e2f5]">
              <Image
                src={article.coverImage}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 900px"
              />
            </div>
          )}

          {/* Article Body */}
          <div
            className="prose prose-blue max-w-none text-on-surface leading-relaxed text-base md:text-lg space-y-6"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Footer Navigation */}
          <div className="border-t border-[#ededf7] pt-8 mt-12">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-container transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
```
