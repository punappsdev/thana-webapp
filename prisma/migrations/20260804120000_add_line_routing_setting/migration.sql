-- พารามิเตอร์ของกฎเลือกกลุ่มไลน์ทีมขาย ย้ายออกจากค่าคงที่ใน lib/line/routing.ts
-- ลงฐานข้อมูล เพื่อให้แก้จาก /admin/settings/line-routing ได้โดยไม่ต้อง deploy ใหม่
--
-- ท้ายไฟล์เติมค่าที่เคย hardcode ไว้กลับเข้าไปด้วย เพื่อให้พฤติกรรมหลังรัน migration นี้
-- เหมือนเดิมทุกประการ ไม่ใช่เริ่มจากค่าว่าง

-- CreateTable
CREATE TABLE `LineRoutingSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `hqDistrictCodes` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LineRoutingFactoryCategory` (
    `settingId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,

    INDEX `LineRoutingFactoryCategory_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`settingId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LineRoutingFactoryExcludedSubCategory` (
    `settingId` INTEGER NOT NULL,
    `subCategoryId` INTEGER NOT NULL,

    INDEX `LineRoutingFactoryExcludedSubCategory_subCategoryId_idx`(`subCategoryId`),
    PRIMARY KEY (`settingId`, `subCategoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LineRoutingFactoryProduct` (
    `settingId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `include` BOOLEAN NOT NULL,

    INDEX `LineRoutingFactoryProduct_productId_idx`(`productId`),
    PRIMARY KEY (`settingId`, `productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LineRoutingFactoryCategory` ADD CONSTRAINT `LineRoutingFactoryCategory_settingId_fkey` FOREIGN KEY (`settingId`) REFERENCES `LineRoutingSetting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineRoutingFactoryCategory` ADD CONSTRAINT `LineRoutingFactoryCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineRoutingFactoryExcludedSubCategory` ADD CONSTRAINT `LineRoutingFactoryExcludedSubCategory_settingId_fkey` FOREIGN KEY (`settingId`) REFERENCES `LineRoutingSetting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineRoutingFactoryExcludedSubCategory` ADD CONSTRAINT `LineRoutingFactoryExcludedSubCategory_subCategoryId_fkey` FOREIGN KEY (`subCategoryId`) REFERENCES `SubCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineRoutingFactoryProduct` ADD CONSTRAINT `LineRoutingFactoryProduct_settingId_fkey` FOREIGN KEY (`settingId`) REFERENCES `LineRoutingSetting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LineRoutingFactoryProduct` ADD CONSTRAINT `LineRoutingFactoryProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed แถวเดียวของตารางตั้งค่า พร้อมรหัสอำเภอเดิม 8301 (เมืองภูเก็ต) และ 8302 (กะทู้)
INSERT INTO `LineRoutingSetting` (`id`, `hqDistrictCodes`, `updatedAt`)
VALUES (1, JSON_ARRAY('8301', '8302'), CURRENT_TIMESTAMP(3));

-- หมวดหลักที่โรงงานรับทำ = หมวดกระจก
INSERT INTO `LineRoutingFactoryCategory` (`settingId`, `categoryId`)
SELECT 1, `id` FROM `Category` WHERE `slug` = 'glass';

-- หมวดย่อยที่ยกเว้น = กระจกตกแต่ง (สังเกตว่าเป็น decorate- ไม่ใช่ decorative-)
INSERT INTO `LineRoutingFactoryExcludedSubCategory` (`settingId`, `subCategoryId`)
SELECT 1, `sub`.`id`
FROM `SubCategory` AS `sub`
JOIN `Category` AS `cat` ON `cat`.`id` = `sub`.`categoryId`
WHERE `cat`.`slug` = 'glass' AND `sub`.`slug` = 'decorate-glass';

-- ข้อยกเว้นรายสินค้าชุดเดิม ซึ่งเคยเทียบด้วยชื่อขึ้นต้น
-- ตั้งแต่นี้ไปผูกด้วย id แล้ว การเปลี่ยนชื่อสินค้าจึงไม่กระทบการเลือกกลุ่มอีก
INSERT INTO `LineRoutingFactoryProduct` (`settingId`, `productId`, `include`)
SELECT 1, `id`, true FROM `Product` WHERE `nameTh` LIKE 'กระจกพ่นทราย%';

INSERT INTO `LineRoutingFactoryProduct` (`settingId`, `productId`, `include`)
SELECT 1, `id`, false FROM `Product` WHERE `nameTh` LIKE 'กระจกลายดอกพิกุลเศรษฐี%';
