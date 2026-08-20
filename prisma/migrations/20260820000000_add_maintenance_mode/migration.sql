-- Site-wide maintenance mode: replaces the public site with an under-construction
-- page while the admin configures the backend or redeploys. Text is editable per
-- locale (TH/EN); null fields fall back to built-in defaults at render time.

-- AlterTable
ALTER TABLE `SiteSetting` ADD COLUMN `maintenanceMessageEn` TEXT NULL,
    ADD COLUMN `maintenanceMessageTh` TEXT NULL,
    ADD COLUMN `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maintenanceTitleEn` VARCHAR(191) NULL,
    ADD COLUMN `maintenanceTitleTh` VARCHAR(191) NULL;
