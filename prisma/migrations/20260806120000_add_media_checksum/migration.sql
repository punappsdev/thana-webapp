-- AlterTable
ALTER TABLE `MediaAsset` ADD COLUMN `checksum` CHAR(64) NULL;

-- CreateIndex
CREATE INDEX `MediaAsset_checksum_idx` ON `MediaAsset`(`checksum`);

-- CreateIndex
CREATE INDEX `MediaAsset_originalName_idx` ON `MediaAsset`(`originalName`);
