-- Promotion popup shown on the homepage. Kept separate from Banner because its
-- startDate/endDate actually gate visibility (Banner only uses them for a
-- countdown label) and because a popup is an image-only creative.

-- CreateTable
CREATE TABLE `PromotionPopup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `altTh` VARCHAR(191) NULL,
    `altEn` VARCHAR(191) NULL,
    `linkUrl` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `frequency` ENUM('ALWAYS', 'ONCE_PER_SESSION', 'ONCE_PER_DAY') NOT NULL DEFAULT 'ONCE_PER_DAY',
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PromotionPopup_published_startDate_endDate_idx`(`published`, `startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
