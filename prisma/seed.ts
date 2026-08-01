import "dotenv/config";
import { prisma } from "../lib/prisma";
import { reindexProducts } from "../lib/search-index";

async function main() {
  console.log("Cleaning old data...");
  // Admin-owned tables (AdminUser, AdminSession, MediaAsset, ActivityLog) are
  // deliberately left alone — they belong to `npm run admin:create` and the
  // admin panel, and wiping them would log the developer out on every seed.
  //
  // QuotationRequest / QuotationItem are left alone for the same reason: they are
  // real customer submissions, not fixtures. QuotationItem points at Product with
  // ON DELETE SET NULL, so the product wipe below nulls the link but keeps the
  // snapshotted name and quantity on every past request.
  await prisma.article.deleteMany({});
  await prisma.articleCategory.deleteMany({});
  await prisma.workImage.deleteMany({});
  await prisma.work.deleteMany({});
  await prisma.news.deleteMany({});
  await prisma.banner.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.variantAttributeValue.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productAttributeValue.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productAttribute.deleteMany({});
  await prisma.attributeValue.deleteMany({});
  await prisma.attribute.deleteMany({});
  await prisma.subCategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.productUnit.deleteMany({});
  await prisma.pricingUnit.deleteMany({});

  console.log("Seeding article categories...");
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

  console.log("Seeding categories (shared by products and portfolio)...");
  // Cover images point at files that already exist in UPLOAD_DIR. `fiber-cement`
  // has no photo of its own yet, so it borrows the gypsum board shot — both are
  // flat sheet material. Swap it out once a real photo is uploaded.
  const categoryData = [
    {
      slug: "gypsum-ceiling",
      nameTh: "แผ่นยิปซัมและงานฝ้า",
      nameEn: "Gypsum Board & Ceiling",
      descriptionTh: "แผ่นยิปซัม โครงคร่าว และระบบฝ้าเพดานสำหรับงานผนังเบาและฝ้าภายใน",
      descriptionEn: "Gypsum boards, framing, and ceiling systems for lightweight walls and interior ceilings.",
      coverImage: "/api/uploads/categories/gypsum.jpg",
      sortOrder: 1,
      subs: [
        { slug: "standard-board", nameTh: "แผ่นยิปซัมมาตรฐาน", nameEn: "Standard Gypsum Board" },
        { slug: "moisture-resistant", nameTh: "แผ่นยิปซัมทนชื้น", nameEn: "Moisture Resistant Board" },
        { slug: "fire-resistant", nameTh: "แผ่นยิปซัมทนไฟ", nameEn: "Fire Resistant Board" },
        { slug: "ceiling-frame", nameTh: "โครงคร่าวฝ้า", nameEn: "Ceiling Framing" },
        { slug: "ceiling-tbar", nameTh: "ฝ้าทีบาร์", nameEn: "T-Bar Ceiling System" },
      ],
    },
    {
      slug: "fiber-cement",
      nameTh: "ไฟเบอร์ซีเมนต์",
      nameEn: "Fiber Cement",
      descriptionTh: "แผ่นเรียบ ไม้ฝา แผ่นฝ้า และแผ่นหลังคาไฟเบอร์ซีเมนต์ ทนชื้น ทนปลวก",
      descriptionEn: "Fiber cement flat sheets, planks, ceiling boards, and roof sheets — moisture and termite resistant.",
      coverImage: "/api/uploads/categories/gypsum.jpg",
      sortOrder: 2,
      subs: [
        { slug: "flat-sheet", nameTh: "แผ่นเรียบไฟเบอร์ซีเมนต์", nameEn: "Flat Sheet" },
        { slug: "plank", nameTh: "ไม้ฝาไฟเบอร์ซีเมนต์", nameEn: "Fiber Cement Plank" },
        { slug: "ceiling-board", nameTh: "แผ่นฝ้าไฟเบอร์ซีเมนต์", nameEn: "Ceiling Board" },
        { slug: "roof-sheet", nameTh: "แผ่นหลังคาไฟเบอร์ซีเมนต์", nameEn: "Roof Sheet" },
      ],
    },
    {
      slug: "glass",
      nameTh: "กระจก",
      nameEn: "Glass",
      descriptionTh: "กระจกใส กระจกตกแต่ง และกระจกนิรภัยครบทุกประเภท พร้อมบริการสั่งตัดตามขนาด",
      descriptionEn: "Clear, decorative, and safety glass of every type, with custom cutting available.",
      coverImage: "/api/uploads/categories/general-glass.jpg",
      sortOrder: 3,
      subs: [
        { slug: "clear-float", nameTh: "กระจกใสโฟลต", nameEn: "Clear Float Glass" },
        { slug: "tinted", nameTh: "กระจกสีตัดแสง", nameEn: "Tinted Glass" },
        { slug: "mirror", nameTh: "กระจกเงา", nameEn: "Mirror" },
        { slug: "tempered", nameTh: "กระจกเทมเปอร์", nameEn: "Tempered Glass" },
        { slug: "laminated", nameTh: "กระจกลามิเนต", nameEn: "Laminated Glass" },
        { slug: "insulated", nameTh: "กระจกฉนวนสองชั้น", nameEn: "Insulated Glass" },
        { slug: "patterned", nameTh: "กระจกลาย", nameEn: "Patterned Glass" },
        { slug: "frosted", nameTh: "กระจกฝ้า", nameEn: "Frosted Glass" },
        { slug: "sandblasted", nameTh: "กระจกพ่นทราย", nameEn: "Sandblasted Glass" },
      ],
    },
    {
      slug: "aluminum",
      nameTh: "อลูมิเนียม",
      nameEn: "Aluminum",
      descriptionTh: "เส้นอลูมิเนียมสำหรับประตู หน้าต่าง งานกั้นห้อง และแผ่นอลูมิเนียมคอมโพสิต",
      descriptionEn: "Aluminum profiles for doors, windows, partitions, and aluminum composite panels.",
      coverImage: "/api/uploads/categories/aluminum.jpg",
      sortOrder: 4,
      subs: [
        { slug: "door-profile", nameTh: "เส้นอลูมิเนียมประตู", nameEn: "Door Profile" },
        { slug: "window-profile", nameTh: "เส้นอลูมิเนียมหน้าต่าง", nameEn: "Window Profile" },
        { slug: "partition-profile", nameTh: "เส้นอลูมิเนียมกั้นห้อง", nameEn: "Partition Profile" },
        { slug: "composite-panel", nameTh: "แผ่นอลูมิเนียมคอมโพสิต", nameEn: "Aluminum Composite Panel" },
      ],
    },
    {
      slug: "installation-hardware",
      nameTh: "อุปกรณ์ติดตั้ง",
      nameEn: "Installation Hardware",
      descriptionTh: "มือจับ บานพับ ซิลิโคน สกรูและพุก สำหรับงานติดตั้งกระจกและอลูมิเนียม",
      descriptionEn: "Handles, hinges, sealants, screws, and anchors for glass and aluminum installation.",
      coverImage: "/api/uploads/categories/hardware-store.jpg",
      sortOrder: 5,
      subs: [
        { slug: "handles", nameTh: "มือจับ", nameEn: "Handles" },
        { slug: "hinges", nameTh: "บานพับและอุปกรณ์ยึด", nameEn: "Hinges & Fittings" },
        { slug: "sealant", nameTh: "ซิลิโคนและกาว", nameEn: "Sealants & Adhesives" },
        { slug: "screws-anchors", nameTh: "สกรูและพุก", nameEn: "Screws & Anchors" },
      ],
    },
  ];

  const categoryBy: Record<string, number> = {};
  const subCategoryBy: Record<string, number> = {};
  for (const { subs, ...cat } of categoryData) {
    const created = await prisma.category.create({ data: cat });
    categoryBy[cat.slug] = created.id;
    for (const [i, sub] of subs.entries()) {
      const createdSub = await prisma.subCategory.create({
        data: { ...sub, sortOrder: i + 1, categoryId: created.id },
      });
      subCategoryBy[`${cat.slug}/${sub.slug}`] = createdSub.id;
    }
  }

  console.log("Seeding works...");
  // Created one at a time rather than with `createMany` because each work owns a
  // nested WorkImage gallery, which `createMany` cannot write.
  const workData = [
    {
      slug: "general-glass-shopfront",
      titleTh: "หน้ากุ๊กประตูกระจกร้านค้า",
      titleEn: "Glass Shopfront Front Door",
      descriptionTh: "ติดตั้งกระจกใสใบใหญ่สำหรับหน้าร้านค้า ให้มองเห็นสินค้าได้ชัดเจน สวยงามและทันสมัย",
      descriptionEn: "Clear large-pane glass installation for shopfronts, offering a clear product view with a modern look.",
      coverImage: "/api/uploads/portfolio/general-glass-shopfront.jpg",
      published: true,
      categorySlug: "glass",
      images: [
        { url: "/api/uploads/portfolio/general-glass-shopfront.jpg", altTh: "หน้าร้านกระจกใสบานใหญ่", altEn: "Large clear glass shopfront" },
        { url: "/api/uploads/portfolio/general-glass-window.jpg", altTh: "มุมมองจากภายในร้าน", altEn: "View from inside the shop" },
        { url: "/api/uploads/categories/general-glass.jpg", altTh: "รายละเอียดขอบกระจก", altEn: "Glass edge detail" },
      ],
    },
    {
      slug: "general-glass-window",
      titleTh: "หน้าต่างกระจกใสบ้านพักอาศัย",
      titleEn: "Clear Glass Residential Windows",
      descriptionTh: "หน้าต่างกระจกใสสำหรับบ้านพัก รับแสงธรรมชาติเข้าบ้านเต็มพื้นที่",
      descriptionEn: "Clear glass windows for homes, maximizing natural daylight in every room.",
      coverImage: "/api/uploads/portfolio/general-glass-window.jpg",
      published: true,
      categorySlug: "glass",
      images: [
        { url: "/api/uploads/portfolio/general-glass-window.jpg", altTh: "หน้าต่างกระจกใสในห้องนั่งเล่น", altEn: "Clear glass window in the living room" },
        { url: "/api/uploads/portfolio/general-glass-shopfront.jpg", altTh: "บานกระจกมองจากภายนอก", altEn: "Glass panel seen from outside" },
      ],
    },
    {
      slug: "safety-glass-shower-screen",
      titleTh: "ฉากกั้นอาบน้ำกระจกเทมเปอร์",
      titleEn: "Tempered Glass Shower Screen",
      descriptionTh: "ฉากกั้นอาบน้ำกระจกเทมเปอร์ หนา 10 มม. ปลอดภัย ทนทาน ทำความสะอาดง่าย",
      descriptionEn: "10mm tempered glass shower screen — safe, durable, and easy to clean.",
      coverImage: "/api/uploads/portfolio/safety-glass-shower-screen.jpg",
      published: true,
      categorySlug: "glass",
      images: [
        { url: "/api/uploads/portfolio/safety-glass-shower-screen.jpg", altTh: "ฉากกั้นอาบน้ำกระจกเทมเปอร์", altEn: "Tempered glass shower screen" },
        { url: "/api/uploads/portfolio/safety-glass-railing.jpg", altTh: "อุปกรณ์ยึดกระจกสแตนเลส", altEn: "Stainless steel glass fittings" },
        { url: "/api/uploads/products/tempered-safety-glass.jpg", altTh: "ผิวกระจกเทมเปอร์ระยะใกล้", altEn: "Close-up of the tempered glass surface" },
      ],
    },
    {
      slug: "safety-glass-railing",
      titleTh: "ราวกันตกกระจกลามิเนต",
      titleEn: "Laminated Glass Balustrade",
      descriptionTh: "ราวกันตกกระจกลามิเนตสำหรับระเบียงและบันได ผ่านมาตรฐาน มอก.",
      descriptionEn: "Laminated glass balustrade for balconies and staircases, TIS-certified for safety.",
      coverImage: "/api/uploads/portfolio/safety-glass-railing.jpg",
      published: true,
      categorySlug: "glass",
      images: [
        { url: "/api/uploads/portfolio/safety-glass-railing.jpg", altTh: "ราวกันตกกระจกลามิเนตบนระเบียง", altEn: "Laminated glass balustrade on a balcony" },
        { url: "/api/uploads/portfolio/safety-glass-shower-screen.jpg", altTh: "จุดยึดราวกระจกกับพื้น", altEn: "Floor-mounted glass railing base" },
      ],
    },
    {
      slug: "decorative-glass-partition",
      titleTh: "ผนังกั้นกระจกลาย",
      titleEn: "Decorative Glass Partition",
      descriptionTh: "ผนังกั้นกระจกลายสวยสำหรับสำนักงาน เพิ่มความเป็นส่วนตัวโดยไม่ทึบ",
      descriptionEn: "Patterned decorative glass partition for offices — privacy without losing light.",
      coverImage: "/api/uploads/portfolio/decorative-glass-partition.jpg",
      published: true,
      categorySlug: "glass",
      images: [
        { url: "/api/uploads/portfolio/decorative-glass-partition.jpg", altTh: "ผนังกั้นกระจกลายในสำนักงาน", altEn: "Patterned glass partition in an office" },
        { url: "/api/uploads/products/frosted-decorative-glass.jpg", altTh: "ลายกระจกฝ้าระยะใกล้", altEn: "Close-up of the frosted pattern" },
      ],
    },
    {
      slug: "aluminum-slim-door",
      titleTh: "ประตูบานเลื่อนอลูมิเนียมกรอบบาง",
      titleEn: "Slim Aluminum Sliding Door",
      descriptionTh: "ประตูบานเลื่อนอลูมิเนียม Slim Line กรอบบาง โอบรับกระจกใบใหญ่ดูโปร่ง",
      descriptionEn: "Slim-line aluminum sliding door — ultra-thin frames for a wide, airy glass view.",
      coverImage: "/api/uploads/portfolio/aluminum-slim-door.jpg",
      published: true,
      categorySlug: "aluminum",
      images: [
        { url: "/api/uploads/portfolio/aluminum-slim-door.jpg", altTh: "ประตูบานเลื่อนอลูมิเนียมกรอบบาง", altEn: "Slim-frame aluminum sliding door" },
        { url: "/api/uploads/portfolio/aluminum-window-frame.jpg", altTh: "รายละเอียดรางเลื่อนอลูมิเนียม", altEn: "Aluminum sliding track detail" },
        { url: "/api/uploads/products/aluminum-sliding-door-profile.jpg", altTh: "หน้าตัดเส้นอลูมิเนียม", altEn: "Aluminum profile cross-section" },
      ],
    },
    {
      slug: "aluminum-window-frame",
      titleTh: "ขอบหน้าต่างอลูมิเนียมสีขาว",
      titleEn: "White Aluminum Window Frame",
      descriptionTh: "ขอบหน้าต่างอลูมิเนียมสีขาว ทนทานต่อสภาพอากาศ กันสนิม",
      descriptionEn: "White aluminum window frames — weather-resistant and rust-free.",
      coverImage: "/api/uploads/portfolio/aluminum-window-frame.jpg",
      published: true,
      categorySlug: "aluminum",
      images: [
        { url: "/api/uploads/portfolio/aluminum-window-frame.jpg", altTh: "หน้าต่างอลูมิเนียมสีขาว", altEn: "White aluminum window" },
        { url: "/api/uploads/categories/aluminum.jpg", altTh: "ผิวเคลือบสีขาวระยะใกล้", altEn: "Close-up of the white powder coating" },
      ],
    },
    {
      slug: "hardware-glass-handle",
      titleTh: "มือจับกระจกสแตนเลสเกรด 304",
      titleEn: "Stainless Steel Glass Handle Grade 304",
      descriptionTh: "มือจับกระจกสแตนเลสเกรด 304 ดีไซน์โมเดิร์น ทนทานการใช้งานหนัก",
      descriptionEn: "Grade 304 stainless steel glass handle — modern design built for heavy use.",
      coverImage: "/api/uploads/portfolio/hardware-glass-handle.jpg",
      published: true,
      categorySlug: "installation-hardware",
      images: [
        { url: "/api/uploads/portfolio/hardware-glass-handle.jpg", altTh: "มือจับกระจกสแตนเลสหลังติดตั้ง", altEn: "Installed stainless steel glass handle" },
        { url: "/api/uploads/products/stainless-glass-handle.jpg", altTh: "มือจับสแตนเลสเกรด 304", altEn: "Grade 304 stainless steel handle" },
      ],
    },
    {
      slug: "fiber-cement-roof-sheet",
      titleTh: "หลังคาแผ่นไฟเบอร์ซีเมนต์โรงงาน",
      titleEn: "Fiber Cement Factory Roofing",
      descriptionTh: "ติดตั้งหลังคาแผ่นไฟเบอร์ซีเมนต์สำหรับโรงงานและโกดัง ทนทานต่อทุกสภาพอากาศ ไม่ลามไฟ",
      descriptionEn: "Fiber cement roof sheet installation for factories and warehouses — weatherproof and non-combustible.",
      coverImage: "/api/uploads/portfolio/zinc-sheet-roofing.jpg",
      published: true,
      categorySlug: "fiber-cement",
      images: [
        { url: "/api/uploads/portfolio/zinc-sheet-roofing.jpg", altTh: "หลังคาไฟเบอร์ซีเมนต์โรงงาน", altEn: "Fiber cement factory roof" },
        { url: "/api/uploads/categories/gypsum.jpg", altTh: "แผ่นไฟเบอร์ซีเมนต์ก่อนติดตั้ง", altEn: "Fiber cement sheets before installation" },
      ],
    },
    {
      slug: "gypsum-ceiling-office",
      titleTh: "งานฝ้าเพดานยิปซัมสำนักงาน",
      titleEn: "Office Gypsum Ceiling Installation",
      descriptionTh: "ติดตั้งฝ้าเพดานยิปซัมฉาบเรียบพร้อมโครงคร่าวชุบสังกะสีสำหรับสำนักงาน ผิวเรียบสนิทไร้รอยต่อ",
      descriptionEn: "Skim-coated gypsum ceiling on galvanized furring for an office — a perfectly flat, seamless finish.",
      coverImage: "/api/uploads/categories/gypsum.jpg",
      published: true,
      categorySlug: "gypsum-ceiling",
      images: [
        { url: "/api/uploads/categories/gypsum.jpg", altTh: "ฝ้าเพดานยิปซัมฉาบเรียบ", altEn: "Skim-coated gypsum ceiling" },
        { url: "/api/uploads/products/standard-gypsum-board.jpg", altTh: "แผ่นยิปซัมก่อนติดตั้ง", altEn: "Gypsum boards before installation" },
      ],
    },
  ];

  for (const { categorySlug, images, ...work } of workData) {
    await prisma.work.create({
      data: {
        ...work,
        categoryId: categoryBy[categorySlug],
        images: {
          create: images.map((image, i) => ({ ...image, sortOrder: i + 1 })),
        },
      },
    });
  }

  console.log("Seeding promotions...");
  // Created one at a time so their ids can be linked from the promotion banners.
  const promotionData = [
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
    },
  ];

  const promotionBy: Record<string, number> = {};
  for (const promotion of promotionData) {
    const created = await prisma.promotion.create({ data: promotion });
    promotionBy[promotion.slug] = created.id;
  }

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

  console.log("Seeding banners...");
  // HOMEPAGE banners drive the front-page hero carousel; PROMOTION banners feed
  // the /news slider and open the promotion they point at.
  await prisma.banner.createMany({
    data: [
      {
        type: "HOMEPAGE",
        titleTh: "ผู้เชี่ยวชาญงานกระจกและอลูมิเนียมครบวงจร",
        titleEn: "Your Complete Glass and Aluminum Specialist",
        subtitleTh: "ธนา กลาส กรุ๊ป ภูเก็ต",
        subtitleEn: "Thana Glass Group Phuket",
        descriptionTh: "ผลิต จำหน่าย และติดตั้งกระจกนิรภัย ประตูหน้าต่างอลูมิเนียม พร้อมทีมช่างมืออาชีพกว่า 30 ปี",
        descriptionEn: "Fabrication, supply, and installation of safety glass and aluminum doors and windows, backed by 30 years of craftsmanship.",
        imageUrl: "/api/uploads/hero-slide-1.jpg",
        linkUrl: "/products",
        buttonTextTh: "ดูสินค้าทั้งหมด",
        buttonTextEn: "Browse Products",
        sortOrder: 1,
        published: true,
      },
      {
        type: "HOMEPAGE",
        titleTh: "วัสดุก่อสร้างครบ จบในที่เดียว",
        titleEn: "Every Building Material Under One Roof",
        subtitleTh: "ยิปซัม ไฟเบอร์ซีเมนต์ กระจก อลูมิเนียม",
        subtitleEn: "Gypsum, Fiber Cement, Glass, Aluminum",
        descriptionTh: "แผ่นยิปซัม งานฝ้า ไฟเบอร์ซีเมนต์ และอุปกรณ์ติดตั้งครบทุกรายการ พร้อมส่งถึงหน้างาน",
        descriptionEn: "Gypsum boards, ceiling systems, fiber cement, and all the installation hardware you need — delivered to site.",
        imageUrl: "/api/uploads/hero-slide-2.jpg",
        linkUrl: "/products",
        buttonTextTh: "ติดต่อขอใบเสนอราคา",
        buttonTextEn: "Request a Quote",
        sortOrder: 2,
        published: true,
      },
      {
        type: "PROMOTION",
        titleTh: "ฉลองเปิดสาขาใหม่ถลาง ลด 10%",
        titleEn: "Thalang Grand Opening — 10% Off",
        subtitleTh: "ถึงสิ้นเดือนนี้เท่านั้น",
        subtitleEn: "This month only",
        imageUrl: "/api/uploads/portfolio/general-glass-shopfront.jpg",
        buttonTextTh: "ดูรายละเอียด",
        buttonTextEn: "See Details",
        sortOrder: 1,
        published: true,
        promotionId: promotionBy["grand-opening-promotion"],
      },
      {
        type: "PROMOTION",
        titleTh: "โปรหน้าฝน รับฟรีสเปรย์ซิลิโคนกันซึม",
        titleEn: "Rainy Season — Free Waterproof Spray",
        subtitleTh: "เมื่อใช้บริการดูแลหน้าต่างกระจก",
        subtitleEn: "With any window service",
        imageUrl: "/api/uploads/portfolio/aluminum-window-frame.jpg",
        buttonTextTh: "ดูรายละเอียด",
        buttonTextEn: "See Details",
        sortOrder: 2,
        published: true,
        promotionId: promotionBy["rainy-season-window-care"],
      },
    ],
  });

  console.log("Seeding product units...");
  const units = await Promise.all(
    [
      { code: "sheet", nameTh: "แผ่น", nameEn: "Sheet" },
      { code: "piece", nameTh: "ชิ้น", nameEn: "Piece" },
      { code: "roll", nameTh: "ม้วน", nameEn: "Roll" },
      { code: "meter", nameTh: "เมตร", nameEn: "Meter" },
      { code: "sqm", nameTh: "ตารางเมตร", nameEn: "Square Meter" },
      { code: "set", nameTh: "ชุด", nameEn: "Set" },
    ].map((u) => prisma.productUnit.create({ data: u }))
  );
  const unitBy = Object.fromEntries(units.map((u) => [u.code, u.id]));

  const pricingUnits = await Promise.all(
    [
      { code: "per-sheet", nameTh: "ราคาต่อแผ่น", nameEn: "Price per sheet" },
      { code: "per-piece", nameTh: "ราคาต่อชิ้น", nameEn: "Price per piece" },
      { code: "per-pair", nameTh: "ราคาต่อคู่", nameEn: "Price per pair" },
      { code: "per-pack", nameTh: "ราคาต่อแพ็ค", nameEn: "Price per pack" },
      { code: "per-roll", nameTh: "ราคาต่อม้วน", nameEn: "Price per roll" },
      { code: "per-sqm", nameTh: "ราคาต่อตารางเมตร", nameEn: "Price per sq.m." },
      { code: "per-meter", nameTh: "ราคาต่อเมตร", nameEn: "Price per meter" },
    ].map((u) => prisma.pricingUnit.create({ data: u }))
  );
  const pricingBy = Object.fromEntries(pricingUnits.map((u) => [u.code, u.id]));

  console.log("Seeding brands...");
  const brands = await Promise.all(
    [
      { slug: "thana-glass", name: "Thana Glass" },
      { slug: "guardian", name: "Guardian Glass" },
      { slug: "agc", name: "AGC" },
      { slug: "scg", name: "SCG" },
      { slug: "gyproc", name: "Gyproc" },
      { slug: "ykk", name: "YKK AP" },
      { slug: "shera", name: "Shera" },
      { slug: "dowsil", name: "DOWSIL" },
    ].map((b) => prisma.brand.create({ data: b }))
  );
  const brandBy = Object.fromEntries(brands.map((b) => [b.slug, b.id]));

  console.log("Seeding attributes...");
  const attributeData = [
    {
      slug: "thickness",
      nameTh: "ความหนา",
      nameEn: "Thickness",
      unit: "mm",
      inputType: "NUMBER" as const,
      sortOrder: 1,
      values: [
        { slug: "3-5mm", valueTh: "3.5 มม.", valueEn: "3.5 mm", numericValue: 3.5 },
        { slug: "4mm", valueTh: "4 มม.", valueEn: "4 mm", numericValue: 4 },
        { slug: "5mm", valueTh: "5 มม.", valueEn: "5 mm", numericValue: 5 },
        { slug: "6mm", valueTh: "6 มม.", valueEn: "6 mm", numericValue: 6 },
        { slug: "8mm", valueTh: "8 มม.", valueEn: "8 mm", numericValue: 8 },
        { slug: "9-5mm", valueTh: "9.5 มม.", valueEn: "9.5 mm", numericValue: 9.5 },
        { slug: "10mm", valueTh: "10 มม.", valueEn: "10 mm", numericValue: 10 },
        { slug: "12mm", valueTh: "12 มม.", valueEn: "12 mm", numericValue: 12 },
        { slug: "12-5mm", valueTh: "12.5 มม.", valueEn: "12.5 mm", numericValue: 12.5 },
        { slug: "15mm", valueTh: "15 มม.", valueEn: "15 mm", numericValue: 15 },
      ],
    },
    {
      slug: "size",
      nameTh: "ขนาด",
      nameEn: "Size",
      inputType: "SELECT" as const,
      sortOrder: 2,
      values: [
        { slug: "1200x2400", valueTh: "1200 x 2400 มม.", valueEn: "1200 x 2400 mm" },
        { slug: "1220x2440", valueTh: "1220 x 2440 มม.", valueEn: "1220 x 2440 mm" },
        { slug: "1220x3000", valueTh: "1220 x 3000 มม.", valueEn: "1220 x 3000 mm" },
        { slug: "1830x2440", valueTh: "1830 x 2440 มม.", valueEn: "1830 x 2440 mm" },
        { slug: "2440x3660", valueTh: "2440 x 3660 มม.", valueEn: "2440 x 3660 mm" },
        { slug: "150x3000", valueTh: "150 x 3000 มม.", valueEn: "150 x 3000 mm" },
        { slug: "600x600", valueTh: "600 x 600 มม.", valueEn: "600 x 600 mm" },
        { slug: "l-3600", valueTh: "ยาว 3.6 ม.", valueEn: "3.6 m length" },
        { slug: "l-4000", valueTh: "ยาว 4.0 ม.", valueEn: "4.0 m length" },
        { slug: "custom", valueTh: "สั่งตัดตามขนาด", valueEn: "Custom Cut" },
      ],
    },
    {
      slug: "color",
      nameTh: "สี",
      nameEn: "Color",
      inputType: "COLOR" as const,
      sortOrder: 3,
      values: [
        { slug: "clear", valueTh: "ใส", valueEn: "Clear", colorHex: "#EAF2F5" },
        { slug: "green", valueTh: "เขียว", valueEn: "Green", colorHex: "#4E7A63" },
        { slug: "bronze", valueTh: "ชา", valueEn: "Bronze", colorHex: "#8B6A42" },
        { slug: "blue", valueTh: "ฟ้า", valueEn: "Blue", colorHex: "#5A87A8" },
        { slug: "black", valueTh: "ดำ", valueEn: "Black", colorHex: "#1C1C1C" },
        { slug: "white", valueTh: "ขาว", valueEn: "White", colorHex: "#F5F5F5" },
        { slug: "anodized-silver", valueTh: "อลูมิเนียมอโนไดซ์เงิน", valueEn: "Anodized Silver", colorHex: "#C0C4C7" },
        { slug: "teak", valueTh: "สีสักทอง", valueEn: "Golden Teak", colorHex: "#9C6B3F" },
        { slug: "cement-grey", valueTh: "สีเทาซีเมนต์", valueEn: "Cement Grey", colorHex: "#8E8E88" },
      ],
    },
    {
      slug: "edge-type",
      nameTh: "ประเภทขอบ",
      nameEn: "Edge Type",
      inputType: "SELECT" as const,
      sortOrder: 4,
      values: [
        { slug: "raw", valueTh: "ขอบดิบ", valueEn: "Raw Edge" },
        { slug: "seamed", valueTh: "ขอบลบคม", valueEn: "Seamed Edge" },
        { slug: "polished", valueTh: "ขอบเจียร", valueEn: "Polished Edge" },
        { slug: "beveled", valueTh: "ขอบปาดเหลี่ยม", valueEn: "Beveled Edge" },
      ],
    },
    {
      slug: "surface-finish",
      nameTh: "ผิวสำเร็จ",
      nameEn: "Surface Finish",
      inputType: "SELECT" as const,
      sortOrder: 5,
      values: [
        { slug: "glossy", valueTh: "ผิวเงา", valueEn: "Glossy" },
        { slug: "matte", valueTh: "ผิวด้าน", valueEn: "Matte" },
        { slug: "brushed", valueTh: "ผิวขัดลาย", valueEn: "Brushed" },
      ],
    },
    {
      // Boards are cut and joined differently from glass, so their edge profile is
      // its own attribute rather than another value under `edge-type`.
      slug: "board-edge",
      nameTh: "ประเภทขอบแผ่น",
      nameEn: "Board Edge",
      inputType: "SELECT" as const,
      sortOrder: 6,
      values: [
        { slug: "tapered", valueTh: "ขอบลาด", valueEn: "Tapered Edge" },
        { slug: "square", valueTh: "ขอบตรง", valueEn: "Square Edge" },
        { slug: "bevelled", valueTh: "ขอบวี", valueEn: "Bevelled Edge" },
      ],
    },
    {
      slug: "pattern",
      nameTh: "ลายพื้นผิว",
      nameEn: "Surface Pattern",
      inputType: "SELECT" as const,
      sortOrder: 7,
      values: [
        { slug: "smooth", valueTh: "ผิวเรียบ", valueEn: "Smooth" },
        { slug: "wood-grain", valueTh: "ลายเสี้ยนไม้", valueEn: "Wood Grain" },
        { slug: "sanded", valueTh: "ผิวขัด", valueEn: "Sanded" },
      ],
    },
  ];

  const attrValueBy: Record<string, number> = {};
  const attributeBy: Record<string, number> = {};
  for (const { values, ...attr } of attributeData) {
    const created = await prisma.attribute.create({ data: attr });
    attributeBy[attr.slug] = created.id;
    for (const [i, val] of values.entries()) {
      const createdVal = await prisma.attributeValue.create({
        data: { ...val, sortOrder: i + 1, attributeId: created.id },
      });
      attrValueBy[`${attr.slug}:${val.slug}`] = createdVal.id;
    }
  }

  console.log("Seeding products...");
  // `images` holds the extra gallery shots only — the product page already puts
  // `coverImage` first (app/[locale]/products/[slug]/page.tsx), so repeating it
  // here would show the same photo twice.
  const productData = [
    // ---- แผ่นยิปซัมและงานฝ้า ------------------------------------------------
    {
      slug: "standard-gypsum-board",
      sku: "GY-STD-001",
      nameTh: "แผ่นยิปซั่มมาตรฐาน",
      nameEn: "Standard Gypsum Board",
      descriptionTh:
        "แผ่นยิปซั่มมาตรฐานสำหรับงานฝ้าเพดานและผนังเบาภายใน น้ำหนักเบา ติดตั้งง่าย ตัดแต่งได้สะดวก",
      descriptionEn:
        "Standard gypsum board for interior ceilings and lightweight partition walls. Light, easy to install, and simple to cut.",
      usageGuideTh:
        "เก็บแผ่นในที่แห้ง วางราบบนพื้นเรียบเพื่อป้องกันการโก่งตัว ไม่เหมาะกับพื้นที่เปียกชื้น ให้ใช้รุ่นทนชื้นแทน",
      usageGuideEn:
        "Store flat in a dry area to prevent warping. Not suitable for wet areas — use the moisture-resistant variant instead.",
      coverImage: "/api/uploads/products/standard-gypsum-board.jpg",
      basePrice: 165,
      categorySlug: "gypsum-ceiling",
      subCategorySlug: "gypsum-ceiling/standard-board",
      brandSlug: "gyproc",
      unitCode: "sheet",
      pricingCode: "per-sheet",
      published: true,
      images: [
        { url: "/api/uploads/categories/gypsum.jpg", altTh: "แผ่นยิปซั่มหลังติดตั้งเป็นฝ้าเพดาน", altEn: "Gypsum board installed as a ceiling" },
      ],
      attributes: ["thickness:9-5mm", "thickness:12-5mm", "size:1220x2440", "size:1220x3000", "board-edge:tapered"],
      variants: [
        { sku: "GY-STD-001-95-2440", price: 165, values: ["thickness:9-5mm", "size:1220x2440"], isDefault: true },
        { sku: "GY-STD-001-95-3000", price: 205, values: ["thickness:9-5mm", "size:1220x3000"] },
        { sku: "GY-STD-001-125-2440", price: 215, values: ["thickness:12-5mm", "size:1220x2440"] },
        { sku: "GY-STD-001-125-3000", price: 265, values: ["thickness:12-5mm", "size:1220x3000"] },
      ],
    },
    {
      slug: "moisture-resistant-gypsum-board",
      sku: "GY-MR-001",
      nameTh: "แผ่นยิปซั่มทนชื้น",
      nameEn: "Moisture Resistant Gypsum Board",
      descriptionTh:
        "แผ่นยิปซั่มทนชื้นสีเขียว ผสมสารกันน้ำในเนื้อยิปซั่มและกระดาษปิดผิว เหมาะกับห้องน้ำ ห้องครัว และพื้นที่ที่มีความชื้นสูง",
      descriptionEn:
        "Green moisture-resistant gypsum board with water-repellent additives in both core and liner. Ideal for bathrooms, kitchens, and humid areas.",
      usageGuideTh:
        "ทนความชื้นในอากาศได้ดี แต่ไม่ใช่แผ่นกันน้ำ ห้ามให้สัมผัสน้ำโดยตรง บริเวณผนังห้องอาบน้ำควรปิดทับด้วยกระเบื้องหรือวัสดุกันน้ำเสมอ",
      usageGuideEn:
        "Resists airborne humidity but is not waterproof — never expose it to direct water. Always finish shower walls with tile or another waterproof layer.",
      coverImage: "/api/uploads/products/standard-gypsum-board.jpg",
      basePrice: 245,
      categorySlug: "gypsum-ceiling",
      subCategorySlug: "gypsum-ceiling/moisture-resistant",
      brandSlug: "gyproc",
      unitCode: "sheet",
      pricingCode: "per-sheet",
      published: true,
      images: [
        { url: "/api/uploads/categories/gypsum.jpg", altTh: "แผ่นยิปซั่มทนชื้นสีเขียว", altEn: "Green moisture-resistant gypsum board" },
      ],
      attributes: ["thickness:9-5mm", "thickness:12-5mm", "size:1220x2440", "board-edge:tapered", "color:green"],
      variants: [
        { sku: "GY-MR-001-95", price: 245, values: ["thickness:9-5mm", "size:1220x2440"], isDefault: true },
        { sku: "GY-MR-001-125", price: 295, values: ["thickness:12-5mm", "size:1220x2440"] },
      ],
    },
    {
      slug: "ceiling-furring-frame",
      sku: "GY-FRM-001",
      nameTh: "โครงคร่าวฝ้าเหล็กชุบสังกะสี",
      nameEn: "Galvanized Ceiling Furring Frame",
      descriptionTh:
        "โครงคร่าวฝ้าเพดานเหล็กชุบสังกะสี รีดขึ้นรูปเย็น แข็งแรง ไม่บิดตัว ไม่เป็นสนิม ใช้เป็นโครงรับแผ่นยิปซั่มและแผ่นไฟเบอร์ซีเมนต์",
      descriptionEn:
        "Cold-rolled galvanized steel furring for ceiling framing. Rigid, warp-free, and rust-free — the support grid for gypsum and fiber cement boards.",
      usageGuideTh:
        "เว้นระยะโครงคร่าวไม่เกิน 400 มม. สำหรับแผ่นยิปซั่มหนา 9.5 มม. และไม่เกิน 600 มม. สำหรับแผ่นหนา 12.5 มม. ยึดด้วยสกรูปลายสว่านเท่านั้น",
      usageGuideEn:
        "Space furring at no more than 400 mm for 9.5 mm board and 600 mm for 12.5 mm board. Fix with self-drilling screws only.",
      coverImage: "/api/uploads/categories/gypsum.jpg",
      basePrice: 89,
      categorySlug: "gypsum-ceiling",
      subCategorySlug: "gypsum-ceiling/ceiling-frame",
      brandSlug: "scg",
      unitCode: "piece",
      pricingCode: "per-piece",
      published: true,
      images: [
        { url: "/api/uploads/products/standard-gypsum-board.jpg", altTh: "โครงคร่าวฝ้าพร้อมแผ่นยิปซั่ม", altEn: "Ceiling furring with gypsum boards" },
      ],
      attributes: ["size:l-3600", "size:l-4000", "color:anodized-silver", "surface-finish:glossy"],
      variants: [
        { sku: "GY-FRM-001-3600", price: 89, values: ["size:l-3600"], isDefault: true },
        { sku: "GY-FRM-001-4000", price: 99, values: ["size:l-4000"] },
      ],
    },

    // ---- ไฟเบอร์ซีเมนต์ ------------------------------------------------------
    {
      slug: "fiber-cement-flat-sheet",
      sku: "FC-FLT-001",
      nameTh: "แผ่นเรียบไฟเบอร์ซีเมนต์",
      nameEn: "Fiber Cement Flat Sheet",
      descriptionTh:
        "แผ่นเรียบไฟเบอร์ซีเมนต์ ผลิตจากปูนซีเมนต์ผสมเส้นใยธรรมชาติ ไม่มีส่วนผสมของแร่ใยหิน ทนชื้น ทนปลวก ไม่ลามไฟ ใช้ได้ทั้งงานผนังภายในและภายนอก",
      descriptionEn:
        "Asbestos-free fiber cement flat sheet made from cement and natural fibers. Moisture resistant, termite proof, and non-combustible — suitable for interior and exterior walls.",
      usageGuideTh:
        "ตัดด้วยใบตัดคาร์ไบด์และสวมหน้ากากกันฝุ่นทุกครั้ง เว้นร่องระหว่างแผ่น 3-5 มม. เพื่อรองรับการยืดหดตัว และเจาะนำก่อนขันสกรูเสมอ",
      usageGuideEn:
        "Cut with a carbide blade and always wear a dust mask. Leave a 3-5 mm gap between sheets for movement, and pre-drill before driving screws.",
      coverImage: "/api/uploads/products/standard-gypsum-board.jpg",
      basePrice: 195,
      categorySlug: "fiber-cement",
      subCategorySlug: "fiber-cement/flat-sheet",
      brandSlug: "shera",
      unitCode: "sheet",
      pricingCode: "per-sheet",
      featured: true,
      featuredOrder: 3,
      published: true,
      images: [
        { url: "/api/uploads/categories/gypsum.jpg", altTh: "แผ่นเรียบไฟเบอร์ซีเมนต์วางซ้อน", altEn: "Stacked fiber cement flat sheets" },
        { url: "/api/uploads/portfolio/zinc-sheet-roofing.jpg", altTh: "แผ่นไฟเบอร์ซีเมนต์ที่หน้างาน", altEn: "Fiber cement sheets on site" },
      ],
      attributes: ["thickness:4mm", "thickness:6mm", "thickness:8mm", "size:1200x2400", "board-edge:square", "pattern:smooth"],
      variants: [
        { sku: "FC-FLT-001-4", price: 195, values: ["thickness:4mm", "size:1200x2400"], isDefault: true },
        { sku: "FC-FLT-001-6", price: 265, values: ["thickness:6mm", "size:1200x2400"] },
        { sku: "FC-FLT-001-8", price: 345, values: ["thickness:8mm", "size:1200x2400"] },
      ],
    },
    {
      slug: "fiber-cement-plank",
      sku: "FC-PLK-001",
      nameTh: "ไม้ฝาไฟเบอร์ซีเมนต์",
      nameEn: "Fiber Cement Plank",
      descriptionTh:
        "ไม้ฝาไฟเบอร์ซีเมนต์ลายเสี้ยนไม้ธรรมชาติ ให้ความสวยงามเหมือนไม้จริงแต่ไม่ผุ ไม่บวมน้ำ ปลวกไม่กิน เหมาะกับผนังภายนอกและงานตกแต่งฟาซาด",
      descriptionEn:
        "Wood-grain fiber cement plank with the look of real timber but none of the rot, swelling, or termite risk. Built for exterior walls and facade detailing.",
      usageGuideTh:
        "ติดตั้งแบบซ้อนเกล็ดโดยให้แผ่นบนทับแผ่นล่างอย่างน้อย 25 มม. ยึดด้วยสกรูสเตนเลสหรือตะปูเกลียวชุบกันสนิม และทาสีรองพื้นปูนก่อนทาสีจริงเสมอ",
      usageGuideEn:
        "Install with a minimum 25 mm overlap, fix with stainless or galvanized screws, and always apply a masonry primer before the topcoat.",
      coverImage: "/api/uploads/portfolio/zinc-sheet-roofing.jpg",
      basePrice: 165,
      categorySlug: "fiber-cement",
      subCategorySlug: "fiber-cement/plank",
      brandSlug: "shera",
      unitCode: "piece",
      pricingCode: "per-piece",
      published: true,
      images: [
        { url: "/api/uploads/products/standard-gypsum-board.jpg", altTh: "ไม้ฝาไฟเบอร์ซีเมนต์ลายเสี้ยนไม้", altEn: "Wood-grain fiber cement plank" },
      ],
      attributes: ["thickness:8mm", "size:150x3000", "pattern:wood-grain", "pattern:smooth", "color:teak", "color:cement-grey", "color:white"],
      variants: [
        { sku: "FC-PLK-001-TEAK", price: 165, values: ["pattern:wood-grain", "color:teak"], isDefault: true },
        { sku: "FC-PLK-001-GREY", price: 165, values: ["pattern:wood-grain", "color:cement-grey"] },
        { sku: "FC-PLK-001-SMTH", price: 155, values: ["pattern:smooth", "color:white"] },
      ],
    },
    {
      slug: "fiber-cement-ceiling-board",
      sku: "FC-CEL-001",
      nameTh: "แผ่นฝ้าไฟเบอร์ซีเมนต์",
      nameEn: "Fiber Cement Ceiling Board",
      descriptionTh:
        "แผ่นฝ้าไฟเบอร์ซีเมนต์สำหรับฝ้าเพดานภายนอกและชายคา ทนแดดทนฝน ไม่ยุบตัวเมื่อโดนความชื้น ใช้ได้ทั้งระบบฝ้าฉาบเรียบและฝ้าทีบาร์",
      descriptionEn:
        "Fiber cement ceiling board for eaves and exterior soffits. Weatherproof and sag-free in humid conditions, for both skim-coat and T-bar ceiling systems.",
      usageGuideTh:
        "สำหรับฝ้าฉาบเรียบให้เว้นร่องระหว่างแผ่น 3 มม. แล้วปิดรอยต่อด้วยเทปไฟเบอร์กลาสและปูนฉาบรอยต่อ ส่วนระบบทีบาร์วางบนโครงได้ทันทีไม่ต้องยึดสกรู",
      usageGuideEn:
        "For skim-coat ceilings leave a 3 mm joint, then tape with fiberglass mesh and joint compound. T-bar panels simply drop into the grid — no screws needed.",
      coverImage: "/api/uploads/products/standard-gypsum-board.jpg",
      basePrice: 135,
      categorySlug: "fiber-cement",
      subCategorySlug: "fiber-cement/ceiling-board",
      brandSlug: "scg",
      unitCode: "sheet",
      pricingCode: "per-sheet",
      published: true,
      images: [
        { url: "/api/uploads/categories/gypsum.jpg", altTh: "แผ่นฝ้าไฟเบอร์ซีเมนต์บริเวณชายคา", altEn: "Fiber cement ceiling board under eaves" },
      ],
      attributes: ["thickness:3-5mm", "thickness:4mm", "size:1200x2400", "size:600x600", "pattern:smooth"],
      variants: [
        { sku: "FC-CEL-001-35-2400", price: 135, values: ["thickness:3-5mm", "size:1200x2400"], isDefault: true },
        { sku: "FC-CEL-001-4-2400", price: 155, values: ["thickness:4mm", "size:1200x2400"] },
        { sku: "FC-CEL-001-35-600", price: 62, values: ["thickness:3-5mm", "size:600x600"] },
      ],
    },

    // ---- กระจก ---------------------------------------------------------------
    {
      slug: "clear-float-glass",
      sku: "GL-CLR-001",
      nameTh: "กระจกใสโฟลต",
      nameEn: "Clear Float Glass",
      descriptionTh:
        "กระจกใสโฟลตคุณภาพสูง ผิวเรียบสม่ำเสมอ ให้แสงผ่านได้สูงถึง 90% เหมาะสำหรับหน้าต่าง ประตู และงานตกแต่งภายในทั่วไป",
      descriptionEn:
        "High-quality clear float glass with a uniform surface and up to 90% light transmission. Ideal for windows, doors, and general interior work.",
      usageGuideTh:
        "ควรใช้ในตำแหน่งที่ไม่รับแรงกระแทกสูง สำหรับบานที่สูงเกิน 1.5 เมตร แนะนำให้เปลี่ยนเป็นกระจกนิรภัย ทำความสะอาดด้วยน้ำยาเช็ดกระจกและผ้าไมโครไฟเบอร์",
      usageGuideEn:
        "Use in areas not subject to high impact. For panels over 1.5 m tall, switch to safety glass. Clean with glass cleaner and a microfiber cloth.",
      coverImage: "/api/uploads/products/clear-float-glass.jpg",
      basePrice: 450,
      categorySlug: "glass",
      subCategorySlug: "glass/clear-float",
      brandSlug: "agc",
      unitCode: "sheet",
      pricingCode: "per-sqm",
      featured: true,
      featuredOrder: 1,
      published: true,
      images: [
        { url: "/api/uploads/portfolio/general-glass-shopfront.jpg", altTh: "กระจกใสโฟลตติดตั้งเป็นหน้าร้าน", altEn: "Clear float glass installed as a shopfront" },
        { url: "/api/uploads/portfolio/general-glass-window.jpg", altTh: "กระจกใสโฟลตในบานหน้าต่าง", altEn: "Clear float glass in a window frame" },
      ],
      attributes: [
        "thickness:5mm",
        "thickness:6mm",
        "thickness:8mm",
        "color:clear",
        "edge-type:raw",
        "edge-type:polished",
        "size:1220x2440",
        "size:custom",
      ],
      variants: [
        { sku: "GL-CLR-001-5-RAW", price: 450, values: ["thickness:5mm", "edge-type:raw"], isDefault: true },
        { sku: "GL-CLR-001-5-POL", price: 520, values: ["thickness:5mm", "edge-type:polished"] },
        { sku: "GL-CLR-001-6-RAW", price: 540, values: ["thickness:6mm", "edge-type:raw"] },
        { sku: "GL-CLR-001-6-POL", price: 610, values: ["thickness:6mm", "edge-type:polished"] },
        { sku: "GL-CLR-001-8-RAW", price: 720, values: ["thickness:8mm", "edge-type:raw"] },
      ],
    },
    {
      slug: "tempered-safety-glass",
      sku: "GL-TMP-001",
      nameTh: "กระจกเทมเปอร์นิรภัย",
      nameEn: "Tempered Safety Glass",
      descriptionTh:
        "กระจกนิรภัยเทมเปอร์ผ่านการอบความร้อนสูง แข็งแรงกว่ากระจกธรรมดา 4-5 เท่า เมื่อแตกจะเป็นเม็ดเล็กไม่มีคม ผ่านมาตรฐาน มอก.",
      descriptionEn:
        "Heat-treated tempered safety glass, 4-5 times stronger than ordinary glass. Shatters into small blunt granules. TIS certified.",
      usageGuideTh:
        "ต้องตัดและเจาะรูให้เสร็จก่อนนำเข้าเตาอบ ไม่สามารถตัดหรือเจาะภายหลังได้ ระวังการกระแทกที่ขอบกระจกซึ่งเป็นจุดอ่อนที่สุด",
      usageGuideEn:
        "All cutting and drilling must be completed before tempering — the glass cannot be modified afterwards. Protect the edges, which are the weakest point.",
      coverImage: "/api/uploads/products/tempered-safety-glass.jpg",
      catalogPdf: "/api/uploads/products/catalogs/tempered-safety-glass.pdf",
      basePrice: 980,
      categorySlug: "glass",
      subCategorySlug: "glass/tempered",
      brandSlug: "thana-glass",
      unitCode: "sheet",
      pricingCode: "per-sqm",
      featured: true,
      featuredOrder: 2,
      published: true,
      images: [
        { url: "/api/uploads/portfolio/safety-glass-shower-screen.jpg", altTh: "ฉากกั้นอาบน้ำกระจกเทมเปอร์", altEn: "Tempered glass shower screen" },
        { url: "/api/uploads/portfolio/safety-glass-railing.jpg", altTh: "ราวกันตกกระจกเทมเปอร์", altEn: "Tempered glass balustrade" },
      ],
      attributes: [
        "thickness:6mm",
        "thickness:8mm",
        "thickness:10mm",
        "thickness:12mm",
        "color:clear",
        "color:green",
        "edge-type:seamed",
        "edge-type:polished",
        "size:custom",
      ],
      variants: [
        { sku: "GL-TMP-001-6-CLR", price: 980, values: ["thickness:6mm", "color:clear", "edge-type:polished"], isDefault: true },
        { sku: "GL-TMP-001-8-CLR", price: 1250, values: ["thickness:8mm", "color:clear", "edge-type:polished"] },
        { sku: "GL-TMP-001-10-CLR", price: 1580, values: ["thickness:10mm", "color:clear", "edge-type:polished"] },
        { sku: "GL-TMP-001-12-CLR", price: 1980, values: ["thickness:12mm", "color:clear", "edge-type:polished"] },
        { sku: "GL-TMP-001-8-GRN", price: 1390, values: ["thickness:8mm", "color:green", "edge-type:polished"] },
        { sku: "GL-TMP-001-10-GRN", price: 1720, values: ["thickness:10mm", "color:green", "edge-type:polished"] },
      ],
    },
    {
      slug: "frosted-decorative-glass",
      sku: "GL-FRS-001",
      nameTh: "กระจกฝ้าตกแต่ง",
      nameEn: "Frosted Decorative Glass",
      descriptionTh:
        "กระจกฝ้าผิวด้าน ให้ความเป็นส่วนตัวโดยยังคงปล่อยให้แสงธรรมชาติผ่าน เหมาะสำหรับผนังกั้นห้อง ประตูห้องน้ำ และงานตกแต่งภายใน",
      descriptionEn:
        "Matte frosted glass that provides privacy while letting natural light through. Ideal for partitions, bathroom doors, and interior features.",
      usageGuideTh:
        "หลีกเลี่ยงการใช้สารเคมีที่มีฤทธิ์กัดกร่อนบนผิวฝ้า เช็ดคราบด้วยผ้าชุบน้ำหมาดๆ ทันทีเพื่อป้องกันคราบฝัง",
      usageGuideEn:
        "Avoid abrasive chemicals on the frosted surface. Wipe stains promptly with a damp cloth to prevent them setting in.",
      coverImage: "/api/uploads/products/frosted-decorative-glass.jpg",
      basePrice: 780,
      categorySlug: "glass",
      subCategorySlug: "glass/frosted",
      brandSlug: "guardian",
      unitCode: "sheet",
      pricingCode: "per-sqm",
      published: true,
      images: [
        { url: "/api/uploads/portfolio/decorative-glass-partition.jpg", altTh: "ผนังกั้นห้องกระจกฝ้า", altEn: "Frosted glass room partition" },
        { url: "/api/uploads/categories/decorative-glass.jpg", altTh: "ผิวกระจกฝ้าระยะใกล้", altEn: "Close-up of the frosted surface" },
      ],
      attributes: ["thickness:5mm", "thickness:6mm", "thickness:8mm", "color:clear", "surface-finish:matte", "size:custom"],
      variants: [
        { sku: "GL-FRS-001-5", price: 780, values: ["thickness:5mm", "surface-finish:matte"], isDefault: true },
        { sku: "GL-FRS-001-6", price: 860, values: ["thickness:6mm", "surface-finish:matte"] },
        { sku: "GL-FRS-001-8", price: 1040, values: ["thickness:8mm", "surface-finish:matte"] },
      ],
    },
    {
      slug: "silver-mirror",
      sku: "GL-MIR-001",
      nameTh: "กระจกเงาเคลือบเงิน",
      nameEn: "Silver Mirror",
      descriptionTh:
        "กระจกเงาเคลือบเงินคุณภาพสูง เคลือบผิวหลังสองชั้นพร้อมสีป้องกันการกัดกร่อน ให้ภาพสะท้อนคมชัดไม่บิดเบี้ยว ไม่เกิดจุดดำที่ขอบง่าย",
      descriptionEn:
        "Premium silver-backed mirror with a double protective coating against corrosion. Delivers a sharp, distortion-free reflection and resists black edge spots.",
      usageGuideTh:
        "ติดตั้งด้วยกาวสำหรับกระจกเงาโดยเฉพาะ ห้ามใช้ซิลิโคนกรดซึ่งจะกัดผิวเคลือบเงินด้านหลัง และควรเว้นช่องระบายอากาศด้านหลังแผ่นเสมอ",
      usageGuideEn:
        "Fix with mirror-grade adhesive only — acidic silicone will attack the silver backing. Always leave a ventilation gap behind the panel.",
      coverImage: "/api/uploads/categories/decorative-glass.jpg",
      basePrice: 620,
      categorySlug: "glass",
      subCategorySlug: "glass/mirror",
      brandSlug: "agc",
      unitCode: "sheet",
      pricingCode: "per-sqm",
      published: true,
      images: [
        { url: "/api/uploads/products/clear-float-glass.jpg", altTh: "กระจกเงาเคลือบเงินตัดตามขนาด", altEn: "Custom-cut silver mirror" },
      ],
      attributes: ["thickness:5mm", "thickness:6mm", "edge-type:polished", "edge-type:beveled", "surface-finish:glossy", "size:custom"],
      variants: [
        { sku: "GL-MIR-001-5-POL", price: 620, values: ["thickness:5mm", "edge-type:polished"], isDefault: true },
        { sku: "GL-MIR-001-5-BEV", price: 720, values: ["thickness:5mm", "edge-type:beveled"] },
        { sku: "GL-MIR-001-6-POL", price: 750, values: ["thickness:6mm", "edge-type:polished"] },
      ],
    },

    // ---- อลูมิเนียม ----------------------------------------------------------
    {
      slug: "aluminum-sliding-door-profile",
      sku: "AL-DR-001",
      nameTh: "เส้นอลูมิเนียมประตูบานเลื่อน",
      nameEn: "Aluminum Sliding Door Profile",
      descriptionTh:
        "เส้นอลูมิเนียมสำหรับประตูบานเลื่อน กรอบบางดีไซน์ Slim Line แข็งแรง ทนทานต่อสภาพอากาศ ไม่เป็นสนิม",
      descriptionEn:
        "Slim-line aluminum profile for sliding doors. Strong, weather-resistant, and rust-free.",
      usageGuideTh:
        "ตัดเส้นด้วยใบเลื่อยสำหรับอลูมิเนียมโดยเฉพาะเพื่อไม่ให้ผิวเสียหาย ระวังการขูดขีดผิวอโนไดซ์ระหว่างขนย้าย",
      usageGuideEn:
        "Cut with an aluminum-specific saw blade to avoid surface damage. Protect the anodized finish from scratches during transport.",
      coverImage: "/api/uploads/products/aluminum-sliding-door-profile.jpg",
      catalogPdf: "/api/uploads/products/catalogs/aluminum-profiles.pdf",
      basePrice: 340,
      categorySlug: "aluminum",
      subCategorySlug: "aluminum/door-profile",
      brandSlug: "ykk",
      unitCode: "meter",
      pricingCode: "per-meter",
      featured: true,
      featuredOrder: 4,
      published: true,
      images: [
        { url: "/api/uploads/portfolio/aluminum-slim-door.jpg", altTh: "ประตูบานเลื่อนอลูมิเนียมหลังติดตั้ง", altEn: "Installed aluminum sliding door" },
        { url: "/api/uploads/portfolio/aluminum-window-frame.jpg", altTh: "รายละเอียดรางและเส้นอลูมิเนียม", altEn: "Aluminum track and profile detail" },
      ],
      attributes: ["color:black", "color:white", "color:anodized-silver", "surface-finish:matte", "surface-finish:brushed"],
      variants: [
        { sku: "AL-DR-001-BLK", price: 340, values: ["color:black", "surface-finish:matte"], isDefault: true },
        { sku: "AL-DR-001-WHT", price: 340, values: ["color:white", "surface-finish:matte"] },
        { sku: "AL-DR-001-SLV", price: 385, values: ["color:anodized-silver", "surface-finish:brushed"] },
      ],
    },
    {
      slug: "aluminum-composite-panel",
      sku: "AL-ACP-001",
      nameTh: "แผ่นอลูมิเนียมคอมโพสิต",
      nameEn: "Aluminum Composite Panel",
      descriptionTh:
        "แผ่นอลูมิเนียมคอมโพสิต (ACP) ประกบแผ่นอลูมิเนียมสองด้านเข้ากับไส้กลางโพลีเอทิลีน น้ำหนักเบา ผิวเรียบสนิท ดัดโค้งได้ นิยมใช้กรุผนังอาคารและงานป้าย",
      descriptionEn:
        "Aluminum composite panel (ACP) — two aluminum skins bonded to a polyethylene core. Lightweight, perfectly flat, and bendable. The standard for facade cladding and signage.",
      usageGuideTh:
        "เซาะร่องด้านหลังด้วยดอกวีคัตเพื่อพับขึ้นรูป ห้ามลอกฟิล์มกันรอยออกก่อนติดตั้งเสร็จ และควรเว้นช่องว่างสำหรับการยืดหดตัวที่รอยต่อทุกจุด",
      usageGuideEn:
        "Rout the back with a V-cut bit before folding. Keep the protective film on until installation is complete, and leave an expansion gap at every joint.",
      coverImage: "/api/uploads/categories/aluminum.jpg",
      basePrice: 1250,
      categorySlug: "aluminum",
      subCategorySlug: "aluminum/composite-panel",
      brandSlug: "scg",
      unitCode: "sheet",
      pricingCode: "per-sheet",
      published: true,
      images: [
        { url: "/api/uploads/products/aluminum-sliding-door-profile.jpg", altTh: "แผ่นอลูมิเนียมคอมโพสิตผิวเรียบ", altEn: "Flat-surface aluminum composite panel" },
      ],
      attributes: [
        "thickness:3-5mm",
        "thickness:4mm",
        "size:1220x2440",
        "color:white",
        "color:black",
        "color:anodized-silver",
        "surface-finish:glossy",
        "surface-finish:matte",
      ],
      variants: [
        { sku: "AL-ACP-001-35-WHT", price: 1250, values: ["thickness:3-5mm", "color:white", "surface-finish:glossy"], isDefault: true },
        { sku: "AL-ACP-001-4-WHT", price: 1450, values: ["thickness:4mm", "color:white", "surface-finish:glossy"] },
        { sku: "AL-ACP-001-4-BLK", price: 1520, values: ["thickness:4mm", "color:black", "surface-finish:matte"] },
        { sku: "AL-ACP-001-4-SLV", price: 1580, values: ["thickness:4mm", "color:anodized-silver", "surface-finish:glossy"] },
      ],
    },

    // ---- อุปกรณ์ติดตั้ง ------------------------------------------------------
    {
      slug: "stainless-glass-handle-304",
      sku: "HW-HDL-304",
      nameTh: "มือจับกระจกสแตนเลส เกรด 304",
      nameEn: "Stainless Steel Glass Handle Grade 304",
      descriptionTh:
        "มือจับประตูกระจกสแตนเลสเกรด 304 ดีไซน์โมเดิร์น ทนต่อการกัดกร่อน เหมาะกับงานภายในและภายนอก จำหน่ายเป็นคู่",
      descriptionEn:
        "Grade 304 stainless steel glass door handle with a modern design. Corrosion-resistant, suitable for indoor and outdoor use. Sold in pairs.",
      usageGuideTh:
        "ติดตั้งกับกระจกที่เจาะรูไว้แล้วเท่านั้น ขันน็อตให้แน่นพอดี ไม่ควรขันแรงเกินไปเพราะอาจทำให้กระจกร้าว",
      usageGuideEn:
        "Install only on pre-drilled glass. Tighten the bolts firmly but do not over-torque, as this can crack the glass.",
      coverImage: "/api/uploads/products/stainless-glass-handle.jpg",
      basePrice: 1450,
      categorySlug: "installation-hardware",
      subCategorySlug: "installation-hardware/handles",
      brandSlug: "thana-glass",
      unitCode: "set",
      pricingCode: "per-pair",
      published: true,
      images: [
        { url: "/api/uploads/portfolio/hardware-glass-handle.jpg", altTh: "มือจับกระจกสแตนเลสหลังติดตั้ง", altEn: "Installed stainless steel glass handle" },
      ],
      attributes: ["color:anodized-silver", "color:black", "surface-finish:brushed", "surface-finish:matte"],
      variants: [
        { sku: "HW-HDL-304-BRS", price: 1450, values: ["color:anodized-silver", "surface-finish:brushed"], isDefault: true },
        { sku: "HW-HDL-304-BLK", price: 1690, values: ["color:black", "surface-finish:matte"] },
      ],
    },
    {
      slug: "structural-silicone-sealant",
      sku: "HW-SLC-001",
      nameTh: "ซิลิโคนโครงสร้างชนิดกลาง",
      nameEn: "Neutral Cure Structural Silicone Sealant",
      descriptionTh:
        "ซิลิโคนยาแนวชนิดกลาง (Neutral Cure) สำหรับงานกระจกและอลูมิเนียมโดยเฉพาะ ไม่กัดกร่อนผิวโลหะและกระจกเงา ยืดหยุ่นสูง ทนแดดทนฝนไม่เหลืองไม่แตกลายงา",
      descriptionEn:
        "Neutral cure silicone sealant made for glass and aluminum work. Non-corrosive to metal and mirror backing, highly elastic, and resists yellowing and cracking.",
      usageGuideTh:
        "ทำความสะอาดผิวให้แห้งสนิทและปราศจากฝุ่นน้ำมันก่อนยิง ใช้เทปกาวกำหนดแนวเพื่อให้เส้นคม แล้วปาดแต่งภายใน 10 นาทีก่อนซิลิโคนเริ่มเซ็ตตัว",
      usageGuideEn:
        "Clean and fully dry the surface before applying. Mask the joint for a crisp line and tool the bead within 10 minutes, before skinning starts.",
      coverImage: "/api/uploads/categories/hardware-store.jpg",
      basePrice: 320,
      categorySlug: "installation-hardware",
      subCategorySlug: "installation-hardware/sealant",
      brandSlug: "dowsil",
      unitCode: "piece",
      pricingCode: "per-piece",
      published: true,
      images: [
        { url: "/api/uploads/products/stainless-glass-handle.jpg", altTh: "หลอดซิลิโคนโครงสร้าง", altEn: "Structural silicone cartridge" },
      ],
      attributes: ["color:clear", "color:black", "color:white"],
      variants: [
        { sku: "HW-SLC-001-CLR", price: 320, values: ["color:clear"], isDefault: true },
        { sku: "HW-SLC-001-BLK", price: 340, values: ["color:black"] },
        { sku: "HW-SLC-001-WHT", price: 340, values: ["color:white"] },
      ],
    },
  ];

  for (const p of productData) {
    const {
      categorySlug,
      subCategorySlug,
      brandSlug,
      unitCode,
      pricingCode,
      attributes,
      variants,
      images,
      ...product
    } = p;

    // Attributes belong to the product, so derive its set from the value keys
    // it declares. An attribute is a variant axis when a variant selects from it.
    const attributeSlugs = [...new Set(attributes.map((key) => key.split(":")[0]))];
    const axisSlugs = new Set(variants.flatMap((v) => v.values.map((key) => key.split(":")[0])));

    await prisma.product.create({
      data: {
        ...product,
        categoryId: categoryBy[categorySlug],
        subCategoryId: subCategoryBy[subCategorySlug],
        brandId: brandBy[brandSlug],
        unitId: unitBy[unitCode],
        pricingUnitId: pricingBy[pricingCode] ?? null,
        images: {
          create: images.map((image, i) => ({ ...image, sortOrder: i + 1 })),
        },
        attributes: {
          create: attributeSlugs.map((slug, i) => ({
            attributeId: attributeBy[slug],
            isVariantAxis: axisSlugs.has(slug),
            sortOrder: i + 1,
          })),
        },
        attributeLinks: {
          create: attributes.map((key) => ({ attributeValueId: attrValueBy[key] })),
        },
        variants: {
          create: variants.map((v, i) => {
            const { values, ...variant } = v;
            return {
              ...variant,
              sortOrder: i + 1,
              attributeValues: {
                create: values.map((key) => ({ attributeValueId: attrValueBy[key] })),
              },
            };
          }),
        },
      },
    });
  }

  // Product.searchText is a cache derived from the rows above, so it has to be
  // rebuilt here — otherwise search finds nothing until someone runs
  // `npm run search:reindex` by hand.
  console.log("Building search index...");
  const indexed = await reindexProducts();
  console.log(`  indexed ${indexed} products`);

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
