import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Cleaning old data...");
  await prisma.article.deleteMany({});
  await prisma.articleCategory.deleteMany({});
  await prisma.work.deleteMany({});
  await prisma.news.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.variantAttributeValue.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productAttributeValue.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.categoryAttribute.deleteMany({});
  await prisma.attributeValue.deleteMany({});
  await prisma.attribute.deleteMany({});
  await prisma.subCategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.productUnit.deleteMany({});
  await prisma.pricingUnit.deleteMany({});

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

  console.log("Seeding categories (shared by products and portfolio)...");
  const categoryData = [
    {
      slug: "general-glass",
      nameTh: "กระจกทั่วไป",
      nameEn: "General Glass",
      descriptionTh: "กระจกใส กระจกสี และกระจกเงาสำหรับงานทั่วไป",
      descriptionEn: "Clear, tinted, and mirror glass for general applications.",
      sortOrder: 1,
      subs: [
        { slug: "clear-float", nameTh: "กระจกใสโฟลต", nameEn: "Clear Float Glass" },
        { slug: "tinted", nameTh: "กระจกสีตัดแสง", nameEn: "Tinted Glass" },
        { slug: "mirror", nameTh: "กระจกเงา", nameEn: "Mirror" },
      ],
    },
    {
      slug: "decorative-glass",
      nameTh: "กระจกตกแต่ง",
      nameEn: "Decorative Glass",
      descriptionTh: "กระจกลาย กระจกฝ้า และกระจกพ่นทรายสำหรับงานตกแต่ง",
      descriptionEn: "Patterned, frosted, and sandblasted glass for interior design.",
      sortOrder: 2,
      subs: [
        { slug: "patterned", nameTh: "กระจกลาย", nameEn: "Patterned Glass" },
        { slug: "frosted", nameTh: "กระจกฝ้า", nameEn: "Frosted Glass" },
        { slug: "sandblasted", nameTh: "กระจกพ่นทราย", nameEn: "Sandblasted Glass" },
      ],
    },
    {
      slug: "safety-glass",
      nameTh: "กระจกนิรภัย",
      nameEn: "Safety Glass",
      descriptionTh: "กระจกเทมเปอร์และกระจกลามิเนตที่ผ่านมาตรฐานความปลอดภัย",
      descriptionEn: "Tempered and laminated glass certified for safety applications.",
      sortOrder: 3,
      subs: [
        { slug: "tempered", nameTh: "กระจกเทมเปอร์", nameEn: "Tempered Glass" },
        { slug: "laminated", nameTh: "กระจกลามิเนต", nameEn: "Laminated Glass" },
        { slug: "insulated", nameTh: "กระจกฉนวนสองชั้น", nameEn: "Insulated Glass" },
      ],
    },
    {
      slug: "gypsum",
      nameTh: "ยิปซั่ม",
      nameEn: "Gypsum",
      descriptionTh: "แผ่นยิปซั่มและโครงคร่าวสำหรับงานฝ้าเพดานและผนังเบา",
      descriptionEn: "Gypsum boards and framing for ceilings and lightweight walls.",
      sortOrder: 4,
      subs: [
        { slug: "standard-board", nameTh: "แผ่นยิปซั่มมาตรฐาน", nameEn: "Standard Board" },
        { slug: "moisture-resistant", nameTh: "แผ่นยิปซั่มทนชื้น", nameEn: "Moisture Resistant Board" },
        { slug: "ceiling-frame", nameTh: "โครงคร่าวฝ้า", nameEn: "Ceiling Frame" },
      ],
    },
    {
      slug: "aluminum",
      nameTh: "อลูมิเนียม",
      nameEn: "Aluminum",
      descriptionTh: "เส้นอลูมิเนียมสำหรับประตู หน้าต่าง และงานโครงสร้าง",
      descriptionEn: "Aluminum profiles for doors, windows, and structural work.",
      sortOrder: 5,
      subs: [
        { slug: "door-profile", nameTh: "เส้นอลูมิเนียมประตู", nameEn: "Door Profile" },
        { slug: "window-profile", nameTh: "เส้นอลูมิเนียมหน้าต่าง", nameEn: "Window Profile" },
        { slug: "partition-profile", nameTh: "เส้นอลูมิเนียมกั้นห้อง", nameEn: "Partition Profile" },
      ],
    },
    {
      slug: "hardware-store",
      nameTh: "คลังอุปกรณ์",
      nameEn: "Hardware Store",
      descriptionTh: "อุปกรณ์ติดตั้ง มือจับ บานพับ ซิลิโคน และวัสดุสิ้นเปลือง",
      descriptionEn: "Installation hardware, handles, hinges, sealants, and consumables.",
      sortOrder: 6,
      subs: [
        { slug: "handles", nameTh: "มือจับ", nameEn: "Handles" },
        { slug: "hinges", nameTh: "บานพับและอุปกรณ์ยึด", nameEn: "Hinges & Fittings" },
        { slug: "sealant", nameTh: "ซิลิโคนและกาว", nameEn: "Sealants & Adhesives" },
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
  await prisma.work.createMany({
    data: [
      // General Glass
      {
        slug: "general-glass-shopfront",
        titleTh: "หน้ากุ๊กประตูกระจกร้านค้า",
        titleEn: "Glass Shopfront Front Door",
        descriptionTh: "ติดตั้งกระจกใสใบใหญ่สำหรับหน้าร้านค้า ให้มองเห็นสินค้าได้ชัดเจน สวยงามและทันสมัย",
        descriptionEn: "Clear large-pane glass installation for shopfronts, offering a clear product view with a modern look.",
        coverImage: "/api/uploads/portfolio/general-glass-shopfront.jpg",
        published: true,
        categoryId: categoryBy["general-glass"],
      },
      {
        slug: "general-glass-window",
        titleTh: "หน้าต่างกระจกใสบ้านพักอาศัย",
        titleEn: "Clear Glass Residential Windows",
        descriptionTh: "หน้าต่างกระจกใสสำหรับบ้านพัก รับแสงธรรมชาติเข้าบ้านเต็มพื้นที่",
        descriptionEn: "Clear glass windows for homes, maximizing natural daylight in every room.",
        coverImage: "/api/uploads/portfolio/general-glass-window.jpg",
        published: true,
        categoryId: categoryBy["general-glass"],
      },
      // Safety Glass
      {
        slug: "safety-glass-shower-screen",
        titleTh: "ฉากกั้นอาบน้ำกระจกเทมเปอร์",
        titleEn: "Tempered Glass Shower Screen",
        descriptionTh: "ฉากกั้นอาบน้ำกระจกเทมเปอร์ หนา 10 มม. ปลอดภัย ทนทาน ทำความสะอาดง่าย",
        descriptionEn: "10mm tempered glass shower screen — safe, durable, and easy to clean.",
        coverImage: "/api/uploads/portfolio/safety-glass-shower-screen.jpg",
        published: true,
        categoryId: categoryBy["safety-glass"],
      },
      {
        slug: "safety-glass-railing",
        titleTh: "ราวกันตกกระจกลามิเนต",
        titleEn: "Laminated Glass Balustrade",
        descriptionTh: "ราวกันตกกระจกลามิเนตสำหรับระเบียงและบันได ผ่านมาตรฐาน มอก.",
        descriptionEn: "Laminated glass balustrade for balconies and staircases, TIS-certified for safety.",
        coverImage: "/api/uploads/portfolio/safety-glass-railing.jpg",
        published: true,
        categoryId: categoryBy["safety-glass"],
      },
      // Decorative Glass
      {
        slug: "decorative-glass-partition",
        titleTh: "ผนังกั้นกระจกลาย",
        titleEn: "Decorative Glass Partition",
        descriptionTh: "ผนังกั้นกระจกลายสวยสำหรับสำนักงาน เพิ่มความเป็นส่วนตัวโดยไม่ทึบ",
        descriptionEn: "Patterned decorative glass partition for offices — privacy without losing light.",
        coverImage: "/api/uploads/portfolio/decorative-glass-partition.jpg",
        published: true,
        categoryId: categoryBy["decorative-glass"],
      },
      // Aluminum
      {
        slug: "aluminum-slim-door",
        titleTh: "ประตูบานเลื่อนอลูมิเนียมกรอบบาง",
        titleEn: "Slim Aluminum Sliding Door",
        descriptionTh: "ประตูบานเลื่อนอลูมิเนียม Slim Line กรอบบาง โอบรับกระจกใบใหญ่ดูโปร่ง",
        descriptionEn: "Slim-line aluminum sliding door — ultra-thin frames for a wide, airy glass view.",
        coverImage: "/api/uploads/portfolio/aluminum-slim-door.jpg",
        published: true,
        categoryId: categoryBy["aluminum"],
      },
      {
        slug: "aluminum-window-frame",
        titleTh: "ขอบหน้าต่างอลูมิเนียมสีขาว",
        titleEn: "White Aluminum Window Frame",
        descriptionTh: "ขอบหน้าต่างอลูมิเนียมสีขาว ทนทานต่อสภาพอากาศ กันสนิม",
        descriptionEn: "White aluminum window frames — weather-resistant and rust-free.",
        coverImage: "/api/uploads/portfolio/aluminum-window-frame.jpg",
        published: true,
        categoryId: categoryBy["aluminum"],
      },
      // Installation Hardware
      {
        slug: "hardware-glass-handle",
        titleTh: "มือจับกระจกสแตนเลสเกรด 304",
        titleEn: "Stainless Steel Glass Handle Grade 304",
        descriptionTh: "มือจับกระจกสแตนเลสเกรด 304 ดีไซน์โมเดิร์น ทนทานการใช้งานหนัก",
        descriptionEn: "Grade 304 stainless steel glass handle — modern design built for heavy use.",
        coverImage: "/api/uploads/portfolio/hardware-glass-handle.jpg",
        published: true,
        categoryId: categoryBy["hardware-store"],
      },
      // Zinc Sheets
      {
        slug: "zinc-sheet-roofing",
        titleTh: "หลังคาแผ่นซิปซั่มโรงงาน",
        titleEn: "Zinc Sheet Factory Roofing",
        descriptionTh: "ติดตั้งหลังคาแผ่นซิปซั่มสำหรับโรงงานและโกดัง ทนทานต่อทุกสภาพอากาศ",
        descriptionEn: "Zinc sheet roofing installation for factories and warehouses, built to withstand any weather.",
        coverImage: "/api/uploads/portfolio/zinc-sheet-roofing.jpg",
        published: true,
        categoryId: categoryBy["gypsum"],
      },
    ],
  });

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
        { slug: "5mm", valueTh: "5 มม.", valueEn: "5 mm", numericValue: 5 },
        { slug: "6mm", valueTh: "6 มม.", valueEn: "6 mm", numericValue: 6 },
        { slug: "8mm", valueTh: "8 มม.", valueEn: "8 mm", numericValue: 8 },
        { slug: "10mm", valueTh: "10 มม.", valueEn: "10 mm", numericValue: 10 },
        { slug: "12mm", valueTh: "12 มม.", valueEn: "12 mm", numericValue: 12 },
        { slug: "9-5mm", valueTh: "9.5 มม.", valueEn: "9.5 mm", numericValue: 9.5 },
        { slug: "12-5mm", valueTh: "12.5 มม.", valueEn: "12.5 mm", numericValue: 12.5 },
      ],
    },
    {
      slug: "size",
      nameTh: "ขนาด",
      nameEn: "Size",
      inputType: "SELECT" as const,
      sortOrder: 2,
      values: [
        { slug: "1220x2440", valueTh: "1220 x 2440 มม.", valueEn: "1220 x 2440 mm" },
        { slug: "1220x3000", valueTh: "1220 x 3000 มม.", valueEn: "1220 x 3000 mm" },
        { slug: "1830x2440", valueTh: "1830 x 2440 มม.", valueEn: "1830 x 2440 mm" },
        { slug: "2440x3660", valueTh: "2440 x 3660 มม.", valueEn: "2440 x 3660 mm" },
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

  console.log("Linking attributes to categories...");
  const categoryAttributeMap: Record<string, string[]> = {
    "general-glass": ["thickness", "size", "color", "edge-type"],
    "decorative-glass": ["thickness", "size", "color", "surface-finish"],
    "safety-glass": ["thickness", "size", "color", "edge-type"],
    gypsum: ["thickness", "size"],
    aluminum: ["size", "color", "surface-finish"],
    "hardware-store": ["color", "surface-finish"],
  };
  for (const [catSlug, attrSlugs] of Object.entries(categoryAttributeMap)) {
    await prisma.categoryAttribute.createMany({
      data: attrSlugs.map((attrSlug, i) => ({
        categoryId: categoryBy[catSlug],
        attributeId: attributeBy[attrSlug],
        sortOrder: i + 1,
      })),
    });
  }

  console.log("Seeding products...");
  const productData = [
    {
      slug: "clear-float-glass",
      sku: "GG-CLR-001",
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
      categorySlug: "general-glass",
      subCategorySlug: "general-glass/clear-float",
      brandSlug: "agc",
      unitCode: "sheet",
      pricingCode: "per-sqm",
      featured: true,
      published: true,
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
        { sku: "GG-CLR-001-5-RAW", price: 450, values: ["thickness:5mm", "edge-type:raw"], isDefault: true },
        { sku: "GG-CLR-001-5-POL", price: 520, values: ["thickness:5mm", "edge-type:polished"] },
        { sku: "GG-CLR-001-6-RAW", price: 540, values: ["thickness:6mm", "edge-type:raw"] },
        { sku: "GG-CLR-001-6-POL", price: 610, values: ["thickness:6mm", "edge-type:polished"] },
        { sku: "GG-CLR-001-8-RAW", price: 720, values: ["thickness:8mm", "edge-type:raw"] },
      ],
    },
    {
      slug: "tempered-safety-glass",
      sku: "SG-TMP-001",
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
      categorySlug: "safety-glass",
      subCategorySlug: "safety-glass/tempered",
      brandSlug: "thana-glass",
      unitCode: "sheet",
      pricingCode: "per-sqm",
      featured: true,
      published: true,
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
        { sku: "SG-TMP-001-6-CLR", price: 980, values: ["thickness:6mm", "color:clear", "edge-type:polished"], isDefault: true },
        { sku: "SG-TMP-001-8-CLR", price: 1250, values: ["thickness:8mm", "color:clear", "edge-type:polished"] },
        { sku: "SG-TMP-001-10-CLR", price: 1580, values: ["thickness:10mm", "color:clear", "edge-type:polished"] },
        { sku: "SG-TMP-001-12-CLR", price: 1980, values: ["thickness:12mm", "color:clear", "edge-type:polished"] },
        { sku: "SG-TMP-001-8-GRN", price: 1390, values: ["thickness:8mm", "color:green", "edge-type:polished"] },
        { sku: "SG-TMP-001-10-GRN", price: 1720, values: ["thickness:10mm", "color:green", "edge-type:polished"] },
      ],
    },
    {
      slug: "frosted-decorative-glass",
      sku: "DG-FRS-001",
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
      categorySlug: "decorative-glass",
      subCategorySlug: "decorative-glass/frosted",
      brandSlug: "guardian",
      unitCode: "sheet",
      pricingCode: "per-sqm",
      published: true,
      attributes: ["thickness:5mm", "thickness:6mm", "thickness:8mm", "color:clear", "surface-finish:matte", "size:custom"],
      variants: [
        { sku: "DG-FRS-001-5", price: 780, values: ["thickness:5mm", "surface-finish:matte"], isDefault: true },
        { sku: "DG-FRS-001-6", price: 860, values: ["thickness:6mm", "surface-finish:matte"] },
        { sku: "DG-FRS-001-8", price: 1040, values: ["thickness:8mm", "surface-finish:matte"] },
      ],
    },
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
      categorySlug: "gypsum",
      subCategorySlug: "gypsum/standard-board",
      brandSlug: "gyproc",
      unitCode: "sheet",
      pricingCode: "per-sheet",
      published: true,
      attributes: ["thickness:9-5mm", "thickness:12-5mm", "size:1220x2440", "size:1220x3000"],
      variants: [
        { sku: "GY-STD-001-95-2440", price: 165, values: ["thickness:9-5mm", "size:1220x2440"], isDefault: true, stockQty: 320 },
        { sku: "GY-STD-001-95-3000", price: 205, values: ["thickness:9-5mm", "size:1220x3000"], stockQty: 180 },
        { sku: "GY-STD-001-125-2440", price: 215, values: ["thickness:12-5mm", "size:1220x2440"], stockQty: 240 },
        { sku: "GY-STD-001-125-3000", price: 265, values: ["thickness:12-5mm", "size:1220x3000"], stockQty: 96 },
      ],
    },
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
      published: true,
      attributes: ["color:black", "color:white", "color:anodized-silver", "surface-finish:matte", "surface-finish:brushed"],
      variants: [
        { sku: "AL-DR-001-BLK", price: 340, values: ["color:black", "surface-finish:matte"], isDefault: true },
        { sku: "AL-DR-001-WHT", price: 340, values: ["color:white", "surface-finish:matte"] },
        { sku: "AL-DR-001-SLV", price: 385, values: ["color:anodized-silver", "surface-finish:brushed"] },
      ],
    },
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
      categorySlug: "hardware-store",
      subCategorySlug: "hardware-store/handles",
      brandSlug: "thana-glass",
      unitCode: "set",
      pricingCode: "per-pair",
      published: true,
      attributes: ["color:anodized-silver", "color:black", "surface-finish:brushed", "surface-finish:matte"],
      variants: [
        { sku: "HW-HDL-304-BRS", price: 1450, values: ["color:anodized-silver", "surface-finish:brushed"], isDefault: true, stockQty: 45 },
        { sku: "HW-HDL-304-BLK", price: 1690, values: ["color:black", "surface-finish:matte"], stockQty: 22 },
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
      ...product
    } = p;

    await prisma.product.create({
      data: {
        ...product,
        categoryId: categoryBy[categorySlug],
        subCategoryId: subCategoryBy[subCategorySlug],
        brandId: brandBy[brandSlug],
        unitId: unitBy[unitCode],
        pricingUnitId: pricingBy[pricingCode] ?? null,
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
