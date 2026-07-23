-- CreateTable
CREATE TABLE `Banner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titleTh` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NOT NULL,
    `subtitleTh` VARCHAR(191) NULL,
    `subtitleEn` VARCHAR(191) NULL,
    `descriptionTh` TEXT NULL,
    `descriptionEn` TEXT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `buttonTextTh` VARCHAR(191) NULL,
    `buttonTextEn` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `type` ENUM('HOMEPAGE', 'PROMOTION') NOT NULL DEFAULT 'HOMEPAGE',
    `endDate` DATETIME(3) NULL,
    `startDate` DATETIME(3) NULL,

    INDEX `Banner_type_published_sortOrder_idx`(`type`, `published`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
