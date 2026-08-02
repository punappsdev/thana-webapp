-- Single-row table (id = 1) for site-wide switches. First entry is the mourning
-- mode that renders the homepage in greyscale. Readers fall back to the default
-- values when the row is missing, so seeding it here is a convenience only.

-- CreateTable
CREATE TABLE `SiteSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `mourningMode` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed the one row so the admin page always edits instead of creating.
INSERT INTO `SiteSetting` (`id`, `mourningMode`, `updatedAt`) VALUES (1, false, CURRENT_TIMESTAMP(3));
