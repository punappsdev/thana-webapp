-- Attributes move from being registered per-category to being owned per-product.
-- Each product picks its own set, so `CategoryAttribute` is replaced by
-- `ProductAttribute`. Data is backfilled from the values products already carry
-- before the old table is dropped.

-- CreateTable
CREATE TABLE `ProductAttribute` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `isVariantAxis` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `productId` INTEGER NOT NULL,
    `attributeId` INTEGER NOT NULL,

    INDEX `ProductAttribute_attributeId_idx`(`attributeId`),
    UNIQUE INDEX `ProductAttribute_productId_attributeId_key`(`productId`, `attributeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill: every attribute a product already has a value for.
-- sortOrder inherits the dictionary order so existing spec tables keep their look.
INSERT INTO `ProductAttribute` (`productId`, `attributeId`, `sortOrder`, `isVariantAxis`)
SELECT DISTINCT pav.`productId`, av.`attributeId`, a.`sortOrder`, false
FROM `ProductAttributeValue` pav
JOIN `AttributeValue` av ON av.`id` = pav.`attributeValueId`
JOIN `Attribute` a ON a.`id` = av.`attributeId`;

-- Backfill: attributes reachable only through a variant (never linked at product
-- level) still need a row, otherwise the editor would drop them on next save.
INSERT INTO `ProductAttribute` (`productId`, `attributeId`, `sortOrder`, `isVariantAxis`)
SELECT DISTINCT pv.`productId`, av.`attributeId`, a.`sortOrder`, true
FROM `VariantAttributeValue` vav
JOIN `ProductVariant` pv ON pv.`id` = vav.`variantId`
JOIN `AttributeValue` av ON av.`id` = vav.`attributeValueId`
JOIN `Attribute` a ON a.`id` = av.`attributeId`
ON DUPLICATE KEY UPDATE `isVariantAxis` = true;

-- Mirror the product-level values of every variant axis back into
-- ProductAttributeValue so the spec table stays complete after the editor
-- starts deriving it from the attribute cards.
INSERT IGNORE INTO `ProductAttributeValue` (`productId`, `attributeValueId`)
SELECT DISTINCT pv.`productId`, vav.`attributeValueId`
FROM `VariantAttributeValue` vav
JOIN `ProductVariant` pv ON pv.`id` = vav.`variantId`;

-- DropForeignKey
ALTER TABLE `CategoryAttribute` DROP FOREIGN KEY `CategoryAttribute_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `CategoryAttribute` DROP FOREIGN KEY `CategoryAttribute_attributeId_fkey`;

-- DropTable
DROP TABLE `CategoryAttribute`;

-- AddForeignKey
ALTER TABLE `ProductAttribute` ADD CONSTRAINT `ProductAttribute_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAttribute` ADD CONSTRAINT `ProductAttribute_attributeId_fkey` FOREIGN KEY (`attributeId`) REFERENCES `Attribute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
