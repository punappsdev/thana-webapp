-- CreateTable
CREATE TABLE `WorkImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `altTh` VARCHAR(191) NULL,
    `altEn` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `workId` INTEGER NOT NULL,

    INDEX `WorkImage_workId_idx`(`workId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WorkImage` ADD CONSTRAINT `WorkImage_workId_fkey` FOREIGN KEY (`workId`) REFERENCES `Work`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
