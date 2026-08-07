-- AlterTable
ALTER TABLE `QuotationItem` ADD COLUMN `customFieldsEn` VARCHAR(255) NULL,
    ADD COLUMN `customFieldsTh` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `ProductCustomField` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `labelTh` VARCHAR(60) NOT NULL,
    `labelEn` VARCHAR(60) NOT NULL,
    `unitTh` VARCHAR(20) NOT NULL,
    `unitEn` VARCHAR(20) NOT NULL,
    `minValue` DECIMAL(12, 3) NOT NULL,
    `maxValue` DECIMAL(12, 3) NOT NULL,
    `step` DECIMAL(12, 3) NOT NULL DEFAULT 1,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `productId` INTEGER NOT NULL,
    `triggerValueId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductCustomField_productId_idx`(`productId`),
    INDEX `ProductCustomField_triggerValueId_idx`(`triggerValueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductCustomField` ADD CONSTRAINT `ProductCustomField_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCustomField` ADD CONSTRAINT `ProductCustomField_triggerValueId_fkey` FOREIGN KEY (`triggerValueId`) REFERENCES `AttributeValue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
