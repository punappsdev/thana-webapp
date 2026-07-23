-- AlterTable
ALTER TABLE `Banner` ADD COLUMN `promotionId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Banner_promotionId_idx` ON `Banner`(`promotionId`);

-- AddForeignKey
ALTER TABLE `Banner` ADD CONSTRAINT `Banner_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
