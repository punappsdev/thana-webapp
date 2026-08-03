-- ผูกโปรโมชั่นเข้ากับแคตตาล็อก เพื่อให้หน้ารายละเอียดสินค้าแสดงโปรโมชั่นที่เกี่ยวข้องได้
--
-- เงื่อนไขการมองเห็นเป็นแบบ OR: สินค้าหนึ่งตัวจะเห็นโปรโมชั่นเมื่อเข้าเงื่อนไขข้อใด
-- ข้อหนึ่ง — showOnAllProducts, ผูกหมวดหมู่หลักของสินค้า, ผูกหมวดหมู่ย่อยของสินค้า
-- หรือผูกสินค้าตัวนั้นตรง ๆ แอดมินจึงผสมได้อิสระในฟอร์มเดียว
--
-- โปรโมชั่นที่มีอยู่เดิมได้ showOnAllProducts = false และไม่มีแถวในตารางผูกใด ๆ
-- (ตั้งใจไม่ backfill) หน้าเว็บจึงไม่เปลี่ยนแปลงจนกว่าแอดมินจะเข้าไปตั้งค่าเอง
--
-- ทุกตารางผูกใช้ ON DELETE CASCADE ทั้งสองฝั่ง: ลบโปรโมชั่น สินค้า หรือหมวดหมู่
-- แล้วการผูกที่ค้างอยู่หายตามไปเอง ไม่ต้องเก็บกวาดในโค้ด

-- AlterTable
ALTER TABLE `Promotion` ADD COLUMN `showOnAllProducts` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `PromotionProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `promotionId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,

    INDEX `PromotionProduct_productId_idx`(`productId`),
    UNIQUE INDEX `PromotionProduct_promotionId_productId_key`(`promotionId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromotionCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `promotionId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,

    INDEX `PromotionCategory_categoryId_idx`(`categoryId`),
    UNIQUE INDEX `PromotionCategory_promotionId_categoryId_key`(`promotionId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromotionSubCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `promotionId` INTEGER NOT NULL,
    `subCategoryId` INTEGER NOT NULL,

    INDEX `PromotionSubCategory_subCategoryId_idx`(`subCategoryId`),
    UNIQUE INDEX `PromotionSubCategory_promotionId_subCategoryId_key`(`promotionId`, `subCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PromotionProduct` ADD CONSTRAINT `PromotionProduct_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionProduct` ADD CONSTRAINT `PromotionProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionCategory` ADD CONSTRAINT `PromotionCategory_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionCategory` ADD CONSTRAINT `PromotionCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionSubCategory` ADD CONSTRAINT `PromotionSubCategory_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionSubCategory` ADD CONSTRAINT `PromotionSubCategory_subCategoryId_fkey` FOREIGN KEY (`subCategoryId`) REFERENCES `SubCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
