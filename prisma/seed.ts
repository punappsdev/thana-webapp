import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Cleaning old data...");
  await prisma.article.deleteMany({});
  await prisma.articleCategory.deleteMany({});
  await prisma.work.deleteMany({});
  await prisma.workCategory.deleteMany({});

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

  console.log("Seeding work categories...");
  const workCategories = await Promise.all(
    [
      { slug: "general-glass", nameTh: "กระจกทั่วไป", nameEn: "General Glass" },
      { slug: "safety-glass", nameTh: "กระจกนิรภัย", nameEn: "Safety Glass" },
      { slug: "decorative-glass", nameTh: "กระจกตกแต่ง", nameEn: "Decorative Glass" },
      { slug: "aluminum", nameTh: "อลูมิเนียม", nameEn: "Aluminum" },
      { slug: "installation-hardware", nameTh: "อุปกรณ์ติดตั้ง", nameEn: "Installation Hardware" },
      { slug: "zinc-sheet", nameTh: "แผ่นซิปซั่ม", nameEn: "Zinc Sheets" },
    ].map((cat) => prisma.workCategory.create({ data: cat }))
  );
  const [catGeneralGlass, catSafetyGlass, catDecorativeGlass, catAluminum, catHardware, catZincSheet] = workCategories;

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
        workCategoryId: catGeneralGlass.id,
      },
      {
        slug: "general-glass-window",
        titleTh: "หน้าต่างกระจกใสบ้านพักอาศัย",
        titleEn: "Clear Glass Residential Windows",
        descriptionTh: "หน้าต่างกระจกใสสำหรับบ้านพัก รับแสงธรรมชาติเข้าบ้านเต็มพื้นที่",
        descriptionEn: "Clear glass windows for homes, maximizing natural daylight in every room.",
        coverImage: "/api/uploads/portfolio/general-glass-window.jpg",
        published: true,
        workCategoryId: catGeneralGlass.id,
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
        workCategoryId: catSafetyGlass.id,
      },
      {
        slug: "safety-glass-railing",
        titleTh: "ราวกันตกกระจกลามิเนต",
        titleEn: "Laminated Glass Balustrade",
        descriptionTh: "ราวกันตกกระจกลามิเนตสำหรับระเบียงและบันได ผ่านมาตรฐาน มอก.",
        descriptionEn: "Laminated glass balustrade for balconies and staircases, TIS-certified for safety.",
        coverImage: "/api/uploads/portfolio/safety-glass-railing.jpg",
        published: true,
        workCategoryId: catSafetyGlass.id,
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
        workCategoryId: catDecorativeGlass.id,
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
        workCategoryId: catAluminum.id,
      },
      {
        slug: "aluminum-window-frame",
        titleTh: "ขอบหน้าต่างอลูมิเนียมสีขาว",
        titleEn: "White Aluminum Window Frame",
        descriptionTh: "ขอบหน้าต่างอลูมิเนียมสีขาว ทนทานต่อสภาพอากาศ กันสนิม",
        descriptionEn: "White aluminum window frames — weather-resistant and rust-free.",
        coverImage: "/api/uploads/portfolio/aluminum-window-frame.jpg",
        published: true,
        workCategoryId: catAluminum.id,
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
        workCategoryId: catHardware.id,
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
        workCategoryId: catZincSheet.id,
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
