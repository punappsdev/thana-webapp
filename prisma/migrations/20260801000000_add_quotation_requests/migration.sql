-- Quotation requests submitted from the public /quote form.
-- The site quotes on request only, so these carry no prices — just who asked and
-- what they want quoted. QuotationItem snapshots the product name in both locales
-- and points at Product/ProductVariant with ON DELETE SET NULL, so a catalog
-- reseed (prisma/seed.ts wipes Product) never destroys a real customer request.

-- CreateTable
CREATE TABLE `QuotationRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL,
    `firstName` VARCHAR(120) NOT NULL,
    `lastName` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `email` VARCHAR(191) NULL,
    `lineId` VARCHAR(120) NULL,
    `needTaxInvoice` BOOLEAN NOT NULL DEFAULT false,
    `companyName` VARCHAR(255) NULL,
    `taxId` VARCHAR(20) NULL,
    `addressLine` VARCHAR(255) NULL,
    `subDistrict` VARCHAR(120) NULL,
    `district` VARCHAR(120) NULL,
    `province` VARCHAR(64) NULL,
    `postalCode` VARCHAR(10) NULL,
    `consentAt` DATETIME(3) NOT NULL,
    `locale` VARCHAR(5) NOT NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(255) NULL,
    `adminNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QuotationRequest_code_key`(`code`),
    INDEX `QuotationRequest_createdAt_idx`(`createdAt`),
    INDEX `QuotationRequest_phone_idx`(`phone`),
    INDEX `QuotationRequest_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuotationItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `variantId` INTEGER NULL,
    `productNameTh` VARCHAR(255) NOT NULL,
    `productNameEn` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(64) NULL,
    `optionsTh` VARCHAR(500) NULL,
    `optionsEn` VARCHAR(500) NULL,
    `qty` INTEGER NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `QuotationItem_requestId_idx`(`requestId`),
    INDEX `QuotationItem_productId_idx`(`productId`),
    INDEX `QuotationItem_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QuotationItem` ADD CONSTRAINT `QuotationItem_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `QuotationRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuotationItem` ADD CONSTRAINT `QuotationItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuotationItem` ADD CONSTRAINT `QuotationItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
